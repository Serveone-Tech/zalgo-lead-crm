const express = require("express");
const { pool } = require("../db");
const { auth, requireSubscription, requirePlanFeature } = require("../middleware/auth");
const { hasPermission, isOwner } = require("../utils/permissions");
const { phoneKey, findDuplicateLeadByPhone, isValidPhone, cleanPhoneValue } = require("../utils/lead-dedup");
const { getOrCreateCustomerFromLead } = require("../utils/customer-conversion");
const { savePendingLead } = require("../utils/pending-leads");
const { getStageStockActions, isDeductStage, isDeliveredStage, anyDeductStageConfigured, deductStockForOrder } = require("../utils/inventory");
const { createCourierShipmentForOrder } = require("../utils/courier-shipment");
const { sendWhatsAppViaMeta, sendWhatsAppMediaViaMeta } = require("../utils/whatsapp-meta");
const whatsappUpload = require("../middleware/whatsapp-upload");
const fs = require("fs");

let fireTrigger = async () => {}; // safe default
try {
  fireTrigger = require("../utils/automation-trigger").fireTrigger;
} catch (e) {}

const router = express.Router();

// Sub-accounts without view_all_leads only see leads assigned to them.
const visibilityClause = (req, paramIndex) => {
  if (isOwner(req) || hasPermission(req, "view_all_leads")) return { clause: "", params: [] };
  return { clause: ` AND assigned_to=$${paramIndex}`, params: [req.user.id] };
};

