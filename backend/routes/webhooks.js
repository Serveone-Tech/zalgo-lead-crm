const express = require("express");
const { pool } = require("../db");
const { findDuplicateLeadByPhone } = require("../utils/lead-dedup");

let fireTrigger = async () => {}; // safe default
try {
  fireTrigger = require("../utils/automation-trigger").fireTrigger;
} catch (e) {}

const router = express.Router();

// These endpoints are hit directly by Google/Twilio servers, not our own
// frontend — there is no JWT to check. Security instead comes from the
// unguessable per-tenant token embedded in the URL (see automation.js
// /webhook-urls), plus (for Google) a second `google_key` check in the body.
async function tenantForToken(token) {
  if (!token) return null;
  const { rows } = await pool.query(
    "SELECT user_id FROM automation_credentials WHERE webhook_token=$1",
    [token],
  );
  return rows[0]?.user_id || null;
}

async function withinLeadLimit(tenantId) {
  const sub = await pool.query(
    `SELECT p.max_leads FROM subscriptions s JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1`,
    [tenantId],
  );
  const maxLeads = sub.rows[0]?.max_leads ?? -1;
  if (maxLeads <= 0) return true; // unlimited or no plan row found — don't block
  const count = await pool.query("SELECT COUNT(*) FROM leads WHERE user_id=$1", [tenantId]);
  return parseInt(count.rows[0].count) < maxLeads;
}

