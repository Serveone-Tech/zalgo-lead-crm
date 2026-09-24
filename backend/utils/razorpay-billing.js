const Razorpay = require("razorpay");
const { pool } = require("../db");
const mailer = require("./mailer");

// Built lazily, not at module load — same reasoning as routes/payments.js's
// original getRazorpay(): constructing eagerly would crash the whole
// backend on any deploy where the env vars aren't set yet.
let razorpay = null;
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

// Razorpay's own Plan object (amount + billing interval) is separate from
// this app's `plans` row (features/limits) — created once per (plan,
// cycle) combo on first use and cached on the plans row so every future
// subscribe for that plan/cycle reuses the same Razorpay plan id.
async function getOrCreateRazorpayPlan(plan, cycle) {
  const rzp = getRazorpay();
  const col = cycle === "yearly" ? "razorpay_plan_id_yearly" : "razorpay_plan_id_monthly";
  if (plan[col]) return plan[col];

  const amount = parseFloat(cycle === "yearly" ? plan.price_yearly : plan.price_monthly);
  const created = await rzp.plans.create({
    period: cycle === "yearly" ? "yearly" : "monthly",
    interval: 1,
    item: {
      name: `LeadLo ${plan.name} (${cycle})`,
      amount: Math.round(amount * 100),
      currency: "INR",
    },
  });
  await pool.query(`UPDATE plans SET ${col}=$1 WHERE id=$2`, [created.id, plan.id]);
  return created.id;
}

// One Razorpay Customer per tenant, reused across plan changes/renewals —
// looked up from whatever the tenant's most recent subscription row
// already has, since that's the only place it's stored.
async function getOrCreateRazorpayCustomer(userRow, currentSub) {
  const rzp = getRazorpay();
  if (currentSub?.razorpay_customer_id) return currentSub.razorpay_customer_id;
  const created = await rzp.customers.create({
    name: userRow.name,
    email: userRow.email,
    notes: { user_id: String(userRow.id) },
  });
  return created.id;
}

// Matches a Razorpay subscription id back to our row, first by the id
// itself (set the moment /subscribe created it), falling back to the
// notes payload (user_id, set at creation) for the very first webhook of a
// brand new subscription in case /subscribe's own write hasn't committed
// yet by the time Razorpay's webhook arrives.
async function findSubscriptionByRazorpayId(razorpaySubId, notes) {
  const byId = await pool.query("SELECT * FROM subscriptions WHERE razorpay_subscription_id=$1", [razorpaySubId]);
  if (byId.rows[0]) return byId.rows[0];
  if (notes?.user_id) {
    const { rows } = await pool.query(
      "SELECT * FROM subscriptions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [notes.user_id],
    );
    return rows[0] || null;
  }
  return null;
}

// Shared by both the webhook's subscription.charged handler and the
// /subscription-status polling fallback, so a successful charge is
// activated identically no matter which of the two paths notices it first
// — whichever runs first wins, the other is a no-op via the same
// razorpay_subscription_id/ends_at update.
async function activateFromCharge(row, { razorpaySubId, billingCycle, planId }) {
  const days = (billingCycle || row.billing_cycle) === "yearly" ? 365 : 30;
  const endsAt = new Date(Date.now() + days * 86400000);
  await pool.query(
    `UPDATE subscriptions SET status='active', ends_at=$1, past_due_since=NULL,
       expiry_reminder_sent=false, razorpay_subscription_id=$2, plan_id=COALESCE($3, plan_id)
     WHERE id=$4`,
    [endsAt, razorpaySubId, planId || null, row.id],
  );
  const u = await pool.query("SELECT name, email FROM users WHERE id=$1", [row.user_id]);
  const plan = await pool.query("SELECT name FROM plans WHERE id=$1", [planId || row.plan_id]);
  if (u.rows[0] && plan.rows[0]) {
    mailer.sendPlanActivated(u.rows[0].email, u.rows[0].name, plan.rows[0].name, billingCycle || row.billing_cycle, endsAt);
  }
  return endsAt;
}

module.exports = {
  getRazorpay,
  getOrCreateRazorpayPlan,
  getOrCreateRazorpayCustomer,
  findSubscriptionByRazorpayId,
  activateFromCharge,
};
