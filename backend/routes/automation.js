const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { auth, requirePermission, requireSubscription, requirePlanFeature } = require("../middleware/auth");
const { sendWhatsAppViaMeta } = require("../utils/whatsapp-meta");
const { replaceVars, sendEmail, sendSMS, sendWhatsApp } = require("../utils/automation-trigger");

const router = express.Router();

function webhookBaseUrl(req) {
  return process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`;
}

function webhookUrls(req, token) {
  const base = webhookBaseUrl(req);
  return {
    token,
    google_webhook_url: `${base}/api/webhooks/google-leads/${token}`,
    whatsapp_webhook_url: `${base}/api/webhooks/whatsapp/${token}`,
    sheets_webhook_url: `${base}/api/webhooks/sheets/${token}`,
  };
}

async function ensureWebhookToken(tenantId) {
  const existing = await pool.query(
    "SELECT webhook_token FROM automation_credentials WHERE user_id=$1",
    [tenantId],
  );
  if (existing.rows[0]?.webhook_token) return existing.rows[0].webhook_token;

  const token = crypto.randomBytes(24).toString("hex");
  await pool.query(
    `INSERT INTO automation_credentials (user_id, webhook_token, updated_at)
     VALUES ($1,$2,NOW())
     ON CONFLICT (user_id) DO UPDATE SET webhook_token=$2, updated_at=NOW()`,
    [tenantId, token],
  );
  return token;
}

// ── GET credentials (masked) ──────────────────────────────
router.get("/credentials", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM automation_credentials WHERE user_id=$1",
      [req.tenantId],
    );
    if (result.rows.length === 0) {
      return res.json({
        email_enabled: false,
        email_api_key: "",
        email_from: "",
        email_from_name: "",
        sms_enabled: false,
        sms_account_sid: "",
        sms_auth_token: "",
        sms_from: "",
        whatsapp_enabled: false,
        wa_account_sid: "",
        wa_auth_token: "",
        wa_from: "",
      });
    }
    const row = result.rows[0];
    const mask = (s) =>
      s && s.length > 8
        ? s.substring(0, 4) + "****" + s.slice(-4)
        : s
          ? "****"
          : "";
    res.json({
      ...row,
      email_api_key: mask(row.email_api_key),
      sms_auth_token: mask(row.sms_auth_token),
      wa_auth_token: mask(row.wa_auth_token),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT save credentials ──────────────────────────────────
router.put("/credentials", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  const { channel, ...fields } = req.body;
  try {
    const existing = await pool.query(
      "SELECT * FROM automation_credentials WHERE user_id=$1",
      [req.tenantId],
    );
    const cur = existing.rows[0] || {};
    let cols = {};

    if (channel === "email") {
      cols = {
        email_enabled: !!fields.email_enabled,
        email_api_key: fields.email_api_key?.includes("****")
          ? cur.email_api_key || ""
          : fields.email_api_key || "",
        email_from: fields.email_from || cur.email_from || "",
        email_from_name: fields.email_from_name || cur.email_from_name || "",
      };
    } else if (channel === "sms") {
      cols = {
        sms_enabled: !!fields.sms_enabled,
        sms_account_sid: fields.sms_account_sid || cur.sms_account_sid || "",
        sms_auth_token: fields.sms_auth_token?.includes("****")
          ? cur.sms_auth_token || ""
          : fields.sms_auth_token || "",
        sms_from: fields.sms_from || cur.sms_from || "",
      };
    } else if (channel === "whatsapp") {
      // wa_account_sid/wa_auth_token now hold Meta's Phone Number ID /
      // Access Token (repurposed from the old Twilio-shaped columns —
      // Meta needs no separate "from" number, so wa_from is unused).
      cols = {
        whatsapp_enabled: !!fields.whatsapp_enabled,
        wa_account_sid: fields.wa_account_sid || cur.wa_account_sid || "",
        wa_auth_token: fields.wa_auth_token?.includes("****")
          ? cur.wa_auth_token || ""
          : fields.wa_auth_token || "",
      };
    } else return res.status(400).json({ error: "Invalid channel" });

    const keys = Object.keys(cols);
    await pool.query(
      `INSERT INTO automation_credentials (user_id, ${keys.join(",")}, updated_at)
       VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(",")}, NOW())
       ON CONFLICT (user_id) DO UPDATE SET ${keys.map((k, i) => `${k}=$${i + 2}`).join(",")}, updated_at=NOW()`,
      [req.tenantId, ...Object.values(cols)],
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET webhook URLs — for auto-capturing leads from Google Ads / WhatsApp ──
router.get("/webhook-urls", auth, requireSubscription, requirePlanFeature("lead_sources"), requirePermission("manage_automation"), async (req, res) => {
  try {
    const token = await ensureWebhookToken(req.tenantId);
    res.json(webhookUrls(req, token));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST regenerate webhook token — invalidates the old URLs ──
router.post("/webhook-urls/regenerate", auth, requireSubscription, requirePlanFeature("lead_sources"), requirePermission("manage_automation"), async (req, res) => {
  try {
    const token = crypto.randomBytes(24).toString("hex");
    await pool.query(
      `INSERT INTO automation_credentials (user_id, webhook_token, updated_at)
       VALUES ($1,$2,NOW())
       ON CONFLICT (user_id) DO UPDATE SET webhook_token=$2, updated_at=NOW()`,
      [req.tenantId, token],
    );
    res.json(webhookUrls(req, token));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET triggers ──────────────────────────────────────────
router.get("/triggers", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM automation_triggers WHERE user_id=$1",
      [req.tenantId],
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT save trigger ──────────────────────────────────────
router.put("/triggers", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  const { trigger_id, enabled, channels, template } = req.body;
  if (!trigger_id)
    return res.status(400).json({ error: "trigger_id required" });
  try {
    await pool.query(
      `INSERT INTO automation_triggers (user_id, trigger_id, enabled, channels, template, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (user_id, trigger_id) DO UPDATE SET enabled=$3, channels=$4, template=$5, updated_at=NOW()`,
      [req.tenantId, trigger_id, !!enabled, channels || [], template || ""],
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST send manual message ──────────────────────────────
router.post("/send", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  const { channel, to, subject, message } = req.body;
  if (!channel || !to || !message) {
    return res
      .status(400)
      .json({ error: "channel, to, and message are required" });
  }

  try {
    // Get credentials from DB
    const credResult = await pool.query(
      "SELECT * FROM automation_credentials WHERE user_id=$1",
      [req.tenantId],
    );
    if (credResult.rows.length === 0) {
      return res.status(400).json({
        error:
          "No credentials configured. Please set up channel credentials first.",
      });
    }
    const creds = credResult.rows[0];

    // ── EMAIL via Nodemailer + SendGrid SMTP ──
    if (channel === "email") {
      if (!creds.email_enabled)
        return res.status(400).json({ error: "Email channel is not enabled" });
      if (!creds.email_api_key)
        return res
          .status(400)
          .json({ error: "SendGrid API key not configured" });
      if (!creds.email_from)
        return res.status(400).json({ error: "From email not configured" });

      let nodemailer;
      try {
        nodemailer = require("nodemailer");
      } catch {
        return res.status(500).json({
          error: "nodemailer not installed. Run: npm install nodemailer",
        });
      }

      const transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        auth: {
          user: "apikey",
          pass: creds.email_api_key,
        },
      });

      await transporter.sendMail({
        from: `"${creds.email_from_name || "CRM"}" <${creds.email_from}>`,
        to,
        subject: subject || "Message from CRM",
        text: message,
        html: `<p>${message.replace(/\n/g, "<br>")}</p>`,
      });

      return res.json({ success: true, message: `Email sent to ${to}` });
    }

    // ── SMS via Twilio ──
    if (channel === "sms") {
      if (!creds.sms_enabled)
        return res.status(400).json({ error: "SMS channel is not enabled" });
      if (!creds.sms_account_sid)
        return res
          .status(400)
          .json({ error: "Twilio Account SID not configured" });
      if (!creds.sms_auth_token)
        return res
          .status(400)
          .json({ error: "Twilio Auth Token not configured" });
      if (!creds.sms_from)
        return res
          .status(400)
          .json({ error: "SMS From number not configured" });

      let twilio;
      try {
        twilio = require("twilio");
      } catch {
        return res
          .status(500)
          .json({ error: "twilio not installed. Run: npm install twilio" });
      }

      const client = twilio(creds.sms_account_sid, creds.sms_auth_token);

      // Clean phone number — add +91 if no country code
      let toNum = to.replace(/\s+/g, "");
      if (!toNum.startsWith("+")) toNum = "+91" + toNum;

      await client.messages.create({
        body: message,
        from: creds.sms_from,
        to: toNum,
      });

      return res.json({ success: true, message: `SMS sent to ${toNum}` });
    }

    // ── WhatsApp via Meta Cloud API ──
    if (channel === "whatsapp") {
      if (!creds.whatsapp_enabled)
        return res
          .status(400)
          .json({ error: "WhatsApp channel is not enabled" });
      if (!creds.wa_account_sid)
        return res
          .status(400)
          .json({ error: "Meta Phone Number ID not configured" });
      if (!creds.wa_auth_token)
        return res
          .status(400)
          .json({ error: "Meta Access Token not configured" });

      let toNum = to.replace(/\s+/g, "");
      if (!toNum.startsWith("+") && !/^\d{11,}$/.test(toNum)) toNum = "+91" + toNum;

      await sendWhatsAppViaMeta(creds, toNum, message);

      return res.json({ success: true, message: `WhatsApp sent to ${toNum}` });
    }

    res
      .status(400)
      .json({ error: "Invalid channel. Use: email, sms, or whatsapp" });
  } catch (e) {
    console.error("Send error:", e);
    // Return proper error message to frontend
    const errMsg = e.message || "Failed to send message";
    res.status(500).json({ error: errMsg });
  }
});

// Resolves an audience name into the actual customer rows a broadcast will
// go to. "new" and "inactive" both take a day window; "all" ignores it.
async function resolveAudience(tenantId, audience, days) {
  const d = Math.max(1, parseInt(days) || 30);
  if (audience === "new") {
    const { rows } = await pool.query(
      `SELECT id, name, phone, email FROM customers
       WHERE user_id=$1 AND created_at >= NOW() - ($2 || ' days')::interval`,
      [tenantId, d],
    );
    return rows;
  }
  if (audience === "inactive") {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.phone, c.email
       FROM customers c
       LEFT JOIN customer_orders co ON co.customer_id=c.id AND co.deleted_at IS NULL
       WHERE c.user_id=$1
       GROUP BY c.id
       HAVING MAX(co.created_at) IS NULL OR MAX(co.created_at) < NOW() - ($2 || ' days')::interval`,
      [tenantId, d],
    );
    return rows;
  }
  const { rows } = await pool.query("SELECT id, name, phone, email FROM customers WHERE user_id=$1", [tenantId]);
  return rows;
}

