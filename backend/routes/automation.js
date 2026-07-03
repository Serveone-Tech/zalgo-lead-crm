const express = require("express");
const { pool } = require("../db");
const { auth, requirePermission, requireSubscription, requirePlanFeature } = require("../middleware/auth");

const router = express.Router();

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
      cols = {
        whatsapp_enabled: !!fields.whatsapp_enabled,
        wa_account_sid: fields.wa_account_sid || cur.wa_account_sid || "",
        wa_auth_token: fields.wa_auth_token?.includes("****")
          ? cur.wa_auth_token || ""
          : fields.wa_auth_token || "",
        wa_from: fields.wa_from || cur.wa_from || "",
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

    // ── WhatsApp via Twilio ──
    if (channel === "whatsapp") {
      if (!creds.whatsapp_enabled)
        return res
          .status(400)
          .json({ error: "WhatsApp channel is not enabled" });
      if (!creds.wa_account_sid)
        return res
          .status(400)
          .json({ error: "Twilio Account SID not configured" });
      if (!creds.wa_auth_token)
        return res
          .status(400)
          .json({ error: "Twilio Auth Token not configured" });
      if (!creds.wa_from)
        return res
          .status(400)
          .json({ error: "WhatsApp From number not configured" });

      let twilio;
      try {
        twilio = require("twilio");
      } catch {
        return res
          .status(500)
          .json({ error: "twilio not installed. Run: npm install twilio" });
      }

      const client = twilio(creds.wa_account_sid, creds.wa_auth_token);

      let toNum = to.replace(/\s+/g, "");
      if (!toNum.startsWith("+")) toNum = "+91" + toNum;
      const waTo = toNum.startsWith("whatsapp:") ? toNum : `whatsapp:${toNum}`;
      const waFrom = creds.wa_from.startsWith("whatsapp:")
        ? creds.wa_from
        : `whatsapp:${creds.wa_from}`;

      await client.messages.create({
        body: message,
        from: waFrom,
        to: waTo,
      });

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

module.exports = router;
