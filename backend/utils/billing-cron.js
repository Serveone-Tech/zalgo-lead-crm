const cron = require("node-cron");
const { pool } = require("../db");
const mailer = require("./mailer");

// Everything here is a periodic DB sweep for state changes that can't be
// purely event-driven (Razorpay's webhooks tell us about charges/failures,
// but nothing tells us "3 days have now passed since the last failure" or
// "this trial is now 12 days old" — those only exist by checking the
// clock). Runs inside the existing backend PM2 process on an hourly
// schedule — no separate process, no new DB pool, matching the codebase's
// existing setInterval-based runScheduledTriggers() convention for
// anything else that runs independently of a request.

const GRACE_DAYS = 3;

// past_due for more than GRACE_DAYS with no successful retry -> expired.
// Data is never touched by this — only the status flips.
async function sweepGraceExpiry() {
  const { rows } = await pool.query(
    `SELECT s.id, s.user_id, s.plan_id, p.name AS plan_name, u.name, u.email
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     JOIN users u ON u.id = s.user_id
     WHERE s.status='past_due' AND s.razorpay_subscription_id IS NOT NULL
       AND s.past_due_since < NOW() - INTERVAL '${GRACE_DAYS} days'`,
  );
  for (const row of rows) {
    await pool.query("UPDATE subscriptions SET status='expired' WHERE id=$1", [row.id]);
    mailer.sendPlanExpired(row.email, row.name, row.plan_name, new Date());
  }
  if (rows.length) console.log(`[billing-cron] expired ${rows.length} subscription(s) past grace period`);
}

// Day-1 welcome is already sent synchronously at trial creation
// (routes/auth.js) — this only covers the day-12 "ending soon" nudge for a
// 15-day trial, reusing the same expiry-reminder email/flag the active-plan
// path already uses so a trial row can't get double-emailed if it later
// becomes a real subscription.
async function sweepTrialReminders() {
  const { rows } = await pool.query(
    `SELECT s.id, s.trial_ends_at, p.name AS plan_name, u.name, u.email
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     JOIN users u ON u.id = s.user_id
     WHERE s.status='trialing' AND s.trial_ends_at IS NOT NULL
       AND s.trial_ends_at > NOW() AND s.trial_ends_at <= NOW() + INTERVAL '3 days'
       AND s.expiry_reminder_sent = false`,
  );
  for (const row of rows) {
    const daysLeft = Math.ceil((new Date(row.trial_ends_at) - Date.now()) / 86400000);
    mailer.sendExpiryReminder(row.email, row.name, row.plan_name, row.trial_ends_at, daysLeft);
    await pool.query("UPDATE subscriptions SET expiry_reminder_sent=true WHERE id=$1", [row.id]);
  }
  if (rows.length) console.log(`[billing-cron] sent ${rows.length} trial-ending reminder(s)`);
}

// 3-days-before-renewal heads-up for active paid subscriptions — mostly a
// courtesy since Razorpay's own recurring engine drives the actual charge,
// but requested explicitly. Reuses the same expiry_reminder_sent flag/email
// as the trial reminder above (one row is only ever in one of the two
// states at a time, so there's no collision).
async function sweepRenewalReminders() {
  const { rows } = await pool.query(
    `SELECT s.id, s.ends_at, p.name AS plan_name, u.name, u.email
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     JOIN users u ON u.id = s.user_id
     WHERE s.status='active' AND s.ends_at IS NOT NULL
       AND s.ends_at > NOW() AND s.ends_at <= NOW() + INTERVAL '3 days'
       AND s.expiry_reminder_sent = false`,
  );
  for (const row of rows) {
    const daysLeft = Math.ceil((new Date(row.ends_at) - Date.now()) / 86400000);
    mailer.sendExpiryReminder(row.email, row.name, row.plan_name, row.ends_at, daysLeft);
    await pool.query("UPDATE subscriptions SET expiry_reminder_sent=true WHERE id=$1", [row.id]);
  }
  if (rows.length) console.log(`[billing-cron] sent ${rows.length} renewal reminder(s)`);
}

// One-time nudge (per row) for tenants who subscribed before recurring
// billing existed — no saved mandate, so their next renewal won't
// auto-charge unless they add a card. Sent once, within 7 days of expiry.
async function sweepMigrationNotices() {
  const { rows } = await pool.query(
    `SELECT s.id, s.ends_at, p.name AS plan_name, u.name, u.email
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     JOIN users u ON u.id = s.user_id
     WHERE s.status='active' AND s.razorpay_subscription_id IS NULL
       AND s.ends_at IS NOT NULL AND s.ends_at <= NOW() + INTERVAL '7 days'
       AND s.migration_notice_sent = false`,
  );
  for (const row of rows) {
    mailer.sendMigrationNotice(row.email, row.name, row.plan_name, row.ends_at);
    await pool.query("UPDATE subscriptions SET migration_notice_sent=true WHERE id=$1", [row.id]);
  }
  if (rows.length) console.log(`[billing-cron] sent ${rows.length} migration notice(s)`);
}

async function runAllSweeps() {
  // Written up front, not after — this records "the cron actually fired,"
  // which is what a health check needs (is it alive at all), independent
  // of whether any individual sweep below succeeds. Persisted (not just
  // in-memory) so it survives a restart instead of showing "unknown"
  // right after a deploy.
  await pool
    .query(
      `INSERT INTO platform_config (key, value) VALUES ('billing_cron_last_run', $1)
       ON CONFLICT (key) DO UPDATE SET value=$1`,
      [new Date().toISOString()],
    )
    .catch((e) => console.error("[billing-cron] failed to record last-run time:", e.message));

  try {
    await sweepGraceExpiry();
    await sweepTrialReminders();
    await sweepRenewalReminders();
    await sweepMigrationNotices();
  } catch (e) {
    console.error("[billing-cron] sweep failed:", e.message);
  }
}

function startBillingCron() {
  runAllSweeps(); // once at boot, don't wait for the first hourly tick
  cron.schedule("0 * * * *", runAllSweeps);
}

module.exports = { startBillingCron };
