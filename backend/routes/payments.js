const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { pool } = require("../db");
const { auth } = require("../middleware/auth");
const mailer = require("../utils/mailer");

const router = express.Router();

// Built lazily, not at module load — the Razorpay SDK throws immediately if
// key_id is missing, and this file is require()'d unconditionally from
// server.js, so constructing it eagerly here would crash the *entire*
// backend (every route, every tenant) on any deploy where the env vars
// haven't been set yet, not just fail the payment routes.
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

    await pool.query("UPDATE subscriptions SET status='cancelled' WHERE user_id=$1", [req.userId]);
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

module.exports = router;
