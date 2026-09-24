const nodemailer = require("nodemailer");
require("dotenv").config();
const { pool } = require("../db");

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});

function fmtDate(d) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// The "light" logo (dark wordmark, transparent background) only reads on a
// light banner — a dark/teal header would swallow it, so the header stays
// white instead of the old teal gradient just for this image to work.
const LOGO_URL = `${process.env.PUBLIC_API_URL || "https://lead-management.zalgostore.com"}/logo_light.png`;

function wrap(body) {
  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#0a1523;border-radius:14px;overflow:hidden">
  <div style="background:#ffffff;padding:24px 32px">
    <img src="${LOGO_URL}" alt="LeadLo" style="height:32px;display:block" />
    <div style="color:#5a7a96;font-size:11px;margin-top:8px;letter-spacing:0.14em;text-transform:uppercase">Lead Management System</div>
  </div>
  <div style="background:#0f1923;padding:32px;border:1px solid #1e3040;border-top:none">
    ${body}
  </div>
  <div style="background:#080e18;padding:16px 32px;text-align:center;color:#2d4560;font-size:11px">
    © Zalgo Infotech &nbsp;•&nbsp; You received this because you have a LeadLo account
  </div>
</div>`;
}

// Best-effort — a logging hiccup must never be why an email fails to send,
// so this never throws and never blocks send() below.
async function logEmailAttempt(recipient, type, status, errorMessage) {
  try {
    await pool.query(
      "INSERT INTO system_email_log (recipient, email_type, status, error_message) VALUES ($1,$2,$3,$4)",
      [recipient, type, status, errorMessage],
    );
  } catch (e) {
    console.error("[mailer] failed to log email attempt:", e.message);
  }
}

async function send(to, subject, html, type = "unknown") {
  try {
    await transport.sendMail({
      from: `"LeadLo" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    await logEmailAttempt(to, type, "sent", null);
  } catch (e) {
    console.error(`[mailer] failed to send "${subject}" to ${to}:`, e.message);
    await logEmailAttempt(to, type, "failed", e.message?.slice(0, 500) || "Unknown error");
  }
}

// ── OTP ──────────────────────────────────────────────────────────
async function sendOtp(email, name, otp) {
  await send(
    email,
    "Password Reset OTP — LeadLo",
    wrap(`
    <h2 style="color:#00c4ca;margin:0 0 8px">Password Reset</h2>
    <p style="color:#94a3b8;margin:0 0 24px">Hi <strong style="color:#e2e8f0">${name}</strong>, use this OTP to reset your password. It expires in <strong style="color:#e2e8f0">10 minutes</strong>.</p>
    <div style="background:#1a2535;border:1px solid #2d3f54;border-radius:10px;padding:28px;text-align:center;margin-bottom:24px">
      <div style="font-size:38px;font-weight:800;letter-spacing:14px;color:#00c4ca;font-family:monospace">${otp}</div>
    </div>
    <p style="color:#4a6380;font-size:12px;margin:0">Do not share this OTP with anyone. If you did not request this, please ignore.</p>
  `),
    "password_reset_otp",
  );
}

// ── REGISTRATION EMAIL VERIFICATION OTP ─────────────────────────
async function sendRegisterOtp(email, name, otp) {
  await send(
    email,
    "Verify your email — LeadLo",
    wrap(`
    <h2 style="color:#00c4ca;margin:0 0 8px">Verify your email</h2>
    <p style="color:#94a3b8;margin:0 0 24px">Hi <strong style="color:#e2e8f0">${name}</strong>, use this OTP to verify your email and finish creating your account. It expires in <strong style="color:#e2e8f0">10 minutes</strong>.</p>
    <div style="background:#1a2535;border:1px solid #2d3f54;border-radius:10px;padding:28px;text-align:center;margin-bottom:24px">
      <div style="font-size:38px;font-weight:800;letter-spacing:14px;color:#00c4ca;font-family:monospace">${otp}</div>
    </div>
    <p style="color:#4a6380;font-size:12px;margin:0">Do not share this OTP with anyone. If you did not request this, please ignore.</p>
  `),
    "register_otp",
  );
}