// Shared by any inbound-message source (WhatsApp today, maybe Instagram/SMS
// later): create a new lead on first contact, or just log the message
// against the existing one if this phone already has a lead.
async function captureInboundMessage(tenantId, { phone, name, message, platform }) {
  const existing = await findDuplicateLeadByPhone(tenantId, phone);
  if (existing) {
    await pool.query(
      "UPDATE leads SET last_message=$1, updated_at=NOW() WHERE id=$2",
      [message, existing.id],
    );
    await pool.query(
      "INSERT INTO lead_messages (lead_id, message, message_date) VALUES ($1,$2,NOW())",
      [existing.id, message],
    );
    return;
  }

  if (!(await withinLeadLimit(tenantId))) {
    console.log(`${platform} lead skipped — plan limit reached for tenant ${tenantId}`);
    return;
  }

  await pool.query(
    `INSERT INTO leads (user_id, name, phone, platform, last_message, notes)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      tenantId,
      name || phone,
      phone,
      platform,
      message,
      `Auto-captured from incoming ${platform} message`,
    ],
  );

  fireTrigger("new_lead", tenantId, { name: name || phone, phone, email: "" }).catch(() => {});
}

// ── POST /api/webhooks/google-leads/:token ──────────────────────
// Google Ads Lead Form webhook. Docs: developers.google.com/google-ads/webhook
router.post("/google-leads/:token", express.json(), async (req, res) => {
  try {
    const tenantId = await tenantForToken(req.params.token);
    if (!tenantId) return res.status(404).json({ message: "Unknown webhook" });

    const body = req.body || {};
    if (!body.google_key || body.google_key !== req.params.token) {
      return res.status(401).json({ message: "Invalid google_key" });
    }
    if (body.is_test) return res.json({}); // Google's "Test Lead" — ack, don't store

    const cols = {};
    (body.user_column_data || []).forEach((c) => {
      if (c.column_id) cols[c.column_id] = c.string_value || "";
    });
    const name =
      cols.FULL_NAME ||
      [cols.FIRST_NAME, cols.LAST_NAME].filter(Boolean).join(" ") ||
      "Google Ads Lead";
    const phone = cols.PHONE_NUMBER || "";
    const email = cols.EMAIL || "";

    if (!phone && !email) {
      return res.status(400).json({ message: "Lead has no phone or email" });
    }

    if (phone) {
      const dup = await findDuplicateLeadByPhone(tenantId, phone);
      if (dup) return res.json({}); // already have this lead — ack, skip
    }

    if (!(await withinLeadLimit(tenantId))) {
      return res.status(403).json({ message: "Lead limit reached for this plan" });
    }

    await pool.query(
      `INSERT INTO leads (user_id, name, phone, email, platform, last_message, notes)
       VALUES ($1,$2,$3,$4,'Google Ads','','Auto-captured from Google Ads Lead Form')`,
      [tenantId, name, phone, email],
    );

    fireTrigger("new_lead", tenantId, { name, phone, email }).catch(() => {});

    res.json({});
  } catch (e) {
    console.error("Google leads webhook error:", e.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/webhooks/whatsapp/:token ────────────────────────────
// Meta's one-time verification handshake when you save the webhook in the
// Meta App dashboard. Must echo back hub.challenge if the verify token matches.
// Docs: developers.facebook.com/docs/graph-api/webhooks/getting-started
router.get("/whatsapp/:token", async (req, res) => {
  const tenantId = await tenantForToken(req.params.token);
  if (!tenantId) return res.sendStatus(404);

  const mode = req.query["hub.mode"];
  const verifyToken = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // We reuse the same per-tenant token as both the URL id and the verify
  // token — one value to paste into Meta's dashboard, nothing extra to store.
  if (mode === "subscribe" && verifyToken === req.params.token) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ── POST /api/webhooks/whatsapp/:token ───────────────────────────
// Meta WhatsApp Cloud API webhook — fires for every inbound message (and
// delivery/read status updates, which we ignore since they carry no
// `messages` array).
router.post("/whatsapp/:token", express.json(), async (req, res) => {
  res.sendStatus(200); // Meta requires a fast ack; retries aggressively otherwise
  try {
    const tenantId = await tenantForToken(req.params.token);
    if (!tenantId) return;

    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) return; // status update, not a new message — nothing to do

    const from = message.from; // sender's WhatsApp ID — digits only, e.g. "919123456780"
    const profileName = value?.contacts?.[0]?.profile?.name || "";
    const messageBody =
      message.text?.body || (message.type ? `[${message.type} message]` : "");
    if (!from) return;

    await captureInboundMessage(tenantId, {
      phone: from,
      name: profileName,
      message: messageBody,
      platform: "WhatsApp",
    });
  } catch (e) {
    console.error("WhatsApp webhook error:", e.message);
  }
});

// ── POST /api/webhooks/sheets/:token ─────────────────────────────
// Called by a small Google Apps Script bound to the tenant's own lead sheet
// (see /automation/webhook-urls → apps_script snippet). The script maps its
// own columns to {name, phone, email, notes} before sending, so no header
// guessing needs to happen here — any spreadsheet layout works.
router.post("/sheets/:token", express.json(), async (req, res) => {
  try {
    const tenantId = await tenantForToken(req.params.token);
    if (!tenantId) return res.status(404).json({ message: "Unknown webhook" });

    const { name, phone, email, notes } = req.body || {};
    if (!name && !phone) {
      return res.status(400).json({ message: "Row has no name or phone" });
    }

    if (phone) {
      const dup = await findDuplicateLeadByPhone(tenantId, phone);
      if (dup) return res.json({ skipped: "duplicate" });
    }

    if (!(await withinLeadLimit(tenantId))) {
      return res.status(403).json({ message: "Lead limit reached for this plan" });
    }

    await pool.query(
      `INSERT INTO leads (user_id, name, phone, email, platform, last_message, notes)
       VALUES ($1,$2,$3,$4,'Google Sheets','',$5)`,
      [
        tenantId,
        name || phone,
        phone || "",
        email || "",
        notes || "Auto-captured from Google Sheet",
      ],
    );

    fireTrigger("new_lead", tenantId, { name: name || phone, phone, email }).catch(() => {});

    res.json({ success: true });
  } catch (e) {
    console.error("Sheets webhook error:", e.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
