const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { auth } = require("../middleware/auth");
const mailer = require("../utils/mailer");
const {
  getRazorpay,
  getOrCreateRazorpayPlan,
  getOrCreateRazorpayCustomer,
  activateFromCharge,
} = require("../utils/razorpay-billing");

const router = express.Router();

// Only the account owner manages billing — same rule as /auth/subscribe.
function requireOwner(req, res, next) {
  if (req.user?.parentId) {
    return res.status(403).json({ error: "Only the account owner can manage the subscription." });
  }
  next();
}

// ── POST create a Razorpay order for a plan purchase/renewal ──────────
// Creating an order doesn't move any money — it just registers the
// intended charge with Razorpay so the frontend can open Checkout against
// it. The plan/amount are looked up server-side from the DB, never trusted
// from the client, so nothing about the price can be tampered with.
router.post("/create-order", auth, requireOwner, async (req, res) => {
  const razorpay = getRazorpay();
  if (!razorpay) return res.status(503).json({ error: "Online payment isn't set up yet — contact support." });
  const { plan_id, billing_cycle } = req.body;
  if (!plan_id) return res.status(400).json({ error: "plan_id required" });
  try {
    const planRes = await pool.query("SELECT * FROM plans WHERE id=$1 AND is_active=true", [plan_id]);
    const plan = planRes.rows[0];
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const cycle = billing_cycle === "yearly" ? "yearly" : "monthly";
    const amount = parseFloat(cycle === "yearly" ? plan.price_yearly : plan.price_monthly);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "This plan has no payable price — use the free trial instead." });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `sub_${req.userId}_${Date.now()}`,
      notes: { user_id: String(req.userId), plan_id: String(plan_id), billing_cycle: cycle },
    });

    await pool.query(
      `INSERT INTO payments (user_id, plan_id, billing_cycle, amount, razorpay_order_id, status)
       VALUES ($1,$2,$3,$4,$5,'created')`,
      [req.userId, plan_id, cycle, amount, order.id],
    );

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan_name: plan.name,
      billing_cycle: cycle,
    });
  } catch (e) {
    console.error("Razorpay create-order failed:", e.message);
    res.status(500).json({ error: "Could not start payment. Please try again." });
  }
});

// ── POST verify a completed Checkout payment and activate the plan ────
// Razorpay's own signature (HMAC-SHA256 of "order_id|payment_id" with the
// account's key secret) is the only thing that proves this callback really
// came from a successful payment — everything else in the request body is
// just what the browser reported back, so the plan is only ever activated
// once that signature checks out against our own order row.
router.post("/verify", auth, requireOwner, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment details" });
  }
  try {
    const payRes = await pool.query(
      "SELECT * FROM payments WHERE razorpay_order_id=$1 AND user_id=$2",
      [razorpay_order_id, req.userId],
    );
    const payment = payRes.rows[0];
    if (!payment) return res.status(404).json({ error: "Order not found" });
    if (payment.status === "paid") return res.json({ success: true, alreadyProcessed: true });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expectedSignature !== razorpay_signature) {
      await pool.query("UPDATE payments SET status='failed' WHERE id=$1", [payment.id]);
      return res.status(400).json({ error: "Payment verification failed" });
    }

    await pool.query(
      "UPDATE payments SET status='paid', razorpay_payment_id=$1, paid_at=NOW() WHERE id=$2",
      [razorpay_payment_id, payment.id],
    );

    const plan = (await pool.query("SELECT * FROM plans WHERE id=$1", [payment.plan_id])).rows[0];
    const now = new Date();
    const days = payment.billing_cycle === "yearly" ? 365 : 30;
    const ends_at = new Date(now.getTime() + days * 86400000);

    // Manual one-time renewal path (no saved mandate) — still offered
    // alongside /subscribe for tenants who'd rather not save a card.
    await pool.query("UPDATE subscriptions SET status='canceled' WHERE user_id=$1", [req.userId]);
    await pool.query(
      `INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, starts_at, ends_at, amount_paid, payment_ref)
       VALUES ($1,$2,'active',$3,$4,$5,$6,$7)`,
      [req.userId, payment.plan_id, payment.billing_cycle, now, ends_at, payment.amount, razorpay_payment_id],
    );

    const userRow = await pool.query("SELECT name, email FROM users WHERE id=$1", [req.userId]);
    const u = userRow.rows[0];
    if (u && plan) mailer.sendPlanActivated(u.email, u.name, plan.name, payment.billing_cycle, ends_at);

    res.json({ success: true, plan_name: plan?.name, ends_at });
  } catch (e) {
    console.error("Razorpay verify failed:", e.message);
    res.status(500).json({ error: "Could not verify payment" });
  }
});

