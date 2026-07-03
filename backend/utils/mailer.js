const nodemailer = require("nodemailer");
require("dotenv").config();

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});

function fmtDate(d) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function wrap(body) {
  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#0a1523;border-radius:14px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#00868a 0%,#005f6b 100%);padding:28px 32px">
    <div style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.3px">Zalgo CRM</div>
    <div style="color:rgba(255,255,255,0.65);font-size:11px;margin-top:3px;letter-spacing:0.14em;text-transform:uppercase">Lead Management System</div>
  </div>
  <div style="background:#0f1923;padding:32px;border:1px solid #1e3040;border-top:none">
    ${body}
  </div>
  <div style="background:#080e18;padding:16px 32px;text-align:center;color:#2d4560;font-size:11px">
    © Zalgo Infotech &nbsp;•&nbsp; You received this because you have a Zalgo CRM account
  </div>
</div>`;
}

async function send(to, subject, html) {
  try {
    await transport.sendMail({
      from: `"Zalgo CRM" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
  } catch (e) {
    console.error(`[mailer] failed to send "${subject}" to ${to}:`, e.message);
  }
}

// ── OTP ──────────────────────────────────────────────────────────
async function sendOtp(email, name, otp) {
  await send(email, "Password Reset OTP — Zalgo CRM", wrap(`
    <h2 style="color:#00c4ca;margin:0 0 8px">Password Reset</h2>
    <p style="color:#94a3b8;margin:0 0 24px">Hi <strong style="color:#e2e8f0">${name}</strong>, use this OTP to reset your password. It expires in <strong style="color:#e2e8f0">10 minutes</strong>.</p>
    <div style="background:#1a2535;border:1px solid #2d3f54;border-radius:10px;padding:28px;text-align:center;margin-bottom:24px">
      <div style="font-size:38px;font-weight:800;letter-spacing:14px;color:#00c4ca;font-family:monospace">${otp}</div>
    </div>
    <p style="color:#4a6380;font-size:12px;margin:0">Do not share this OTP with anyone. If you did not request this, please ignore.</p>
  `));
}

// ── TRIAL STARTED ────────────────────────────────────────────────
async function sendTrialStarted(email, name, planName, trialEndsAt) {
  await send(email, `Your ${planName} trial has started — Zalgo CRM`, wrap(`
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
  `));
}

// ── PLAN ACTIVATED / RENEWED ─────────────────────────────────────
async function sendPlanActivated(email, name, planName, billingCycle, endsAt) {
  const cycleLabel = billingCycle === "yearly" ? "Yearly" : billingCycle === "monthly" ? "Monthly" : billingCycle;
  await send(email, `Subscription activated — ${planName} | Zalgo CRM`, wrap(`
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
  `));
}

// ── PLAN EXTENDED ────────────────────────────────────────────────
async function sendPlanExtended(email, name, planName, newEndsAt, days) {
  await send(email, `Subscription extended by ${days} days — Zalgo CRM`, wrap(`
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
  `));
}

// ── PLAN EXPIRING SOON ───────────────────────────────────────────
async function sendExpiryReminder(email, name, planName, endsAt, daysLeft) {
  const urgency = daysLeft <= 3 ? "#e53e3e" : "#e6a817";
  await send(email, `⚠️ Your subscription expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — Zalgo CRM`, wrap(`
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
    <p style="color:#94a3b8;font-size:13px;margin:0">Contact your administrator to renew your subscription and continue uninterrupted access to Zalgo CRM.</p>
  `));
}

// ── PLAN EXPIRED ─────────────────────────────────────────────────
async function sendPlanExpired(email, name, planName, expiredOn) {
  await send(email, `Your subscription has expired — Zalgo CRM`, wrap(`
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
  `));
}

// ── PLAN CANCELLED ───────────────────────────────────────────────
async function sendPlanCancelled(email, name, planName) {
  await send(email, `Subscription cancelled — Zalgo CRM`, wrap(`
    <h2 style="color:#e53e3e;margin:0 0 8px">Subscription Cancelled</h2>
    <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:#e2e8f0">${name}</strong>, your <strong style="color:#e2e8f0">${planName}</strong> subscription has been cancelled by the administrator.</p>
    <div style="background:#1a2535;border:1px solid #e53e3e55;border-radius:10px;padding:20px;margin-bottom:20px">
      <p style="color:#94a3b8;font-size:13px;margin:0">Your access to Zalgo CRM features has been revoked. If you believe this is a mistake, please contact your administrator.</p>
    </div>
    <p style="color:#4a6380;font-size:12px;margin:0">Your existing data remains safe and can be accessed once a new subscription is activated.</p>
  `));
}

module.exports = {
  sendOtp,
  sendTrialStarted,
  sendPlanActivated,
  sendPlanExtended,
  sendExpiryReminder,
  sendPlanExpired,
  sendPlanCancelled,
};