// ── TRIAL STARTED ────────────────────────────────────────────────
async function sendTrialStarted(email, name, planName, trialEndsAt) {
  await send(
    email,
    `Your ${planName} trial has started — LeadLo`,
    wrap(`
    <h2 style="color:#00c4ca;margin:0 0 8px">Welcome to your free trial! 🎉</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:#e2e8f0">${name}</strong>, your <strong style="color:#e2e8f0">${planName}</strong> trial is now active.</p>
    <div style="background:#1a2535;border:1px solid #2d3f54;border-radius:10px;padding:20px;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Plan</td>
          <td style="color:#e2e8f0;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${planName}</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Trial Ends</td>
          <td style="color:#00c4ca;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${fmtDate(trialEndsAt)}</td>
        </tr>
      </table>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0">Explore all features during your trial period. Upgrade before it ends to keep your data and access.</p>
  `),
    "trial_started",
  );
}

// ── PLAN ACTIVATED / RENEWED ─────────────────────────────────────
async function sendPlanActivated(email, name, planName, billingCycle, endsAt) {
  const cycleLabel =
    billingCycle === "yearly"
      ? "Yearly"
      : billingCycle === "monthly"
        ? "Monthly"
        : billingCycle;
  await send(
    email,
    `Subscription activated — ${planName} | LeadLo`,
    wrap(`
    <h2 style="color:#00c4ca;margin:0 0 8px">Subscription Activated ✅</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:#e2e8f0">${name}</strong>, your subscription is now active. Thank you!</p>
    <div style="background:#1a2535;border:1px solid #2d3f54;border-radius:10px;padding:20px;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Plan</td>
          <td style="color:#e2e8f0;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${planName}</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Billing</td>
          <td style="color:#e2e8f0;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${cycleLabel}</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Valid Until</td>
          <td style="color:#00c4ca;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${fmtDate(endsAt)}</td>
        </tr>
      </table>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0">You now have full access to all features included in the ${planName} plan. Login to your dashboard to get started.</p>
  `),
    "plan_activated",
  );
}

// ── EMPLOYEE SEAT ADD-ON PURCHASED ──────────────────────────────
async function sendAddonPurchased(email, name, seatsAdded, newLimit, amount) {
  await send(
    email,
    `${seatsAdded} employee seats added — LeadLo`,
    wrap(`
    <h2 style="color:#00c4ca;margin:0 0 8px">Seats Added ✅</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:#e2e8f0">${name}</strong>, your payment went through and your plan's seat limit has been increased.</p>
    <div style="background:#1a2535;border:1px solid #2d3f54;border-radius:10px;padding:20px;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Seats Added</td>
          <td style="color:#e2e8f0;font-size:14px;font-weight:600;padding:6px 0;text-align:right">+${seatsAdded}</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">New Total Limit</td>
          <td style="color:#00c4ca;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${newLimit === -1 ? "Unlimited" : newLimit}</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Amount Paid</td>
          <td style="color:#e2e8f0;font-size:14px;font-weight:600;padding:6px 0;text-align:right">₹${amount}</td>
        </tr>
      </table>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0">These seats stay on your account until you or a Super Admin change them — no separate renewal needed.</p>
  `),
    "addon_purchased",
  );
}

// ── PLAN EXTENDED ────────────────────────────────────────────────
async function sendPlanExtended(email, name, planName, newEndsAt, days) {
  await send(
    email,
    `Subscription extended by ${days} days — LeadLo`,
    wrap(`
    <h2 style="color:#00c4ca;margin:0 0 8px">Subscription Extended ✅</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:#e2e8f0">${name}</strong>, your <strong style="color:#e2e8f0">${planName}</strong> subscription has been extended.</p>
    <div style="background:#1a2535;border:1px solid #2d3f54;border-radius:10px;padding:20px;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Extended By</td>
          <td style="color:#e2e8f0;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${days} days</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">New Expiry</td>
          <td style="color:#00c4ca;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${fmtDate(newEndsAt)}</td>
        </tr>
      </table>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0">Your access has been extended. No action required from your side.</p>
  `),
    "plan_extended",
  );
}