// ── GET the current per-bundle add-on price (5 seats) — Super Admin can
// change this in platform_config without a code deploy.
router.get("/addon/price", auth, requireOwner, async (req, res) => {
  try {
    const row = await pool.query("SELECT value FROM platform_config WHERE key='employee_addon_price'");
    res.json({ price: parseFloat(row.rows[0]?.value) || 499, seats_per_bundle: 5 });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST create an order for extra employee seats (5 per bundle) ──────
router.post("/addon/create-order", auth, requireOwner, async (req, res) => {
  const razorpay = getRazorpay();
  if (!razorpay) return res.status(503).json({ error: "Online payment isn't set up yet — contact support." });
  const bundles = parseInt(req.body.bundles);
  if (!bundles || bundles < 1) return res.status(400).json({ error: "bundles must be at least 1" });
  try {
    const priceRow = await pool.query("SELECT value FROM platform_config WHERE key='employee_addon_price'");
    const pricePerBundle = parseFloat(priceRow.rows[0]?.value) || 499;
    const amount = pricePerBundle * bundles;
    const seats = bundles * 5;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `addon_${req.userId}_${Date.now()}`,
      notes: { user_id: String(req.userId), bundles: String(bundles), seats: String(seats) },
    });

    await pool.query(
      `INSERT INTO employee_addon_purchases (user_id, bundles, seats_added, amount, razorpay_order_id, status)
       VALUES ($1,$2,$3,$4,$5,'created')`,
      [req.userId, bundles, seats, amount, order.id],
    );

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      seats,
    });
  } catch (e) {
    console.error("Razorpay addon create-order failed:", e.message);
    res.status(500).json({ error: "Could not start payment. Please try again." });
  }
});

// ── POST verify an add-on payment and add the seats ────────────────────
router.post("/addon/verify", auth, requireOwner, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment details" });
  }
  try {
    const purchaseRes = await pool.query(
      "SELECT * FROM employee_addon_purchases WHERE razorpay_order_id=$1 AND user_id=$2",
      [razorpay_order_id, req.userId],
    );
    const purchase = purchaseRes.rows[0];
    if (!purchase) return res.status(404).json({ error: "Order not found" });
    if (purchase.status === "paid") return res.json({ success: true, alreadyProcessed: true });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expectedSignature !== razorpay_signature) {
      await pool.query("UPDATE employee_addon_purchases SET status='failed' WHERE id=$1", [purchase.id]);
      return res.status(400).json({ error: "Payment verification failed" });
    }

    await pool.query(
      "UPDATE employee_addon_purchases SET status='paid', razorpay_payment_id=$1, paid_at=NOW() WHERE id=$2",
      [razorpay_payment_id, purchase.id],
    );

    // Base seat count is the plan's own default the first time this runs;
    // after that, every paid bundle stacks on top of whatever the tenant's
    // effective limit already was (including any Super Admin-granted seats).
    const subRes = await pool.query(
      `SELECT s.id, s.employee_limit_override, p.max_employees
       FROM subscriptions s JOIN plans p ON p.id=s.plan_id
       WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1`,
      [req.userId],
    );
    const sub = subRes.rows[0];
    if (!sub) return res.status(400).json({ error: "No active subscription to add seats to" });

    const currentLimit = sub.employee_limit_override ?? sub.max_employees ?? 0;
    const newLimit = currentLimit === -1 ? -1 : currentLimit + purchase.seats_added;
    await pool.query("UPDATE subscriptions SET employee_limit_override=$1 WHERE id=$2", [newLimit, sub.id]);

    const userRow = await pool.query("SELECT name, email FROM users WHERE id=$1", [req.userId]);
    const u = userRow.rows[0];
    if (u) mailer.sendAddonPurchased(u.email, u.name, purchase.seats_added, newLimit, purchase.amount);

    res.json({ success: true, seats_added: purchase.seats_added, new_limit: newLimit });
  } catch (e) {
    console.error("Razorpay addon verify failed:", e.message);
    res.status(500).json({ error: "Could not verify payment" });
  }
});

