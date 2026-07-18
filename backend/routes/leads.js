const express = require("express");
const { pool } = require("../db");
const { auth, requireSubscription } = require("../middleware/auth");
const { hasPermission, isOwner } = require("../utils/permissions");

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
router.get("/overdue", auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const vis = visibilityClause(req, 3);
    const result = await pool.query(
      `SELECT * FROM leads WHERE user_id=$1 AND follow_up_date<$2 AND stage NOT IN ('Closed','Converted')${vis.clause} ORDER BY follow_up_date ASC`,
      [req.tenantId, today, ...vis.params],
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET stats
router.get("/stats", auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const vis = visibilityClause(req, 2);
    const visToday = visibilityClause(req, 3);
    const [total, active, booked, overdue, followup, customers] =
      await Promise.all([
        pool.query(`SELECT COUNT(*) FROM leads WHERE user_id=$1${vis.clause}`, [
          req.tenantId,
          ...vis.params,
        ]),
        pool.query(
          `SELECT COUNT(*) FROM leads WHERE user_id=$1 AND stage='Active'${vis.clause}`,
          [req.tenantId, ...vis.params],
        ),
        pool.query(
          `SELECT COUNT(*) FROM leads WHERE user_id=$1 AND stage='Booked'${vis.clause}`,
          [req.tenantId, ...vis.params],
        ),
        pool.query(
          `SELECT COUNT(*) FROM leads WHERE user_id=$1 AND follow_up_date<$2 AND stage NOT IN ('Closed','Converted')${visToday.clause}`,
          [req.tenantId, today, ...visToday.params],
        ),
        pool.query(
          `SELECT COUNT(*) FROM leads WHERE user_id=$1 AND follow_up_date=$2${visToday.clause}`,
          [req.tenantId, today, ...visToday.params],
        ),
        pool.query(`SELECT COUNT(*) FROM customers WHERE user_id=$1`, [req.tenantId]),
      ]);
    res.json({
      total: parseInt(total.rows[0].count),
      active: parseInt(active.rows[0].count),
      booked: parseInt(booked.rows[0].count),
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

  const canAssign = isOwner(req) || hasPermission(req, "assign_leads");
  const finalAssignedTo = canAssign && assigned_to ? assigned_to : null;

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
  const leads = req.body.leads;
  if (!Array.isArray(leads) || leads.length === 0)
    return res.status(400).json({ error: "No leads provided" });

  let success = 0, failed = 0;
  for (const lead of leads) {
    if (!lead.name?.trim()) { failed++; continue; }
    try {
      await pool.query(
        `INSERT INTO leads (user_id, name, phone, email, platform, platform_link, stage, last_message, follow_up_date, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          req.tenantId,
          lead.name.trim(),
          lead.phone || "",
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
    } catch { failed++; }
  }
  res.json({ success, failed });
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
         COUNT(CASE WHEN follow_up_date < CURRENT_DATE AND stage NOT IN ('Closed','Converted') THEN 1 END) AS overdue
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

    // Sensitive fields (name, phone, email, platform, platform_link) can only be
    // changed by owner or someone with edit_lead_details permission
    const canEditDetails = isOwner(req) || hasPermission(req, "edit_lead_details");
    const nextName = canEditDetails ? (name || lead.name) : lead.name;
    const nextPhone = canEditDetails ? (phone ?? lead.phone) : lead.phone;
    const nextEmail = canEditDetails ? (email ?? lead.email) : lead.email;
    const nextPlatform = canEditDetails ? (platform || lead.platform) : lead.platform;
    const nextPlatformLink = canEditDetails ? (platform_link ?? lead.platform_link) : lead.platform_link;

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
      const existingCustomer = await pool.query(
        "SELECT id FROM customers WHERE lead_id=$1",
        [updated.id],
      );
      if (existingCustomer.rows.length === 0) {
        // Check which columns exist in customers table
        const colCheck = await pool.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name='customers'`,
        );
        const cols = colCheck.rows.map((r) => r.column_name);

        // Build INSERT dynamically based on existing columns
        const fields = ["user_id", "lead_id", "name"];
        const values = [req.tenantId, updated.id, updated.name];

        if (cols.includes("phone")) {
          fields.push("phone");
          values.push(updated.phone || "");
        }
        if (cols.includes("email")) {
          fields.push("email");
          values.push(updated.email || "");
        }
        if (cols.includes("platform")) {
          fields.push("platform");
          values.push(updated.platform || "");
        }
        if (cols.includes("platform_link")) {
          fields.push("platform_link");
          values.push(updated.platform_link || "");
        }
        fields.push("total_fee", "amount_paid");
        values.push(0, 0);

        const placeholders = values.map((_, i) => `$${i + 1}`).join(",");
        await pool.query(
          `INSERT INTO customers (${fields.join(",")}) VALUES (${placeholders})`,
          values,
        );
      }

      // Fire lead_converted trigger
      fireTrigger("lead_converted", req.tenantId, {
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
      }).catch(() => {});
    }

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
      [req.params.id, req.user.id, message, message_date || new Date().toISOString().split("T")[0]],
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

module.exports = router;