// ── PLAN EXPIRING SOON ───────────────────────────────────────────
async function sendExpiryReminder(email, name, planName, endsAt, daysLeft) {
  const urgency = daysLeft <= 3 ? "#e53e3e" : "#e6a817";
  await send(
    email,
    `⚠️ Your subscription expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — LeadLo`,
    wrap(`
    <h2 style="color:${urgency};margin:0 0 8px">Subscription Expiring Soon ⚠️</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:#e2e8f0">${name}</strong>, your <strong style="color:#e2e8f0">${planName}</strong> subscription is expiring soon. Renew now to avoid interruption.</p>
    <div style="background:#1a2535;border:1px solid ${urgency}55;border-radius:10px;padding:20px;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Plan</td>
          <td style="color:#e2e8f0;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${planName}</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Expires On</td>
          <td style="color:${urgency};font-size:14px;font-weight:700;padding:6px 0;text-align:right">${fmtDate(endsAt)}</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Days Left</td>
          <td style="color:${urgency};font-size:20px;font-weight:800;padding:6px 0;text-align:right">${daysLeft}</td>
        </tr>
      </table>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0">Contact your administrator to renew your subscription and continue uninterrupted access to LeadLo.</p>
  `),
    "expiry_reminder",
  );
}

// ── PLAN EXPIRED ─────────────────────────────────────────────────
async function sendPlanExpired(email, name, planName, expiredOn) {
  await send(
    email,
    `Your subscription has expired — LeadLo`,
    wrap(`
    <h2 style="color:#e53e3e;margin:0 0 8px">Subscription Expired</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:#e2e8f0">${name}</strong>, your <strong style="color:#e2e8f0">${planName}</strong> subscription has expired. Your data is safe — renew to regain access.</p>
    <div style="background:#1a2535;border:1px solid #e53e3e55;border-radius:10px;padding:20px;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Plan</td>
          <td style="color:#e2e8f0;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${planName}</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Expired On</td>
          <td style="color:#e53e3e;font-size:14px;font-weight:700;padding:6px 0;text-align:right">${fmtDate(expiredOn)}</td>
        </tr>
      </table>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0">Please contact your administrator or visit the plans page to renew your subscription.</p>
  `),
    "plan_expired",
  );
}

// ── PLAN CANCELLED ───────────────────────────────────────────────
async function sendPlanCancelled(email, name, planName) {
  await send(
    email,
    `Subscription cancelled — LeadLo`,
    wrap(`
    <h2 style="color:#e53e3e;margin:0 0 8px">Subscription Cancelled</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:#e2e8f0">${name}</strong>, your <strong style="color:#e2e8f0">${planName}</strong> subscription has been cancelled by the administrator.</p>
    <div style="background:#1a2535;border:1px solid #e53e3e55;border-radius:10px;padding:20px;margin-bottom:20px">
      <p style="color:#94a3b8;font-size:13px;margin:0">Your access to LeadLo features has been revoked. If you believe this is a mistake, please contact your administrator.</p>
    </div>
    <p style="color:#4a6380;font-size:12px;margin:0">Your existing data remains safe and can be accessed once a new subscription is activated.</p>
  `),
    "plan_cancelled",
  );
}

