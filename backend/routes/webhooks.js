const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { findDuplicateLeadByPhone, isValidPhone, cleanPhoneValue, withPhoneLock } = require("../utils/lead-dedup");
const { savePendingLead } = require("../utils/pending-leads");
const { downloadWhatsAppMedia } = require("../utils/whatsapp-media");
const mailer = require("../utils/mailer");
const { findSubscriptionByRazorpayId, activateFromCharge } = require("../utils/razorpay-billing");

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
  // withPhoneLock serialises this per tenant+phone — otherwise two
  // messages arriving milliseconds apart (very common right after someone
  // first messages in) could both see "no existing lead" and each insert
  // their own, leaving the same number as two+ separate leads.
  let leadId, existed;
  try {
    leadId = await withPhoneLock(tenantId, phone, async (client) => {
      const existing = await findDuplicateLeadByPhone(tenantId, phone, null, client);
      existed = !!existing;
      if (existing) return existing.id;

      if (!(await withinLeadLimit(tenantId))) {
        console.log(`${platform} lead skipped — plan limit reached for tenant ${tenantId}`);
        return null;
      }
      const { rows } = await client.query(
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
      return rows[0].id;
    });
  } catch (e) {
    console.error("captureInboundMessage lock/insert failed:", e.message);
    return;
  }
  if (!leadId) return;
  if (!existed) {
    fireTrigger("new_lead", tenantId, { name: name || phone, phone, email: "" }).catch(() => {});
  }

  if (existed) {
    await pool.query(
      "UPDATE leads SET last_message=$1, updated_at=NOW() WHERE id=$2",
      [message, leadId],
    );
  }
  await pool.query(
    `INSERT INTO lead_messages (lead_id, message, message_date, direction, media_url, media_type, media_name, wa_message_id, channel)
     VALUES ($1,$2,NOW(),'in',$3,$4,$5,$6,'whatsapp')`,
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

    if (!phone) {
      // No usable phone — park it for review instead of adding to Leads.
      await savePendingLead(tenantId, {
        name,
        email,
        platform: "Google Ads",
        notes: "Auto-captured from Google Ads Lead Form (no phone)",
      });
      return res.json({ pending: true });
    }

    // Locked per tenant+phone — see captureInboundMessage above for why:
    // Google can retry a lead-form submission, and without this two
    // retries arriving close together could both pass the duplicate check
    // and create two leads for the same phone number.
    let isNew = false;
    try {
      await withPhoneLock(tenantId, phone, async (client) => {
        const dup = await findDuplicateLeadByPhone(tenantId, phone, null, client);
        if (dup) return; // already have this lead — ack, skip

        if (!(await withinLeadLimit(tenantId))) {
          throw Object.assign(new Error("Lead limit reached for this plan"), { limitReached: true });
        }
        await client.query(
          `INSERT INTO leads (user_id, name, phone, email, platform, last_message, notes)
           VALUES ($1,$2,$3,$4,'Google Ads','','Auto-captured from Google Ads Lead Form')`,
          [tenantId, name, phone, email],
        );
        isNew = true;
      });
    } catch (e) {
      if (e.limitReached) return res.status(403).json({ message: e.message });
      throw e;
    }

    if (isNew) fireTrigger("new_lead", tenantId, { name, phone, email }).catch(() => {});

    res.json({});
  } catch (e) {
    console.error("Google leads webhook error:", e.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/webhooks/whatsapp/meta ──────────────────────────────
// Verification handshake for the ONE shared, app-level callback URL —
// register this exact URL (not a per-tenant one) in Meta App Dashboard →
// WhatsApp → Configuration when this app acts as a Meta Tech Provider
// connecting multiple separate products' WABAs via Embedded Signup. The
// verify token is a single secret set once in the App Dashboard, matched
// against META_APP_VERIFY_TOKEN here — not per-tenant like the URL-token
// route below, since Meta only ever calls this one fixed URL.
// Registered BEFORE /whatsapp/:token so the literal "meta" path always
// wins over that route's :token wildcard (Express matches route order,
// and "meta" would otherwise satisfy :token like any other string).
router.get("/whatsapp/meta", (req, res) => {
  const mode = req.query["hub.mode"];
  const verifyToken = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && verifyToken && process.env.META_APP_VERIFY_TOKEN && verifyToken === process.env.META_APP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ── POST /api/webhooks/whatsapp/meta ─────────────────────────────
// Receives EVERY WABA's events once multiple products share this one Meta
// App (Tech Provider model) — Meta only supports one callback URL per app,
// so this dispatches each entry (keyed by its WABA id, entry.id) to
// whichever product actually owns that WABA:
//   1. One of this CRM's own tenants (automation_credentials.wa_from) —
//      processed locally, exactly like the per-tenant route below.
//   2. A WABA another product registered via POST /registry — forwarded
//      as-is to that product's own forward_url.
//   3. Neither — logged and dropped (a WABA mid-setup, not yet registered
//      anywhere, isn't an error condition worth alerting on per-event).
// Also registered before /whatsapp/:token for the same route-order reason.
router.post("/whatsapp/meta", express.json(), async (req, res) => {
  res.sendStatus(200); // fast ack, same reason as the per-tenant route
  try {
    const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
    for (const entry of entries) {
      const wabaId = entry?.id;
      if (!wabaId) continue;

      const ownTenant = await pool.query("SELECT user_id FROM automation_credentials WHERE wa_from=$1", [wabaId]);
      if (ownTenant.rows[0]) {
        const tenantId = ownTenant.rows[0].user_id;
        for (const change of entry.changes || []) {
          if (change.field === "message_template_status_update") {
            await processTemplateStatusUpdates([{ changes: [change] }]);
          } else {
            await processWhatsAppValueForTenant(tenantId, change.value);
          }
        }
        continue;
      }

      const registered = await pool.query("SELECT * FROM webhook_registry WHERE waba_id=$1", [wabaId]);
      const target = registered.rows[0];
      if (!target) {
        console.log(`Meta webhook: no product registered for WABA ${wabaId} — dropped`);
        continue;
      }

      try {
        await fetch(target.forward_url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Dispatcher-Secret": target.forward_secret },
          body: JSON.stringify({ object: req.body.object, entry: [entry] }),
        });
      } catch (e) {
        console.error(`Meta webhook forward to ${target.product_key} failed:`, e.message);
      }
    }
  } catch (e) {
    console.error("Meta dispatcher webhook error:", e.message);
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

// Delivery/read/failed status callbacks for messages we sent (broadcasts,
// automation triggers) — this is Meta's ONLY way of telling us a freeform
// message accepted by /messages later failed to actually deliver (e.g. the
// recipient was outside the 24h customer-service window). Updates the
// matching broadcast_recipients row by wa_message_id if one exists.
async function processStatuses(statuses) {
  for (const s of statuses || []) {
    const waMessageId = s.id;
    const status = s.status; // sent | delivered | read | failed
    if (!waMessageId || !status) continue;
    const errMsg = status === "failed" ? (s.errors?.[0]?.title || s.errors?.[0]?.message || "Delivery failed") : "";
    try {
      const prev = await pool.query(
        `SELECT campaign_id, status FROM broadcast_recipients WHERE wa_message_id=$1`,
        [waMessageId],
      );
      const row = prev.rows[0];
      if (!row) continue;

      await pool.query(
        `UPDATE broadcast_recipients SET status=$1, error=$2, updated_at=NOW() WHERE wa_message_id=$3`,
        [status, errMsg, waMessageId],
      );

      // A recipient counted as "sent" the moment Meta accepted it — if it
      // later turns out to have failed (e.g. outside the 24h window), move
      // it out of the campaign's sent_count into failed_count so the
      // aggregate shown in Past Broadcasts stays accurate. Only do this on
      // the first transition into 'failed' so a repeated webhook delivery
      // doesn't double-decrement.
      if (status === "failed" && row.status !== "failed" && row.campaign_id) {
        await pool.query(
          `UPDATE broadcast_campaigns SET sent_count = GREATEST(sent_count - 1, 0), failed_count = failed_count + 1 WHERE id=$1`,
          [row.campaign_id],
        );
      }
    } catch (e) {
      console.error("processStatuses failed:", e.message);
    }

    // Same status callback also covers 1:1 replies sent from a lead's
    // WhatsApp thread (Leads page chat, the WhatsApp inbox page) — a
    // message id only ever belongs to one or the other table, so this is a
    // harmless no-op when it's actually a broadcast recipient.
    try {
      await pool.query(
        `UPDATE lead_messages SET wa_status=$1, wa_error=$2 WHERE wa_message_id=$3`,
        [status, errMsg, waMessageId],
      );
    } catch (e) {
      console.error("processStatuses (lead_messages) failed:", e.message);
    }
  }
}

// Meta pushes template approval/rejection/pause/disable as its own webhook
// field ("message_template_status_update"), separate from the
// "messages" field the rest of this handler reads — a single POST can
// carry either or both, spread across entry[]/changes[], so this scans
// every change rather than assuming index [0] like the message/status
// handling below does (that assumption has held for messages so far, but
// template updates aren't guaranteed to share the same change entry).
// This is additive — it doesn't require registering a new webhook URL,
// since the App Dashboard field subscription this URL already receives
// messages/message_status under can also carry this field once ticked on
// (Meta App Dashboard → WhatsApp → Configuration → Webhook fields).
async function processTemplateStatusUpdates(entries) {
  for (const entry of entries || []) {
    for (const change of entry?.changes || []) {
      if (change?.field !== "message_template_status_update") continue;
      const v = change.value || {};
      const metaTemplateId = v.message_template_id ? String(v.message_template_id) : null;
      const name = v.message_template_name;
      const language = v.message_template_language;
      const status = (v.event || "").toLowerCase(); // approved | rejected | paused | disabled | ...
      if (!status || (!metaTemplateId && !name)) continue;

      try {
        const match = metaTemplateId
          ? await pool.query("SELECT id FROM whatsapp_templates WHERE meta_template_id=$1", [metaTemplateId])
          : await pool.query("SELECT id FROM whatsapp_templates WHERE name=$1 AND language=$2", [name, language || "en_US"]);
        const tpl = match.rows[0];
        if (!tpl) continue;

        const approvedAtSql = status === "approved" ? "COALESCE(approved_at, NOW())" : "approved_at";
        await pool.query(
          `UPDATE whatsapp_templates SET status=$1, rejection_reason=$2, approved_at=${approvedAtSql}, updated_at=NOW() WHERE id=$3`,
          [status, v.reason || "", tpl.id],
        );
      } catch (e) {
        console.error("processTemplateStatusUpdates failed:", e.message);
      }
    }
  }
}

// Shared by the per-tenant URL route (/whatsapp/:token) and the shared-app
// dispatcher route (/whatsapp/meta) below — everything that happens once a
// specific tenant and Meta "value" object (one changes[].value) are known:
// delivery statuses, then an inbound message if there is one.
async function processWhatsAppValueForTenant(tenantId, value) {
  if (Array.isArray(value?.statuses) && value.statuses.length) {
    await processStatuses(value.statuses);
  }
  const message = value?.messages?.[0];
  if (!message) return; // status/template update, not a new message — nothing else to do

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
}

// ── POST /api/webhooks/whatsapp/:token ───────────────────────────
// Meta WhatsApp Cloud API webhook — fires for every inbound message,
// delivery/read/failed status updates on messages we sent, and (once the
// App Dashboard's webhook field is enabled) template approval status.
// This is the per-tenant URL: a tenant who entered their own Meta
// credentials by hand (Channel Setup) registers this exact URL in their own
// WABA's webhook config, so the tenant is already known from the URL alone.
router.post("/whatsapp/:token", express.json(), async (req, res) => {
  res.sendStatus(200); // Meta requires a fast ack; retries aggressively otherwise
  try {
    const tenantId = await tenantForToken(req.params.token);
    if (!tenantId) return;

    if (Array.isArray(req.body?.entry)) {
      await processTemplateStatusUpdates(req.body.entry);
    }

    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    await processWhatsAppValueForTenant(tenantId, value);
  } catch (e) {
    console.error("WhatsApp webhook error:", e.message);
  }
});

// ── POST /api/webhooks/registry ──────────────────────────────────
// How another product (school-erp, erp, lab, washing-erp, lms, ...)
// registers a WABA it owns so the dispatcher above knows to forward that
// WABA's events to it. Machine-to-machine, not a logged-in user — protected
// by a static shared secret (DISPATCHER_REGISTRY_SECRET) both sides know,
// not the normal JWT auth. forward_secret is chosen by the calling product
// and echoed back on every forwarded webhook so it can verify the event
// really came from this dispatcher and not somewhere else.
router.post("/registry", express.json(), async (req, res) => {
  const secret = req.headers["x-registry-secret"];
  if (!process.env.DISPATCHER_REGISTRY_SECRET || secret !== process.env.DISPATCHER_REGISTRY_SECRET) {
    return res.status(401).json({ error: "Invalid or missing registry secret" });
  }
  const { product_key, waba_id, phone_number_id, forward_url, forward_secret } = req.body || {};
  if (!product_key?.trim() || !waba_id?.trim() || !forward_url?.trim() || !forward_secret?.trim()) {
    return res.status(400).json({ error: "product_key, waba_id, forward_url and forward_secret are required" });
  }
  try {
    await pool.query(
      `INSERT INTO webhook_registry (product_key, waba_id, phone_number_id, forward_url, forward_secret, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (waba_id) DO UPDATE SET product_key=$1, phone_number_id=$3, forward_url=$4, forward_secret=$5, updated_at=NOW()`,
      [product_key.trim(), waba_id.trim(), phone_number_id?.trim() || "", forward_url.trim(), forward_secret.trim()],
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Webhook registry write failed:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/webhooks/registry/:waba_id ───────────────────────
router.delete("/registry/:waba_id", async (req, res) => {
  const secret = req.headers["x-registry-secret"];
  if (!process.env.DISPATCHER_REGISTRY_SECRET || secret !== process.env.DISPATCHER_REGISTRY_SECRET) {
    return res.status(401).json({ error: "Invalid or missing registry secret" });
  }
  try {
    await pool.query("DELETE FROM webhook_registry WHERE waba_id=$1", [req.params.waba_id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
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

    if (!phone) {
      // No usable phone — park it for review instead of adding to Leads.
      await savePendingLead(tenantId, {
        name,
        email,
        platform: platform || "Google Sheets",
        notes: notes || "Auto-captured from Google Sheet (no phone)",
      });
      return res.json({ pending: true });
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

    // Locked per tenant+phone — a sync script re-running (or a sheet with
    // the same row synced twice) can otherwise create duplicate leads the
    // same way concurrent WhatsApp messages did (see captureInboundMessage).
    let isNew = false;
    try {
      await withPhoneLock(tenantId, phone, async (client) => {
        const dup = await findDuplicateLeadByPhone(tenantId, phone, null, client);
        if (dup) return;

        if (!(await withinLeadLimit(tenantId))) {
          throw Object.assign(new Error("Lead limit reached for this plan"), { limitReached: true });
        }
        await client.query(
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
        isNew = true;
      });
    } catch (e) {
      if (e.limitReached) return res.status(403).json({ message: e.message });
      throw e;
    }

    if (!isNew) return res.json({ skipped: "duplicate" });

    fireTrigger("new_lead", tenantId, { name: name || phone, phone, email }).catch(() => {});

    res.json({ success: true });
  } catch (e) {
    console.error("Sheets webhook error:", e.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST Razorpay webhook — drives the whole recurring-billing lifecycle.
// Verified via HMAC-SHA256 over the exact raw request bytes (req.rawBody,
// captured by server.js's express.json({ verify }) — NOT
// JSON.stringify(req.body), which can reorder/reformat and silently break
// the signature) using a webhook-specific secret (RAZORPAY_WEBHOOK_SECRET,
// set once in the Razorpay Dashboard — different from RAZORPAY_KEY_SECRET,
// which signs Checkout callbacks, not webhooks).
router.post("/razorpay", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !req.rawBody) {
    return res.status(400).json({ error: "Missing signature" });
  }
  const expected = crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");
  if (expected !== signature) {
    console.error("Razorpay webhook: signature mismatch");
    return res.status(400).json({ error: "Invalid signature" });
  }

  const { event, payload } = req.body;
  const eventId = req.body.event_id || req.headers["x-razorpay-event-id"];
  let claimed = false;

  try {
    // Idempotency — Razorpay retries undelivered webhooks; without this, a
    // retried "charged" event would extend ends_at a second time. This row
    // also doubles as the event log the Super Admin panel reads — status
    // starts 'received' and is updated to 'processed'/'failed' below once
    // we know the outcome.
    if (eventId) {
      const claim = await pool.query(
        "INSERT INTO razorpay_webhook_events (event_id, event_type) VALUES ($1,$2) ON CONFLICT (event_id) DO NOTHING RETURNING event_id",
        [eventId, event],
      );
      if (claim.rows.length === 0) return res.json({ skipped: "duplicate" });
      claimed = true;
    }

    const sub = payload?.subscription?.entity;
    const razorpaySubId = sub?.id;
    let resolvedUserId = null;

    if (event === "subscription.charged" && razorpaySubId) {
      const row = await findSubscriptionByRazorpayId(razorpaySubId, sub.notes);
      if (row) {
        resolvedUserId = row.user_id;
        await activateFromCharge(row, {
          razorpaySubId,
          billingCycle: sub.notes?.billing_cycle,
          planId: sub.notes?.plan_id ? parseInt(sub.notes.plan_id) : null,
        });
      }
    } else if ((event === "subscription.pending" || event === "payment.failed") && razorpaySubId) {
      const row = await findSubscriptionByRazorpayId(razorpaySubId, sub?.notes);
      if (row) {
        resolvedUserId = row.user_id;
        if (row.status === "active") {
          await pool.query(
            "UPDATE subscriptions SET status='past_due', past_due_since=NOW() WHERE id=$1",
            [row.id],
          );
          const u = await pool.query("SELECT name, email FROM users WHERE id=$1", [row.user_id]);
          const plan = await pool.query("SELECT name FROM plans WHERE id=$1", [row.plan_id]);
          if (u.rows[0] && plan.rows[0]) {
            mailer.sendPaymentFailed(u.rows[0].email, u.rows[0].name, plan.rows[0].name, 3, false);
          }
        }
      }
    } else if (event === "subscription.halted" && razorpaySubId) {
      // Razorpay has given up retrying on its own dunning schedule — send
      // the final warning now; the hourly cron still owns the actual
      // past_due -> expired flip once the 3-day grace window elapses, so a
      // slow-to-arrive halted event never accidentally cuts the grace
      // period short.
      const row = await findSubscriptionByRazorpayId(razorpaySubId, sub?.notes);
      if (row) {
        resolvedUserId = row.user_id;
        const u = await pool.query("SELECT name, email FROM users WHERE id=$1", [row.user_id]);
        const plan = await pool.query("SELECT name FROM plans WHERE id=$1", [row.plan_id]);
        if (u.rows[0] && plan.rows[0]) {
          mailer.sendPaymentFailed(u.rows[0].email, u.rows[0].name, plan.rows[0].name, 3, true);
        }
      }
    } else if (event === "subscription.cancelled" && razorpaySubId) {
      const row = await findSubscriptionByRazorpayId(razorpaySubId, sub?.notes);
      if (row) {
        resolvedUserId = row.user_id;
        await pool.query("UPDATE subscriptions SET status='canceled' WHERE id=$1", [row.id]);
      }
    }

    if (eventId) {
      await pool.query(
        "UPDATE razorpay_webhook_events SET status='processed', user_id=$1 WHERE event_id=$2",
        [resolvedUserId, eventId],
      ).catch(() => {});
    }
    res.json({ success: true });
  } catch (e) {
    console.error("Razorpay webhook error:", e.message);
    if (eventId && claimed) {
      await pool.query(
        "UPDATE razorpay_webhook_events SET status='failed', error_message=$1 WHERE event_id=$2",
        [e.message?.slice(0, 500) || "Unknown error", eventId],
      ).catch(() => {});
    }
    // Still 200 — a 5xx here makes Razorpay retry indefinitely for an error
    // that's almost always a bug on our side, not something a retry fixes.
    res.json({ received: true });
  }
});

module.exports = router;