// ── GET how many customers a given audience/day-window currently matches —
// lets the admin see the reach before actually sending anything.
router.get("/broadcast/audience-count", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  try {
    const rows = await resolveAudience(req.tenantId, req.query.audience, req.query.days);
    res.json({ count: rows.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET past campaigns — most recent first.
router.get("/broadcast/history", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM broadcast_campaigns WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30",
      [req.tenantId],
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST send a bulk broadcast — a festival offer, a win-back message to
// customers who haven't ordered in a while, etc. Reuses the exact same
// per-channel senders automation triggers use, just looped over an
// audience instead of firing off one event.
router.post("/broadcast", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  const { audience, days, channels, message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Message required" });
  if (!Array.isArray(channels) || channels.length === 0) {
    return res.status(400).json({ error: "Select at least one channel" });
  }
  try {
    const recipients = await resolveAudience(req.tenantId, audience, days);
    if (recipients.length === 0) {
      return res.status(400).json({ error: "No customers match this audience" });
    }

    const credRes = await pool.query("SELECT * FROM automation_credentials WHERE user_id=$1", [req.tenantId]);
    const creds = credRes.rows[0];
    if (!creds) {
      return res.status(400).json({ error: "No channel credentials configured yet — set them up under Channel Setup first" });
    }

    const settRes = await pool.query("SELECT institute_name FROM user_settings WHERE user_id=$1", [req.tenantId]);
    const businessName = settRes.rows[0]?.institute_name || "";
    const subject = `Message from ${businessName || "us"}`;

    let sent = 0, failed = 0;
    const jobs = [];
    for (const r of recipients) {
      const personalized = replaceVars(message, { name: r.name, phone: r.phone, email: r.email, institute_name: businessName });
      if (channels.includes("email") && r.email) {
        jobs.push(sendEmail(creds, r.email, personalized, subject).then(() => sent++).catch(() => failed++));
      }
      if (channels.includes("sms") && r.phone) {
        jobs.push(sendSMS(creds, r.phone, personalized).then(() => sent++).catch(() => failed++));
      }
      if (channels.includes("whatsapp") && r.phone) {
        jobs.push(sendWhatsApp(creds, r.phone, personalized).then(() => sent++).catch(() => failed++));
      }
    }
    await Promise.allSettled(jobs);

    const campaign = await pool.query(
      `INSERT INTO broadcast_campaigns (user_id, audience, audience_days, channels, message, recipient_count, sent_count, failed_count, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.tenantId, audience, days || null, channels, message, recipients.length, sent, failed, req.user.id],
    );
    res.json(campaign.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
