// Dedicated Meta WhatsApp Template Builder API — draft/edit/validate/submit/
// duplicate/sync-status/list templates, plus a submission audit trail.
// Reuses the app's existing auth/tenant/permission/subscription middleware
// (no parallel auth system) and the same whatsapp_templates table the
// original automation.js routes use (extended, not replaced) so broadcast
// and every existing template stay intact. The legacy flat-field routes
// under /api/automation/whatsapp-templates* are left in place unmodified
// for backward compatibility; this file is the new builder's surface.

const express = require("express");
const fs = require("fs");
const { pool } = require("../db");
const { auth, requirePermission, requireSubscription, requirePlanFeature } = require("../middleware/auth");
const { validateTemplate, buildMetaComponents, slugifyTemplateName, CATEGORIES } = require("../utils/meta-template-validator");
const { createTemplate, fetchTemplateStatus, deleteTemplate } = require("../utils/whatsapp-templates");
const { uploadTemplateHeaderMedia } = require("../utils/meta-media-upload");
const { templateMediaUpload, LIMITS_BY_FORMAT } = require("../middleware/template-media-upload");

const router = express.Router();
const gate = [auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation")];

// A template can only be freely edited while it hasn't been accepted for
// review yet, or if Meta rejected/errored it — an approved/pending template
// on Meta can't be silently overwritten locally, since the row's
// meta_template_id then refers to a real, possibly-live template on Meta's
// side. Editing those is done via Duplicate As New Template instead.
const EDITABLE_STATUSES = ["draft", "rejected", "error"];
// (Only templates Meta has actually approved should ever be offered to the
// broadcast module — enforced by automation.js's own broadcast route via
// `status='approved'` in its SQL, not here.)

function rowToTemplateConfig(row) {
  const components = row.components && Object.keys(row.components).length > 0
    ? row.components
    : {
        header: row.header_text?.trim() ? { format: "TEXT", text: row.header_text, variables: [] } : { format: "NONE" },
        body: { text: row.body_text, variables: [] },
        footer: { text: row.footer_text || "" },
        buttons: row.buttons || [],
      };
  return {
    name: row.name,
    category: row.category,
    language: row.language,
    header: components.header || { format: "NONE" },
    body: components.body || { text: row.body_text, variables: [] },
    footer: components.footer || { text: row.footer_text || "" },
    buttons: components.buttons || row.buttons || [],
    carousel: components.carousel || { cards: [] },
  };
}

function serializeTemplate(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    language: row.language,
    status: row.status,
    meta_template_id: row.meta_template_id,
    rejection_reason: row.rejection_reason,
    header_format: row.header_format,
    components: rowToTemplateConfig(row),
    submitted_at: row.submitted_at,
    approved_at: row.approved_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Keeps the legacy flat columns (still read by the old automation.js
// template tab and by anything that lists templates without going through
// this builder) in sync with whatever the structured `components` JSON says
// — so both surfaces always show the same content for the same row.
function flattenForLegacyColumns(tpl) {
  return {
    header_text: tpl.header?.format === "TEXT" ? tpl.header.text || "" : "",
    body_text: tpl.body?.text || "",
    footer_text: tpl.footer?.text || "",
    buttons: JSON.stringify(tpl.buttons || []),
  };
}

async function getOwnedTemplate(id, tenantId) {
  const res = await pool.query("SELECT * FROM whatsapp_templates WHERE id=$1 AND user_id=$2", [id, tenantId]);
  return res.rows[0] || null;
}

// ── GET list — filter by status/category, search by name ──────────────
router.get("/", ...gate, async (req, res) => {
  try {
    const { status, category, q } = req.query;
    const conditions = ["user_id=$1"];
    const params = [req.tenantId];
    if (status) {
      params.push(status);
      conditions.push(`status=$${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category=$${params.length}`);
    }
    if (q?.trim()) {
      params.push(`%${q.trim()}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }
    const result = await pool.query(
      `SELECT * FROM whatsapp_templates WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`,
      params,
    );
    res.json(result.rows.map(serializeTemplate));
  } catch (e) {
    console.error("Template list failed:", e.message);
    res.status(500).json({ error: "Could not load templates" });
  }
});

// ── GET one ──────────────────────────────────────────────────────────
router.get("/:id", ...gate, async (req, res) => {
  try {
    const tpl = await getOwnedTemplate(req.params.id, req.tenantId);
    if (!tpl) return res.status(404).json({ error: "Template not found" });
    res.json(serializeTemplate(tpl));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET submission history ──────────────────────────────────────────
router.get("/:id/submissions", ...gate, async (req, res) => {
  try {
    const tpl = await getOwnedTemplate(req.params.id, req.tenantId);
    if (!tpl) return res.status(404).json({ error: "Template not found" });
    const result = await pool.query(
      "SELECT id, payload, response, http_status, status, meta_error_code, meta_error_message, submitted_at FROM whatsapp_template_submissions WHERE template_id=$1 ORDER BY submitted_at DESC",
      [tpl.id],
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST validate (does not persist) — powers the frontend's validation
// panel as an authoritative backend re-check before Submit is enabled ────
router.post("/validate", ...gate, async (req, res) => {
  const result = validateTemplate(req.body);
  res.json(result);
});

// ── POST media/upload?format=IMAGE|VIDEO|DOCUMENT — saves the file locally
// (so the builder can preview/re-edit it) AND pushes it through Meta's
// Resumable Upload API to get the media "handle" a HEADER component's
// example needs. Returns both; the frontend stores them on header.media_url
// / header.media_handle. Never touches whatsapp_templates directly — this
// is a standalone upload step before/independent of saving the template.
router.post("/media/upload", ...gate, (req, res, next) => {
  templateMediaUpload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  const format = (req.query.format || "").toUpperCase();
  const limits = LIMITS_BY_FORMAT[format];
  if (!req.file || !limits) {
    return res.status(400).json({ error: "No file uploaded, or format must be IMAGE, VIDEO, or DOCUMENT" });
  }
  if (req.file.size > limits.maxSize) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: `${format} headers must be ${Math.round(limits.maxSize / 1024 / 1024)}MB or smaller` });
  }

  try {
    const credRes = await pool.query("SELECT meta_app_id, wa_auth_token FROM automation_credentials WHERE user_id=$1", [req.tenantId]);
    const creds = credRes.rows[0];
    if (!creds?.meta_app_id || !creds?.wa_auth_token) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "Add your Meta App ID and Access Token under Automation → Channel Setup first" });
    }

    const buffer = fs.readFileSync(req.file.path);
    const handle = await uploadTemplateHeaderMedia(creds.meta_app_id, creds.wa_auth_token, { buffer, mimeType: req.file.mimetype });

    res.json({
      media_url: `/uploads/whatsapp-template-media/${req.file.filename}`,
      media_handle: handle,
      mime_type: req.file.mimetype,
      file_name: req.file.originalname,
    });
  } catch (e) {
    fs.unlink(req.file.path, () => {});
    console.error("Template media upload failed:", e.message);
    res.status(400).json({ error: e.message || "Could not upload media to Meta" });
  }
});

// ── POST create — saves as DRAFT only. Never calls Meta by itself; a
// template is only submitted for review via the explicit /submit action ──
router.post("/", ...gate, async (req, res) => {
  try {
    const tpl = req.body;
    const slug = slugifyTemplateName(tpl.name);
    if (!slug) return res.status(400).json({ error: "Template name must contain letters or numbers" });

    const dupe = await pool.query(
      "SELECT id FROM whatsapp_templates WHERE user_id=$1 AND name=$2 AND language=$3",
      [req.tenantId, slug, tpl.language || "en_US"],
    );
    if (dupe.rows[0]) {
      return res.status(409).json({ error: `A template named "${slug}" already exists in this language.` });
    }

    const cat = CATEGORIES.includes(tpl.category) ? tpl.category : "MARKETING";
    const components = { header: tpl.header || { format: "NONE" }, body: tpl.body || { text: "" }, footer: tpl.footer || { text: "" }, buttons: tpl.buttons || [], carousel: tpl.carousel || { cards: [] } };
    const legacy = flattenForLegacyColumns(components);
    const variableCount = (tpl.body?.variables || []).length;

    const result = await pool.query(
      `INSERT INTO whatsapp_templates
        (user_id, name, language, category, header_text, body_text, footer_text, buttons, variable_count, header_format, components, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'draft') RETURNING *`,
      [req.tenantId, slug, tpl.language || "en_US", cat, legacy.header_text, legacy.body_text, legacy.footer_text, legacy.buttons, variableCount, components.header?.format || "NONE", JSON.stringify(components)],
    );
    res.status(201).json(serializeTemplate(result.rows[0]));
  } catch (e) {
    console.error("Template draft create failed:", e.message);
    res.status(400).json({ error: e.message || "Could not save template" });
  }
});

// ── PUT update — only while still editable (draft/rejected/error) ──────
router.put("/:id", ...gate, async (req, res) => {
  try {
    const existing = await getOwnedTemplate(req.params.id, req.tenantId);
    if (!existing) return res.status(404).json({ error: "Template not found" });
    if (!EDITABLE_STATUSES.includes(existing.status)) {
      return res.status(409).json({
        error: `This template is ${existing.status} on Meta and can't be edited directly. Use "Duplicate as New Template" to create an editable copy.`,
      });
    }

    const tpl = req.body;
    const slug = slugifyTemplateName(tpl.name || existing.name);
    if (!slug) return res.status(400).json({ error: "Template name must contain letters or numbers" });

    if (slug !== existing.name || (tpl.language || existing.language) !== existing.language) {
      const dupe = await pool.query(
        "SELECT id FROM whatsapp_templates WHERE user_id=$1 AND name=$2 AND language=$3 AND id<>$4",
        [req.tenantId, slug, tpl.language || existing.language, existing.id],
      );
      if (dupe.rows[0]) return res.status(409).json({ error: `A template named "${slug}" already exists in this language.` });
    }

    const cat = CATEGORIES.includes(tpl.category) ? tpl.category : existing.category;
    const components = { header: tpl.header || { format: "NONE" }, body: tpl.body || { text: "" }, footer: tpl.footer || { text: "" }, buttons: tpl.buttons || [], carousel: tpl.carousel || { cards: [] } };
    const legacy = flattenForLegacyColumns(components);
    const variableCount = (tpl.body?.variables || []).length;

    const result = await pool.query(
      `UPDATE whatsapp_templates SET
         name=$1, language=$2, category=$3, header_text=$4, body_text=$5, footer_text=$6,
         buttons=$7, variable_count=$8, header_format=$9, components=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [slug, tpl.language || existing.language, cat, legacy.header_text, legacy.body_text, legacy.footer_text, legacy.buttons, variableCount, components.header?.format || "NONE", JSON.stringify(components), existing.id],
    );
    res.json(serializeTemplate(result.rows[0]));
  } catch (e) {
    console.error("Template update failed:", e.message);
    res.status(400).json({ error: e.message || "Could not update template" });
  }
});

// ── POST duplicate — always starts a fresh DRAFT, never copies Meta id/status
router.post("/:id/duplicate", ...gate, async (req, res) => {
  try {
    const existing = await getOwnedTemplate(req.params.id, req.tenantId);
    if (!existing) return res.status(404).json({ error: "Template not found" });

    // summer_sale -> summer_sale_copy, summer_sale_copy2, summer_sale_copy3...
    let base = `${existing.name}_copy`;
    let candidate = base;
    let n = 2;
    while ((await pool.query("SELECT 1 FROM whatsapp_templates WHERE user_id=$1 AND name=$2 AND language=$3", [req.tenantId, candidate, existing.language])).rows[0]) {
      candidate = `${base}${n++}`;
    }

    const result = await pool.query(
      `INSERT INTO whatsapp_templates
        (user_id, name, language, category, header_text, body_text, footer_text, buttons, variable_count, header_format, components, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'draft') RETURNING *`,
      [req.tenantId, candidate, existing.language, existing.category, existing.header_text, existing.body_text, existing.footer_text, JSON.stringify(existing.buttons || []), existing.variable_count, existing.header_format, JSON.stringify(existing.components || {})],
    );
    res.status(201).json(serializeTemplate(result.rows[0]));
  } catch (e) {
    console.error("Template duplicate failed:", e.message);
    res.status(400).json({ error: e.message || "Could not duplicate template" });
  }
});

// ── DELETE — locally, and on Meta if it was ever submitted ─────────────
router.delete("/:id", ...gate, async (req, res) => {
  try {
    const tpl = await getOwnedTemplate(req.params.id, req.tenantId);
    if (!tpl) return res.status(404).json({ error: "Template not found" });

    if (tpl.meta_template_id) {
      const credRes = await pool.query("SELECT wa_from, wa_auth_token FROM automation_credentials WHERE user_id=$1", [req.tenantId]);
      const creds = credRes.rows[0];
      if (creds?.wa_from && creds?.wa_auth_token) {
        await deleteTemplate(creds.wa_from, creds.wa_auth_token, tpl.name).catch((e) => console.error("Meta delete failed:", e.message));
      }
    }
    await pool.query("DELETE FROM whatsapp_templates WHERE id=$1", [tpl.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("Template delete failed:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST submit for Meta review ─────────────────────────────────────────
router.post("/:id/submit", ...gate, async (req, res) => {
  const tpl = await getOwnedTemplate(req.params.id, req.tenantId);
  if (!tpl) return res.status(404).json({ error: "Template not found" });
  if (!EDITABLE_STATUSES.includes(tpl.status)) {
    return res.status(409).json({ error: `This template is already ${tpl.status} — it can't be re-submitted. Duplicate it to submit a new version.` });
  }

  const config = rowToTemplateConfig(tpl);
  const validation = validateTemplate(config);
  if (!validation.valid) {
    return res.status(422).json({ error: "Template failed validation — fix the listed issues before submitting.", validation });
  }

  const credRes = await pool.query("SELECT wa_from, wa_account_sid, wa_auth_token FROM automation_credentials WHERE user_id=$1", [req.tenantId]);
  const creds = credRes.rows[0];
  if (!creds?.wa_from || !creds?.wa_auth_token) {
    return res.status(400).json({ error: "Add your WhatsApp Business Account ID and access token under Automation → Channel Setup first" });
  }

  const payload = { name: tpl.name, language: tpl.language, category: tpl.category, components: buildMetaComponents(config) };
  await pool.query("UPDATE whatsapp_templates SET status='submitting', updated_at=NOW() WHERE id=$1", [tpl.id]);

  try {
    const metaResult = await createTemplate(creds.wa_from, creds.wa_auth_token, config);
    const status = (metaResult.status || "PENDING").toLowerCase();

    await pool.query(
      `INSERT INTO whatsapp_template_submissions (template_id, user_id, payload, response, http_status, status, submitted_at)
       VALUES ($1,$2,$3,$4,200,$5,NOW())`,
      [tpl.id, req.tenantId, JSON.stringify(payload), JSON.stringify(metaResult), status],
    );
    const updated = await pool.query(
      `UPDATE whatsapp_templates SET status=$1, meta_template_id=$2, waba_id=$3, phone_number_id=$4, submitted_at=NOW(), updated_at=NOW() WHERE id=$5 RETURNING *`,
      [status, metaResult.id, creds.wa_from, creds.wa_account_sid || "", tpl.id],
    );
    res.json(serializeTemplate(updated.rows[0]));
  } catch (e) {
    // Never lose the user's work on a failed submission — the template
    // falls back to 'error' (still editable) rather than staying stuck on
    // 'submitting', and the raw Meta error is preserved for diagnosis.
    console.error("Template submit failed:", e.message);
    await pool.query(
      `INSERT INTO whatsapp_template_submissions (template_id, user_id, payload, response, http_status, status, meta_error_code, meta_error_message, submitted_at)
       VALUES ($1,$2,$3,$4,$5,'error',$6,$7,NOW())`,
      [tpl.id, req.tenantId, JSON.stringify(payload), JSON.stringify(e.metaError || null), e.httpStatus || null, String(e.metaError?.code || ""), e.message],
    );
    await pool.query("UPDATE whatsapp_templates SET status='error', rejection_reason=$1, updated_at=NOW() WHERE id=$2", [e.message, tpl.id]);
    res.status(400).json({
      error: e.message || "Meta rejected this template",
      meta_error_code: e.metaError?.code,
      meta_error_message: e.metaError?.message,
      http_status: e.httpStatus,
    });
  }
});

// ── POST sync-status — manual "Refresh Status" pull from Meta ──────────
router.post("/:id/sync-status", ...gate, async (req, res) => {
  try {
    const tpl = await getOwnedTemplate(req.params.id, req.tenantId);
    if (!tpl) return res.status(404).json({ error: "Template not found" });
    if (!tpl.meta_template_id) return res.status(400).json({ error: "This template hasn't been submitted to Meta yet" });

    const credRes = await pool.query("SELECT wa_from, wa_auth_token FROM automation_credentials WHERE user_id=$1", [req.tenantId]);
    const creds = credRes.rows[0];
    if (!creds?.wa_from || !creds?.wa_auth_token) return res.status(400).json({ error: "WhatsApp credentials not configured" });

    const meta = await fetchTemplateStatus(creds.wa_from, creds.wa_auth_token, tpl.name);
    if (!meta) return res.status(404).json({ error: "Template not found on Meta anymore" });

    const status = (meta.status || "pending").toLowerCase();
    const approvedAtSql = status === "approved" ? "COALESCE(approved_at, NOW())" : "approved_at";
    const result = await pool.query(
      `UPDATE whatsapp_templates SET status=$1, rejection_reason=$2, approved_at=${approvedAtSql}, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [status, meta.rejected_reason || "", tpl.id],
    );
    res.json(serializeTemplate(result.rows[0]));
  } catch (e) {
    console.error("Template status sync failed:", e.message);
    res.status(400).json({ error: e.message || "Could not check template status" });
  }
});

module.exports = router;
