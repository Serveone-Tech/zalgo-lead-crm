const { pool } = require("../db");

function replaceVars(template, data) {
  return template
    .replace(/\{name\}/g, data.name || "")
    .replace(/\{phone\}/g, data.phone || "")
    .replace(/\{email\}/g, data.email || "")
    .replace(/\{amount\}/g, data.amount ? `${data.amount}` : "")
    .replace(/\{due_date\}/g, data.due_date || "")
    .replace(/\{institute_name\}/g, data.institute_name || "");
}

function cleanPhone(phone) {
  if (!phone) return "";
  let p = phone.toString().replace(/\s+/g, "").replace(/-/g, "");
  if (!p.startsWith("+")) p = "+91" + p;
  return p;
}

async function sendEmail(creds, to, message, subject) {
  if (!creds.email_enabled || !creds.email_api_key || !creds.email_from) {
    console.log("Email skipped — not configured");
    return;
  }
  if (!to || !to.includes("@")) {
    console.log("Email skipped — invalid address:", to);
    return;
  }

  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    auth: { user: "apikey", pass: creds.email_api_key },
  });
  await transporter.sendMail({
    from: `"${creds.email_from_name || "CRM"}" <${creds.email_from}>`,
    to,
    subject: subject || "Message from CRM",
    text: message,
    html: `<p>${message.replace(/\n/g, "<br>")}</p>`,
  });
  console.log("✅ Email sent to:", to);
}

async function sendSMS(creds, phone, message) {
  if (
    !creds.sms_enabled ||
    !creds.sms_account_sid ||
    !creds.sms_auth_token ||
    !creds.sms_from
  ) {
    console.log("SMS skipped — not configured");
    return;
  }
  const toNum = cleanPhone(phone);
  if (!toNum) {
    console.log("SMS skipped — no phone");
    return;
  }

  const twilio = require("twilio");
  const client = twilio(creds.sms_account_sid, creds.sms_auth_token);
  await client.messages.create({
    body: message,
    from: creds.sms_from,
    to: toNum,
  });
  console.log("✅ SMS sent to:", toNum);
}

async function sendWhatsApp(creds, phone, message) {
  if (
    !creds.whatsapp_enabled ||
    !creds.wa_account_sid ||
    !creds.wa_auth_token ||
    !creds.wa_from
  ) {
    console.log("WhatsApp skipped — not configured");
    return;
  }
  const toNum = cleanPhone(phone);
  if (!toNum) {
    console.log("WhatsApp skipped — no phone");
    return;
  }

  const twilio = require("twilio");
  const client = twilio(creds.wa_account_sid, creds.wa_auth_token);

  // ✅ Proper WhatsApp format
  const waTo = `whatsapp:${toNum}`;
  const waFrom = creds.wa_from.startsWith("whatsapp:")
    ? creds.wa_from
    : `whatsapp:${creds.wa_from}`;

  await client.messages.create({ body: message, from: waFrom, to: waTo });
  console.log("✅ WhatsApp sent to:", toNum);
}

async function fireTrigger(triggerId, userId, data = {}) {
  try {
    const trigResult = await pool.query(
      `SELECT * FROM automation_triggers WHERE user_id=$1 AND trigger_id=$2 AND enabled=true`,
      [userId, triggerId],
    );
    if (trigResult.rows.length === 0) {
      console.log(`Trigger [${triggerId}] not enabled — skip`);
      return;
    }

    const trigger = trigResult.rows[0];
    const channels = trigger.channels || [];
    if (channels.length === 0) {
      console.log(`Trigger [${triggerId}] no channels — skip`);
      return;
    }

    const credResult = await pool.query(
      "SELECT * FROM automation_credentials WHERE user_id=$1",
      [userId],
    );
    if (credResult.rows.length === 0) {
      console.log(`No credentials for user ${userId}`);
      return;
    }
    const creds = credResult.rows[0];

    const settResult = await pool.query(
      "SELECT institute_name FROM user_settings WHERE user_id=$1",
      [userId],
    );
    const instituteName = settResult.rows[0]?.institute_name || "";

    const msgData = { ...data, institute_name: instituteName };
    const message = replaceVars(trigger.template || "", msgData);
    if (!message.trim()) {
      console.log(`Trigger [${triggerId}] empty template — skip`);
      return;
    }

    const subject = `Notification from ${instituteName || "CRM"}`;
    console.log(
      `🔔 Firing trigger [${triggerId}] via [${channels.join(", ")}] for: ${data.name}`,
    );

    const promises = [];
    if (channels.includes("email") && data.email) {
      promises.push(
        sendEmail(creds, data.email, message, subject).catch((e) =>
          console.error("Email fail:", e.message),
        ),
      );
    }
    if (channels.includes("sms") && data.phone) {
      promises.push(
        sendSMS(creds, data.phone, message).catch((e) =>
          console.error("SMS fail:", e.message),
        ),
      );
    }
    if (channels.includes("whatsapp") && data.phone) {
      promises.push(
        sendWhatsApp(creds, data.phone, message).catch((e) =>
          console.error("WhatsApp fail:", e.message),
        ),
      );
    }

    await Promise.allSettled(promises);
  } catch (e) {
    console.error(`fireTrigger error [${triggerId}]:`, e.message);
  }
}

module.exports = { fireTrigger };