// ── POST start a recurring subscription (Razorpay Subscriptions API) ──
// Creates (or reuses) a Razorpay Customer + Plan + Subscription and hands
// the frontend what it needs to open Checkout in subscription mode. Doesn't
// touch this tenant's plan_id/status yet — that only happens once a charge
// actually succeeds (webhook, or the polling fallback below), same
// "never grant before payment confirms" rule the old /verify endpoint
// already followed.
router.post("/subscribe", auth, requireOwner, async (req, res) => {
  const razorpay = getRazorpay();
  if (!razorpay) return res.status(503).json({ error: "Online payment isn't set up yet — contact support." });
  const { plan_id, billing_cycle } = req.body;
  if (!plan_id) return res.status(400).json({ error: "plan_id required" });
  try {
    const planRes = await pool.query("SELECT * FROM plans WHERE id=$1 AND is_active=true", [plan_id]);
    const plan = planRes.rows[0];
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const cycle = billing_cycle === "yearly" ? "yearly" : "monthly";
    const amount = parseFloat(cycle === "yearly" ? plan.price_yearly : plan.price_monthly);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "This plan has no payable price — use the free trial instead." });
    }

    const currentSubRes = await pool.query(
      "SELECT * FROM subscriptions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [req.userId],
    );
    const currentSub = currentSubRes.rows[0];

    const userRes = await pool.query("SELECT id, name, email FROM users WHERE id=$1", [req.userId]);
    const userRow = userRes.rows[0];

    const razorpayPlanId = await getOrCreateRazorpayPlan(plan, cycle);
    const customerId = await getOrCreateRazorpayCustomer(userRow, currentSub);

    // Still mid-trial? Don't charge today — the mandate is authorized now,
    // but the first actual charge is scheduled for exactly when the trial
    // promise says it ends, not a day earlier.
    const stillTrialing =
      currentSub?.status === "trialing" && currentSub.trial_ends_at && new Date(currentSub.trial_ends_at) > new Date();
    const startAt = stillTrialing ? Math.floor(new Date(currentSub.trial_ends_at).getTime() / 1000) : undefined;

    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_id: customerId,
      customer_notify: 1,
      quantity: 1,
      total_count: 120, // Razorpay requires a bound — 120 cycles (10yr monthly / 120yr yearly) is effectively "until cancelled"
      ...(startAt ? { start_at: startAt } : {}),
      notes: { user_id: String(req.userId), plan_id: String(plan_id), billing_cycle: cycle },
    });

    // Stamp the ids onto the current row now so the webhook/poll fallback
    // can find it immediately — status/plan_id are left untouched until a
    // charge actually succeeds.
    if (currentSub) {
      await pool.query(
        "UPDATE subscriptions SET razorpay_customer_id=$1, razorpay_subscription_id=$2 WHERE id=$3",
        [customerId, subscription.id, currentSub.id],
      );
    }

    res.json({
      razorpay_subscription_id: subscription.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan_name: plan.name,
      billing_cycle: cycle,
      starts_after_trial: !!startAt,
    });
  } catch (e) {
    console.error("Razorpay subscribe failed:", e.message);
    res.status(500).json({ error: "Could not start subscription. Please try again." });
  }
});

// ── GET poll for a subscription's activation status after Checkout ────
// The frontend polls this every few seconds right after Checkout closes.
// If the webhook hasn't landed yet, this does a live reconciliation call
// to Razorpay directly instead of just waiting — so a delayed or dropped
// webhook never leaves a tenant stuck on "processing" despite having paid.
router.get("/subscription-status", auth, requireOwner, async (req, res) => {
  const razorpaySubId = req.query.razorpay_subscription_id;
  if (!razorpaySubId) return res.status(400).json({ error: "razorpay_subscription_id required" });
  try {
    const { rows } = await pool.query(
      "SELECT * FROM subscriptions WHERE razorpay_subscription_id=$1 AND user_id=$2",
      [razorpaySubId, req.userId],
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "Subscription not found" });

    if (row.status === "active") {
      return res.json({ status: "active", ends_at: row.ends_at });
    }

    // Not active locally yet — ask Razorpay directly rather than only
    // trusting the webhook.
    const razorpay = getRazorpay();
    if (!razorpay) return res.json({ status: row.status });
    const live = await razorpay.subscriptions.fetch(razorpaySubId);
    if (live.status === "active" || live.status === "authenticated") {
      const endsAt = await activateFromCharge(row, {
        razorpaySubId,
        billingCycle: live.notes?.billing_cycle,
        planId: live.notes?.plan_id ? parseInt(live.notes.plan_id) : null,
      });
      return res.json({ status: "active", ends_at: endsAt });
    }

    res.json({ status: "pending", razorpay_status: live.status });
  } catch (e) {
    console.error("Razorpay subscription-status failed:", e.message);
    res.status(500).json({ error: "Could not check subscription status" });
  }
});

// ── POST cancel the recurring subscription ──────────────────────────
// Cancels the mandate on Razorpay's side too (cancel_at_cycle_end) — not
// just a local status flip, which would leave the tenant on the hook for a
// charge Razorpay still thinks is scheduled. Access continues until
// ends_at either way; the webhook (subscription.cancelled) flips status
// once the period actually ends.
router.post("/cancel", auth, requireOwner, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM subscriptions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [req.userId],
    );
    const row = rows[0];
    if (!row?.razorpay_subscription_id) {
      return res.status(400).json({ error: "No recurring subscription to cancel" });
    }
    const razorpay = getRazorpay();
    if (razorpay) {
      await razorpay.subscriptions.cancel(row.razorpay_subscription_id, { cancel_at_cycle_end: 1 }).catch((e) => {
        console.error("Razorpay cancel failed:", e.message);
      });
    }
    await pool.query("UPDATE subscriptions SET cancel_at_period_end=true WHERE id=$1", [row.id]);
    res.json({ success: true, ends_at: row.ends_at });
  } catch (e) {
    console.error("Cancel subscription failed:", e.message);
    res.status(500).json({ error: "Could not cancel subscription" });
  }
});

module.exports = router;
