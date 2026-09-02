const express = require("express");
const { pool } = require("../db");
const { findDuplicateLeadByPhone, isValidPhone, cleanPhoneValue } = require("../utils/lead-dedup");
const { savePendingLead } = require("../utils/pending-leads");
const { downloadWhatsAppMedia } = require("../utils/whatsapp-media");

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
// against the existing one if this phone already has a lead. `media` is
// optional — {url, type, name} for an inbound image/document/etc.
async function captureInboundMessage(tenantId, { phone, name, message, platform, media, waMessageId }) {
  const existing = await findDuplicateLeadByPhone(tenantId, phone);
  const leadId = existing
    ? existing.id
    : await (async () => {
        if (!(await withinLeadLimit(tenantId))) {
          console.log(`${platform} lead skipped — plan limit reached for tenant ${tenantId}`);
          return null;
        }
        const { rows } = await pool.query(
          `INSERT INTO leads (user_id, name, phone, platform, last_message, notes)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
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
        return rows[0].id;
      })();
  if (!leadId) return;

  if (existing) {
    await pool.query(
      "UPDATE leads SET last_message=$1, updated_at=NOW() WHERE id=$2",
      [message, leadId],
    );
  }
  await pool.query(
    `INSERT INTO lead_messages (lead_id, message, message_date, direction, media_url, media_type, media_name, wa_message_id)
     VALUES ($1,$2,NOW(),'in',$3,$4,$5,$6)`,
    [leadId, message, media?.url || null, media?.type || null, media?.name || null, waMessageId || null],
  );
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
    const rawPhone = cols.PHONE_NUMBER || "";
    const phone = isValidPhone(rawPhone) ? cleanPhoneValue(rawPhone) : "";
    const email = cols.EMAIL || "";

    if (!phone && !email) {
      return res.status(400).json({ message: "Lead has no phone or email" });
    }

    if (phone) {
      const dup = await findDuplicateLeadByPhone(tenantId, phone);
      if (dup) return res.json({}); // already have this lead — ack, skip
    } else {
      // No usable phone — park it for review instead of adding to Leads.
      await savePendingLead(tenantId, {
        name,
        email,
        platform: "Google Ads",
        notes: "Auto-captured from Google Ads Lead Form (no phone)",
      });
      return res.json({ pending: true });
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
    if (!from) return;

    // Media types carry the id of the file under a key named after the
    // type itself (message.image.id, message.document.id, ...) plus an
    // optional caption — everything else (text, location, etc) is treated
    // as plain text, falling back to a "[type]" placeholder if there's
    // truly nothing to show.
    const MEDIA_TYPES = ["image", "document", "audio", "video", "sticker"];
    let messageBody = message.text?.body || "";
    let media = null;

    if (MEDIA_TYPES.includes(message.type) && message[message.type]?.id) {
      const mediaPayload = message[message.type];
      messageBody = mediaPayload.caption || `[${message.type}]`;
      try {
        const creds = await pool.query(
          "SELECT wa_account_sid, wa_auth_token FROM automation_credentials WHERE user_id=$1",
          [tenantId],
        );
        const accessToken = creds.rows[0]?.wa_auth_token;
        if (accessToken) {
          const { mediaUrl } = await downloadWhatsAppMedia(mediaPayload.id, accessToken);
          media = { url: mediaUrl, type: message.type, name: mediaPayload.filename || mediaPayload.caption || "" };
        }
      } catch (e) {
        console.error("WhatsApp media download failed:", e.message);
      }
    } else if (!messageBody) {
      messageBody = message.type ? `[${message.type}]` : "";
    }

    await captureInboundMessage(tenantId, {
      phone: from,
      name: profileName,
      message: messageBody,
      platform: "WhatsApp",
      media,
      waMessageId: message.id || null,
    });
  } catch (e) {
    console.error("WhatsApp webhook error:", e.message);
  }
});

// ── POST /api/webhooks/sheets/:token ─────────────────────────────
// Called by a small Google Apps Script bound to the tenant's own lead sheet
// (see /automation/webhook-urls → apps_script snippet). The script maps its
// own columns to {name, phone, email, platform, created_at, notes} before
// sending, so no header guessing needs to happen here — any spreadsheet
// layout works.
router.post("/sheets/:token", express.json(), async (req, res) => {
  try {
    const tenantId = await tenantForToken(req.params.token);
    if (!tenantId) return res.status(404).json({ message: "Unknown webhook" });

    const { name, email, notes, platform, created_at } = req.body || {};
    const rawPhone = req.body?.phone;
    // Junk cell values like "p:" have no real digits — treat them as if the
    // phone column was left blank instead of storing them as a fake contact
    // number. And some sources (e.g. Meta's sheet sync) glue a label onto
    // the value like "p:+919279086530" — strip that down to just the number.
    const phone = isValidPhone(rawPhone) ? cleanPhoneValue(rawPhone) : "";

    if (!name && !phone && !email) {
      return res.status(400).json({ message: "Row has no name, phone, or email" });
    }

    if (phone) {
      const dup = await findDuplicateLeadByPhone(tenantId, phone);
      if (dup) return res.json({ skipped: "duplicate" });
    } else {
      // No usable phone — park it for review instead of adding to Leads.
      await savePendingLead(tenantId, {
        name,
        email,
        platform: platform || "Google Sheets",
        notes: notes || "Auto-captured from Google Sheet (no phone)",
      });
      return res.json({ pending: true });
    }

    if (!(await withinLeadLimit(tenantId))) {
      return res.status(403).json({ message: "Lead limit reached for this plan" });
    }

    // If the sheet has its own submission timestamp, keep the lead's
    // created_at accurate to that instead of "when we happened to sync it".
    // Pass the raw string straight through to Postgres — routing it through
    // a JS Date object here would silently shift the time by the server's
    // local UTC offset (the same class of bug fixed earlier for follow_up_date).
    let createdAt = null;
    if (
      typeof created_at === "string" &&
      /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/.test(created_at.trim())
    ) {
      createdAt = created_at.trim();
    }

    await pool.query(
      `INSERT INTO leads (user_id, name, phone, email, platform, last_message, notes, created_at)
       VALUES ($1,$2,$3,$4,$5,'',$6, COALESCE($7::timestamp, NOW()))`,
      [
        tenantId,
        name || phone,
        phone || "",
        email || "",
        platform || "Google Sheets",
        notes || "Auto-captured from Google Sheet",
        createdAt,
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