// GET all leads
router.get("/", auth, async (req, res) => {
  try {
    const vis = visibilityClause(req, 2);
    const result = await pool.query(
      `SELECT * FROM leads WHERE user_id=$1${vis.clause} ORDER BY created_at DESC`,
      [req.tenantId, ...vis.params],
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET overdue
// "Overdue" = the exact scheduled moment (date+time) has already passed —
// not just that the calendar day has rolled over.
router.get("/overdue", auth, async (req, res) => {
  try {
    const vis = visibilityClause(req, 2);
    const result = await pool.query(
      `SELECT * FROM leads WHERE user_id=$1 AND follow_up_date<NOW() AND stage NOT IN ('Closed','Lost','Converted')${vis.clause} ORDER BY follow_up_date ASC`,
      [req.tenantId, ...vis.params],
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET stats
router.get("/stats", auth, async (req, res) => {
  try {
    const vis = visibilityClause(req, 2);
    const visToday = visibilityClause(req, 2);
    const [total, active, booked, lost, overdue, followup, customers] =
      await Promise.all([
        pool.query(`SELECT COUNT(*) FROM leads WHERE user_id=$1${vis.clause}`, [
          req.tenantId,
          ...vis.params,
        ]),
        // "Active" = not yet in a terminal stage — a literal stage='Active'
        // match was almost always 0 since new leads start on "New" and
        // tenants can rename/reorder their pipeline stages freely. Matches
        // the same Closed/Converted terminal-stage convention already used
        // by the overdue count below.
        pool.query(
          `SELECT COUNT(*) FROM leads WHERE user_id=$1 AND stage NOT IN ('Closed','Lost','Converted')${vis.clause}`,
          [req.tenantId, ...vis.params],
        ),
        pool.query(
          `SELECT COUNT(*) FROM leads WHERE user_id=$1 AND stage='Booked'${vis.clause}`,
          [req.tenantId, ...vis.params],
        ),
        // "Lost" — the other terminal stage besides Converted (won).
        pool.query(
          `SELECT COUNT(*) FROM leads WHERE user_id=$1 AND stage IN ('Closed','Lost')${vis.clause}`,
          [req.tenantId, ...vis.params],
        ),
        // Overdue: scheduled moment already passed (date+time), lead still open
        pool.query(
          `SELECT COUNT(*) FROM leads WHERE user_id=$1 AND follow_up_date<NOW() AND stage NOT IN ('Closed','Lost','Converted')${visToday.clause}`,
          [req.tenantId, ...visToday.params],
        ),
        // Due today: same calendar day as today, and the moment hasn't passed yet
        pool.query(
          `SELECT COUNT(*) FROM leads WHERE user_id=$1 AND follow_up_date::date=CURRENT_DATE AND follow_up_date>=NOW()${visToday.clause}`,
          [req.tenantId, ...visToday.params],
        ),
        pool.query(`SELECT COUNT(*) FROM customers WHERE user_id=$1`, [req.tenantId]),
      ]);
    res.json({
      total: parseInt(total.rows[0].count),
      active: parseInt(active.rows[0].count),
      booked: parseInt(booked.rows[0].count),
      lost: parseInt(lost.rows[0].count),
      overdue: parseInt(overdue.rows[0].count),
      followup_today: parseInt(followup.rows[0].count),
      customers: parseInt(customers.rows[0].count),
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST create lead
router.post("/", auth, requireSubscription, async (req, res) => {
  const {
    name,
    phone,
    email,
    platform,
    platform_link,
    stage,
    last_message,
    follow_up_date,
    notes,
    assigned_to,
  } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });

  // Employees without assign_leads can't hand a lead off to someone else, so
  // a lead they create has nowhere else to go — auto-assign it to themselves
  // instead of leaving it unassigned. Owners/assign_leads holders keep full
  // control over who a new lead lands with (including leaving it unassigned).
  const canAssign = isOwner(req) || hasPermission(req, "assign_leads");
  const finalAssignedTo = canAssign ? (assigned_to || null) : req.user.id;

  try {
    // Enforce max_leads plan limit (-1 = unlimited)
    const maxLeads = req.subscription?.max_leads ?? -1;
    if (maxLeads > 0) {
      const count = await pool.query("SELECT COUNT(*) FROM leads WHERE user_id=$1", [req.tenantId]);
      if (parseInt(count.rows[0].count) >= maxLeads) {
        return res.status(403).json({
          error: "LEAD_LIMIT_REACHED",
          message: `Your plan allows a maximum of ${maxLeads} leads. Please upgrade to add more.`,
        });
      }
    }

    if (phone && phoneKey(phone)) {
      const dup = await findDuplicateLeadByPhone(req.tenantId, phone);
      if (dup) {
        return res.status(409).json({
          error: "DUPLICATE_PHONE",
          message: `A lead with this phone number already exists: "${dup.name}"`,
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO leads (user_id, assigned_to, name, phone, email, platform, platform_link, stage, last_message, follow_up_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        req.tenantId,
        finalAssignedTo,
        name,
        phone || "",
        email || "",
        platform || "LinkedIn",
        platform_link || "",
        stage || "New",
        last_message || "",
        follow_up_date || null,
        notes || "",
      ],
    );
    const lead = result.rows[0];

    // Fire new_lead trigger
    fireTrigger("new_lead", req.tenantId, {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
    }).catch(() => {});

    res.json(lead);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST bulk create leads
router.post("/bulk", auth, async (req, res) => {
  if (!isOwner(req) && !hasPermission(req, "bulk_upload_leads")) {
    return res.status(403).json({ error: "Permission denied" });
  }
  const leads = req.body.leads;
  if (!Array.isArray(leads) || leads.length === 0)
    return res.status(400).json({ error: "No leads provided" });

  // Preload existing phone numbers for this tenant once, so duplicate checks
  // are O(1) per row instead of a query per row. Also catches duplicates
  // that appear more than once within the same uploaded batch.
  const existing = await pool.query(
    `SELECT regexp_replace(phone, '\\D', '', 'g') AS digits FROM leads
     WHERE user_id=$1 AND phone IS NOT NULL AND phone != ''`,
    [req.tenantId],
  );
  const seenPhones = new Set(
    existing.rows.map((r) => r.digits.slice(-10)).filter(Boolean),
  );

  let success = 0, failed = 0, duplicates = 0, pending = 0;
  const duplicateEntries = [];
  for (const lead of leads) {
    if (!lead.name?.trim()) { failed++; continue; }

    // Rows with no usable phone number (blank, or junk like "p:") don't go
    // into Leads — they go to Unverified Leads for manual review instead.
    const rawPhone = lead.phone;
    if (!isValidPhone(rawPhone)) {
      const added = await savePendingLead(req.tenantId, {
        name: lead.name.trim(),
        email: lead.email || "",
        platform: lead.platform || "Other",
        notes: lead.notes || "Auto-captured from bulk upload (no valid phone)",
      });
      if (added) pending++; else duplicates++;
      continue;
    }
    const phone = cleanPhoneValue(rawPhone);

    const key = phoneKey(phone);
    if (key && seenPhones.has(key)) {
      duplicates++;
      if (duplicateEntries.length < 20) {
        duplicateEntries.push({ name: lead.name.trim(), phone });
      }
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO leads (user_id, name, phone, email, platform, platform_link, stage, last_message, follow_up_date, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          req.tenantId,
          lead.name.trim(),
          phone,
          lead.email || "",
          lead.platform || "Other",
          lead.platform_link || "",
          lead.stage || "New",
          lead.last_message || "",
          lead.follow_up_date || null,
          lead.notes || "",
        ]
      );
      success++;
      if (key) seenPhones.add(key);
    } catch { failed++; }
  }
  res.json({ success, failed, duplicates, pending, duplicateEntries });
});

// PUT bulk assign leads to an employee
router.put("/bulk-assign", auth, async (req, res) => {
  const { lead_ids, assigned_to } = req.body;
  if (!Array.isArray(lead_ids) || lead_ids.length === 0)
    return res.status(400).json({ error: "No leads selected" });
  if (!isOwner(req) && !hasPermission(req, "assign_leads"))
    return res.status(403).json({ error: "Permission denied" });
  try {
    const result = await pool.query(
      `UPDATE leads SET assigned_to=$1, updated_at=NOW()
       WHERE id = ANY($2::int[]) AND user_id=$3`,
      [assigned_to || null, lead_ids, req.tenantId],
    );
    // Mirror onto any already-converted Customers for these leads (see the
    // single-lead PUT above for why this has to happen here too).
    await pool.query(
      `UPDATE customers SET assigned_to=$1, updated_at=NOW() WHERE lead_id = ANY($2::int[]) AND user_id=$3`,
      [assigned_to || null, lead_ids, req.tenantId],
    );
    res.json({ updated: result.rowCount });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT bulk change stage for a set of leads
router.put("/bulk-stage", auth, async (req, res) => {
  const { lead_ids, stage } = req.body;
  if (!Array.isArray(lead_ids) || lead_ids.length === 0)
    return res.status(400).json({ error: "No leads selected" });
  if (!stage) return res.status(400).json({ error: "Stage is required" });
  if (!isOwner(req) && !hasPermission(req, "assign_leads"))
    return res.status(403).json({ error: "Permission denied" });
  try {
    // Leads moving INTO "Converted" for the first time also need the
    // Customers-mirror + automation trigger, same as a single-lead edit.
    let toConvert = [];
    if (stage === "Converted") {
      const existing = await pool.query(
        `SELECT id, name, phone, email, platform, platform_link, stage
         FROM leads WHERE id = ANY($1::int[]) AND user_id=$2 AND stage != 'Converted'`,
        [lead_ids, req.tenantId],
      );
      toConvert = existing.rows;
    }

    const result = await pool.query(
      `UPDATE leads SET stage=$1, updated_at=NOW()
       WHERE id = ANY($2::int[]) AND user_id=$3`,
      [stage, lead_ids, req.tenantId],
    );

    for (const lead of toConvert) {
      await getOrCreateCustomerFromLead(req.tenantId, lead);
    }

    res.json({ updated: result.rowCount });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE bulk delete leads (owner or delete_leads permission)
router.delete("/bulk", auth, async (req, res) => {
  const { lead_ids } = req.body;
  if (!Array.isArray(lead_ids) || lead_ids.length === 0)
    return res.status(400).json({ error: "No leads selected" });
  if (!isOwner(req) && !hasPermission(req, "delete_leads"))
    return res.status(403).json({ error: "Permission denied" });
  try {
    const result = await pool.query(
      `DELETE FROM leads WHERE id = ANY($1::int[]) AND user_id=$2`,
      [lead_ids, req.tenantId],
    );
    res.json({ deleted: result.rowCount });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET employee-wise lead report (owner / view_all_leads only)
router.get("/report/by-employee", auth, async (req, res) => {
  if (!isOwner(req) && !hasPermission(req, "view_all_leads"))
    return res.status(403).json({ error: "Permission denied" });
  try {
    const emps = await pool.query(
      `SELECT id, name, role_label FROM users WHERE parent_id=$1 ORDER BY name ASC`,
      [req.tenantId],
    );

    // Stage-level counts for all leads under this tenant
    const stageCounts = await pool.query(
      `SELECT
         assigned_to,
         stage,
         COUNT(*) AS cnt,
         COUNT(CASE WHEN follow_up_date < NOW() AND stage NOT IN ('Closed','Lost','Converted') THEN 1 END) AS overdue
       FROM leads WHERE user_id=$1
       GROUP BY assigned_to, stage`,
      [req.tenantId],
    );

    res.json({ employees: emps.rows, stage_counts: stageCounts.rows });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update lead
router.put("/:id", auth, async (req, res) => {
  const {
    name,
    phone,
    email,
    platform,
    platform_link,
    stage,
    last_message,
    follow_up_date,
    notes,
    assigned_to,
  } = req.body;
  try {
    const existing = await pool.query(
      "SELECT * FROM leads WHERE id=$1 AND user_id=$2",
      [req.params.id, req.tenantId],
    );
    const lead = existing.rows[0];
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const canSeeAll = isOwner(req) || hasPermission(req, "view_all_leads");
    const isAssignee = lead.assigned_to === req.user.id;
    if (!canSeeAll && !isAssignee) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const canAssign = isOwner(req) || hasPermission(req, "assign_leads");
    const nextAssignedTo = canAssign && assigned_to !== undefined
      ? (assigned_to || null)
      : lead.assigned_to;

    // Name stays editable by whoever can already touch this lead (assignee
    // or above) — only the more sensitive contact/source fields (phone,
    // email, platform, platform_link) require owner or edit_lead_details.
    const canEditDetails = isOwner(req) || hasPermission(req, "edit_lead_details");
    const nextName = name || lead.name;
    const nextPhone = canEditDetails ? (phone ?? lead.phone) : lead.phone;
    const nextEmail = canEditDetails ? (email ?? lead.email) : lead.email;
    const nextPlatform = canEditDetails ? (platform || lead.platform) : lead.platform;
    const nextPlatformLink = canEditDetails ? (platform_link ?? lead.platform_link) : lead.platform_link;

    if (nextPhone && phoneKey(nextPhone) !== phoneKey(lead.phone)) {
      const dup = await findDuplicateLeadByPhone(req.tenantId, nextPhone, lead.id);
      if (dup) {
        return res.status(409).json({
          error: "DUPLICATE_PHONE",
          message: `A lead with this phone number already exists: "${dup.name}"`,
        });
      }
    }

    const oldStage = lead.stage;
    const result = await pool.query(
      `UPDATE leads SET name=$1, phone=$2, email=$3, platform=$4, platform_link=$5,
       stage=$6, last_message=$7, follow_up_date=$8, notes=$9, assigned_to=$10, updated_at=NOW()
       WHERE id=$11 AND user_id=$12 RETURNING *`,
      [
        nextName,
        nextPhone,
        nextEmail,
        nextPlatform,
        nextPlatformLink,
        stage,
        last_message,
        follow_up_date || null,
        notes,
        nextAssignedTo,
        req.params.id,
        req.tenantId,
      ],
    );
    const updated = result.rows[0];

    // Auto-create customer when converted (only once)
    if (stage === "Converted" && oldStage !== "Converted") {
      await getOrCreateCustomerFromLead(req.tenantId, updated);
    }

    // Keep the linked Customer record's assignment in sync — a customer is
    // only ever created from a lead, but assignment can keep changing on the
    // Leads page long after conversion, and that shouldn't silently drift
    // out of sync with the Customers view.
    await pool.query(
      `UPDATE customers SET assigned_to=$1, updated_at=NOW() WHERE lead_id=$2 AND user_id=$3`,
      [updated.assigned_to, updated.id, req.tenantId],
    );

    res.json(updated);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE lead
router.delete("/:id", auth, async (req, res) => {
  if (!isOwner(req) && !hasPermission(req, "delete_leads")) {
    return res.status(403).json({ error: "Permission denied" });
  }
  try {
    await pool.query("DELETE FROM leads WHERE id=$1 AND user_id=$2", [
      req.params.id,
      req.tenantId,
    ]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET conversation log for a lead
router.get("/:id/messages", auth, async (req, res) => {
  try {
    const lead = await pool.query(
      "SELECT id, assigned_to FROM leads WHERE id=$1 AND user_id=$2",
      [req.params.id, req.tenantId],
    );
    if (!lead.rows[0]) return res.status(404).json({ error: "Lead not found" });
    const canSeeAll = isOwner(req) || hasPermission(req, "view_all_leads");
    if (!canSeeAll && lead.rows[0].assigned_to !== req.user.id) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const result = await pool.query(
      `SELECT lm.*, u.name as author_name FROM lead_messages lm
       LEFT JOIN users u ON u.id = lm.user_id
       WHERE lm.lead_id=$1 ORDER BY lm.message_date DESC, lm.created_at DESC`,
      [req.params.id],
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST add a dated conversation entry
router.post("/:id/messages", auth, async (req, res) => {
  const { message, message_date } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });
  try {
    const lead = await pool.query(
      "SELECT id, assigned_to FROM leads WHERE id=$1 AND user_id=$2",
      [req.params.id, req.tenantId],
    );
    if (!lead.rows[0]) return res.status(404).json({ error: "Lead not found" });
    const canSeeAll = isOwner(req) || hasPermission(req, "view_all_leads");
    if (!canSeeAll && lead.rows[0].assigned_to !== req.user.id) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const result = await pool.query(
      `INSERT INTO lead_messages (lead_id, user_id, message, message_date)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.user.id, message, message_date || new Date().toISOString()],
    );

    await pool.query(
      "UPDATE leads SET last_message=$1, updated_at=NOW() WHERE id=$2",
      [message, req.params.id],
    );

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST send a live WhatsApp reply — unlike the note-only route above, this
// actually calls Meta's API to deliver the message, then logs it the same
// way an inbound message gets logged, so the two sides of the conversation
// sit in one thread.
router.post("/:id/whatsapp-send", auth, requireSubscription, requirePlanFeature("automation"), async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Message required" });
  try {
    const lead = await pool.query(
      "SELECT id, phone, assigned_to FROM leads WHERE id=$1 AND user_id=$2",
      [req.params.id, req.tenantId],
    );
    if (!lead.rows[0]) return res.status(404).json({ error: "Lead not found" });
    const canSeeAll = isOwner(req) || hasPermission(req, "view_all_leads");
    if (!canSeeAll && lead.rows[0].assigned_to !== req.user.id) {
      return res.status(403).json({ error: "Permission denied" });
    }
    if (!lead.rows[0].phone) return res.status(400).json({ error: "This lead has no phone number" });

    const credsRes = await pool.query(
      "SELECT * FROM automation_credentials WHERE user_id=$1",
      [req.tenantId],
    );
    const creds = credsRes.rows[0];
    if (!creds?.whatsapp_enabled) {
      return res.status(400).json({ error: "WhatsApp isn't connected — set it up under Automation first" });
    }

    await sendWhatsAppViaMeta(creds, lead.rows[0].phone, message.trim());

    const result = await pool.query(
      `INSERT INTO lead_messages (lead_id, user_id, message, message_date, direction)
       VALUES ($1,$2,$3,NOW(),'out') RETURNING *`,
      [req.params.id, req.user.id, message.trim()],
    );
    await pool.query(
      "UPDATE leads SET last_message=$1, updated_at=NOW() WHERE id=$2",
      [message.trim(), req.params.id],
    );

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to send WhatsApp message" });
  }
});

const WA_TYPE_BY_MIME_PREFIX = { image: "image", audio: "audio", video: "video" };

// POST send a live WhatsApp media reply (image/document/audio/video) —
// same idea as the text route above, but the file goes to Meta's media
// store first and gets referenced by id in the actual message.
router.post(
  "/:id/whatsapp-send-media",
  auth,
  requireSubscription,
  requirePlanFeature("automation"),
  (req, res) => {
    whatsappUpload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      try {
        const lead = await pool.query(
          "SELECT id, phone, assigned_to FROM leads WHERE id=$1 AND user_id=$2",
          [req.params.id, req.tenantId],
        );
        if (!lead.rows[0]) return res.status(404).json({ error: "Lead not found" });
        const canSeeAll = isOwner(req) || hasPermission(req, "view_all_leads");
        if (!canSeeAll && lead.rows[0].assigned_to !== req.user.id) {
          return res.status(403).json({ error: "Permission denied" });
        }
        if (!lead.rows[0].phone) return res.status(400).json({ error: "This lead has no phone number" });

        const credsRes = await pool.query("SELECT * FROM automation_credentials WHERE user_id=$1", [req.tenantId]);
        const creds = credsRes.rows[0];
        if (!creds?.whatsapp_enabled) {
          return res.status(400).json({ error: "WhatsApp isn't connected — set it up under Automation first" });
        }

        const mimePrefix = req.file.mimetype.split("/")[0];
        const type = WA_TYPE_BY_MIME_PREFIX[mimePrefix] || "document";
        const buffer = fs.readFileSync(req.file.path);
        const caption = (req.body.caption || "").trim();

        await sendWhatsAppMediaViaMeta(creds, lead.rows[0].phone, {
          buffer,
          mimeType: req.file.mimetype,
          filename: req.file.originalname,
          type,
          caption,
        });

        const mediaUrl = `/uploads/whatsapp-media/${req.file.filename}`;
        const result = await pool.query(
          `INSERT INTO lead_messages (lead_id, user_id, message, message_date, direction, media_url, media_type, media_name)
           VALUES ($1,$2,$3,NOW(),'out',$4,$5,$6) RETURNING *`,
          [req.params.id, req.user.id, caption || `[${type}]`, mediaUrl, type, req.file.originalname],
        );
        await pool.query(
          "UPDATE leads SET last_message=$1, updated_at=NOW() WHERE id=$2",
          [caption || `[${type}]`, req.params.id],
        );

        res.json(result.rows[0]);
      } catch (e) {
        res.status(500).json({ error: e.message || "Failed to send WhatsApp media" });
      }
    });
  },
);

// POST fulfil an order for a lead — creates/reuses the matching Customer
// record (same as a stage-based conversion) and logs the order + items
// against it. Used by the "Fulfill Order" action shown once a lead reaches
// the admin-configured order-fulfillment stage. Open to every employee, no
// permission required — anyone working a lead should be able to log its
// order without needing to be granted manage_customers separately.
router.post("/:id/fulfill-order", auth, async (req, res) => {
  const {
    name,
    email,
    alternate_phone,
    address,
    city,
    state,
    pincode,
    amount,
    payment_type,
    advance_paid,
    next_due_date,
    tracking_id,
    provider,
    order_type,
    stage,
    notes,
    items,
    package_weight_kg,
    package_length_cm,
    package_width_cm,
    package_height_cm,
  } = req.body;

  try {
    const leadRes = await pool.query(
      "SELECT * FROM leads WHERE id=$1 AND user_id=$2",
      [req.params.id, req.tenantId],
    );
    const lead = leadRes.rows[0];
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const customer = await getOrCreateCustomerFromLead(req.tenantId, lead);

    await pool.query(
      `UPDATE customers SET name=COALESCE($1, name), email=COALESCE($2, email),
       alternate_phone=$3, address=$4, pincode=$5, updated_at=NOW() WHERE id=$6 AND user_id=$7`,
      [
        name || null,
        email || null,
        alternate_phone || "",
        address || "",
        pincode || "",
        customer.id,
        req.tenantId,
      ],
    );

    // Prepaid orders are fully collected up front — advance_paid always
    // equals the order amount so the balance-due math elsewhere ("amount -
    // advance_paid") comes out to zero without needing a separate branch.
    const orderAmount = parseFloat(amount) || 0;
    const isCod = payment_type === "cod";
    const orderAdvance = isCod ? parseFloat(advance_paid) || 0 : orderAmount;

    const orderRes = await pool.query(
      `INSERT INTO customer_orders
        (user_id, customer_id, address, city, state, pincode, amount, payment_type, advance_paid, next_due_date, tracking_id, provider, stage, notes, package_weight_kg, package_length_cm, package_width_cm, package_height_cm, created_by, order_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
      [
        req.tenantId,
        customer.id,
        address || "",
        city || "",
        state || "",
        pincode || "",
        orderAmount,
        isCod ? "cod" : "prepaid",
        orderAdvance,
        next_due_date || null,
        tracking_id || "",
        provider || "",
        stage || "",
        notes || "",
        package_weight_kg !== undefined && package_weight_kg !== "" ? parseFloat(package_weight_kg) : null,
        package_length_cm !== undefined && package_length_cm !== "" ? parseFloat(package_length_cm) : null,
        package_width_cm !== undefined && package_width_cm !== "" ? parseFloat(package_width_cm) : null,
        package_height_cm !== undefined && package_height_cm !== "" ? parseFloat(package_height_cm) : null,
        req.user.id,
        order_type === "REPEAT" ? "REPEAT" : "FRESH",
      ],
    );
    const order = orderRes.rows[0];

    const itemRows = Array.isArray(items) ? items.filter((i) => i?.name?.trim()) : [];
    for (const item of itemRows) {
      const qty = parseInt(item.quantity) || 1;
      const invId = item.inventory_item_id ? parseInt(item.inventory_item_id) : null;
      await pool.query(
        "INSERT INTO order_items (order_id, inventory_item_id, name, quantity, price) VALUES ($1,$2,$3,$4,$5)",
        [order.id, invId, item.name.trim(), qty, parseFloat(item.price) || 0],
      );
    }

    // If the admin has marked any stage(s) as a stock-deduct trigger, only
    // draw down inventory now when this order is already starting on one of
    // them — otherwise it waits for a later stage change (see the order PUT
    // route in customers.js). No deduct stage configured anywhere means
    // "not using this feature" — keep the original immediate-deduct behavior.
    const stageRows = await getStageStockActions(req.tenantId);
    if (!anyDeductStageConfigured(stageRows) || isDeductStage(stageRows, stage || "")) {
      await deductStockForOrder(order.id, req.tenantId);
      // Same moment stock draws down is when the order should ship — create
      // it at whichever courier was picked (no-op if none was selected).
      await createCourierShipmentForOrder(order.id, req.tenantId);
    }
    // Rare, but an order can be fulfilled directly onto a delivered stage
    // (e.g. a walk-in sale logged after the fact) — the Sales Report needs
    // delivered_at set for it too, same as the stage-change path below.
    if (isDeliveredStage(stageRows, stage || "")) {
      await pool.query("UPDATE customer_orders SET delivered_at=NOW() WHERE id=$1", [order.id]);
    }

    res.json({ customer_id: customer.id, order_id: order.id });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