// ── RENEWAL PAYMENT FAILED (day 1 of grace period) ───────────────
async function sendPaymentFailed(email, name, planName, graceDays, isLastWarning = false) {
  const subject = isLastWarning
    ? `⚠️ Last chance — your card is still failing, LeadLo access ends today`
    : `⚠️ Your renewal payment failed — LeadLo`;
  await send(
    email,
    subject,
    wrap(`
    <h2 style="color:#e53e3e;margin:0 0 8px">Payment Failed</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:#e2e8f0">${name}</strong>, we tried to renew your <strong style="color:#e2e8f0">${planName}</strong> subscription but the charge on your saved card didn't go through.</p>
    <div style="background:#1a2535;border:1px solid #e53e3e55;border-radius:10px;padding:20px;margin-bottom:20px">
      <p style="color:#94a3b8;font-size:13px;margin:0">${
        isLastWarning
          ? `This is your final reminder — if the payment isn't fixed today, your access will pause until you update your card. Your data stays safe either way.`
          : `You still have <strong style="color:#e2e8f0">${graceDays} days</strong> of full access while we retry the charge — update your card in Settings → Billing to avoid any interruption.`
      }</p>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0">Login and visit Settings → Billing to update your payment method.</p>
  `),
    "payment_failed",
  );
}

// ── MIGRATION NOTICE — pre-existing subscriber, no saved mandate ──
async function sendMigrationNotice(email, name, planName, endsAt) {
  await send(
    email,
    `Action needed before your next renewal — LeadLo`,
    wrap(`
    <h2 style="color:#e6a817;margin:0 0 8px">Set up auto-renewal (optional)</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:#e2e8f0">${name}</strong>, we've upgraded how <strong style="color:#e2e8f0">${planName}</strong> renewals work. Your current subscription is unaffected and stays active until <strong style="color:#e2e8f0">${fmtDate(endsAt)}</strong>.</p>
    <div style="background:#1a2535;border:1px solid #2d3f54;border-radius:10px;padding:20px;margin-bottom:20px">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 10px">You have two options before then:</p>
      <p style="color:#e2e8f0;font-size:13px;margin:0 0 6px">1. <strong>Add a card</strong> in Settings → Billing to renew automatically — no action needed after that.</p>
      <p style="color:#e2e8f0;font-size:13px;margin:0">2. <strong>Do nothing</strong> and renew manually like before, any time before it expires.</p>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0">Either way, your data and access continue exactly as they are today.</p>
  `),
    "migration_notice",
  );
}

// ── CONTACT FORM SUBMISSION (public marketing site → admin inbox) ──
const SUPERADMIN_NOTIFY_EMAIL = "sales@zalgoinfotech.com";
// Public, unauthenticated form — escape before interpolating into HTML email.
function escapeHtml(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
async function sendContactNotification({
  name,
  email,
  phone,
  company,
  message,
}) {
  name = escapeHtml(name);
  email = escapeHtml(email);
  phone = escapeHtml(phone);
  company = escapeHtml(company);
  message = escapeHtml(message);
  await send(
    SUPERADMIN_NOTIFY_EMAIL,
    `New Contact Request — ${name}`,
    wrap(`
    <h2 style="color:#00c4ca;margin:0 0 8px">New Contact Request 📩</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Someone submitted the contact form on the website.</p>
    <div style="background:#1a2535;border:1px solid #2d3f54;border-radius:10px;padding:20px;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Name</td>
          <td style="color:#e2e8f0;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${name}</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Email</td>
          <td style="color:#00c4ca;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${email}</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Phone</td>
          <td style="color:#e2e8f0;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${phone || "—"}</td>
        </tr>
        <tr>
          <td style="color:#5a7a96;font-size:12px;padding:6px 0;text-transform:uppercase;letter-spacing:0.06em">Company</td>
          <td style="color:#e2e8f0;font-size:14px;font-weight:600;padding:6px 0;text-align:right">${company || "—"}</td>
        </tr>
      </table>
    </div>
    <p style="color:#5a7a96;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.06em">Message</p>
    <p style="color:#e2e8f0;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">${message || "—"}</p>
  `),
    "contact_notification",
  );
}

// Sent to the person who submitted the form — a receipt, not a reply, so it
// asks for nothing back and just sets an expectation on when they'll hear
// from a real person.
async function sendContactAutoReply(toEmail, name) {
  const safeName = escapeHtml(name);
  await send(
    toEmail,
    "We've received your message — LeadLo",
    wrap(`
    <h2 style="color:#00c4ca;margin:0 0 8px">Thanks for reaching out! 👋</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:#e2e8f0">${safeName}</strong>, we've received your message and it's already with our team.</p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px">Our team will get back to you <strong style="color:#e2e8f0">within 24 hours</strong> to answer your questions or set up a walkthrough — whatever you need.</p>
    <p style="color:#4a6380;font-size:12px;margin:0">This is an automated confirmation — no reply is needed. If it's urgent, you can also reach us directly at sales@zalgoinfotech.com.</p>
  `),
    "contact_autoreply",
  );
}

module.exports = {
  sendOtp,
  sendRegisterOtp,
  sendTrialStarted,
  sendPlanActivated,
  sendAddonPurchased,
  sendPlanExtended,
  sendExpiryReminder,
  sendPlanExpired,
  sendPlanCancelled,
  sendPaymentFailed,
  sendMigrationNotice,
  sendContactNotification,
  sendContactAutoReply,
};
