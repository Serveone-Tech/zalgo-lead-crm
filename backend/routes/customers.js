const express = require("express");
const { pool } = require("../db");
const { auth, requirePermission, requireSubscription, requirePlanFeature } = require("../middleware/auth");
const { fireTrigger } = require("../utils/automation-trigger");

const router = express.Router();

// GET all customers
router.get("/", auth, requireSubscription, requirePlanFeature("customers"), requirePermission("view_customers"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        COALESCE(SUM(CASE WHEN p.status='Paid' THEN p.amount ELSE 0 END),0) AS total_collected,
        COALESCE(SUM(CASE WHEN p.status='Due' THEN p.amount ELSE 0 END),0) AS total_due_amount,
        (SELECT MIN(p2.due_date) FROM customer_payments p2 WHERE p2.customer_id=c.id AND p2.status='Due') AS next_due_date
       FROM customers c LEFT JOIN customer_payments p ON p.customer_id=c.id
       WHERE c.user_id=$1 GROUP BY c.id ORDER BY c.created_at DESC`,
      [req.tenantId],
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET due/upcoming — BEFORE /:id
router.get("/due/upcoming", auth, requireSubscription, requirePlanFeature("customers"), requirePermission("view_customers"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cp.*, c.name AS customer_name, c.phone, c.email
       FROM customer_payments cp JOIN customers c ON c.id=cp.customer_id
       WHERE c.user_id=$1 AND cp.status='Due'
       ORDER BY cp.due_date ASC NULLS LAST LIMIT 30`,
      [req.tenantId],
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET single customer
router.get("/:id", auth, requireSubscription, requirePlanFeature("customers"), requirePermission("view_customers"), async (req, res) => {
  try {
    const [cust, payments] = await Promise.all([
      pool.query("SELECT * FROM customers WHERE id=$1 AND user_id=$2", [
        req.params.id,
        req.tenantId,
      ]),
      pool.query(
        "SELECT * FROM customer_payments WHERE customer_id=$1 ORDER BY payment_date DESC",
        [req.params.id],
      ),
    ]);
    if (!cust.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json({ ...cust.rows[0], payments: payments.rows });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST create customer
router.post("/", auth, requireSubscription, requirePlanFeature("customers"), requirePermission("manage_customers"), async (req, res) => {
  const { name, phone, email, platform, platform_link, total_fee, notes } =
    req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  try {
    // Enforce max_customers plan limit (-1 = unlimited)
    const maxCust = req.subscription?.max_customers ?? -1;
    if (maxCust > 0) {
      const count = await pool.query("SELECT COUNT(*) FROM customers WHERE user_id=$1", [req.tenantId]);
      if (parseInt(count.rows[0].count) >= maxCust) {
        return res.status(403).json({
          error: "CUSTOMER_LIMIT_REACHED",
          message: `Your plan allows a maximum of ${maxCust} customers. Please upgrade to add more.`,
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO customers (user_id, name, phone, email, platform, platform_link, total_fee, amount_paid, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8) RETURNING *`,
      [
        req.tenantId,
        name,
        phone || "",
        email || "",
        platform || "",
        platform_link || "",
        parseFloat(total_fee) || 0,
        notes || "",
      ],
    );
    const customer = result.rows[0];

    // ✅ Fire lead_converted trigger
    fireTrigger("lead_converted", req.tenantId, {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      amount: customer.total_fee,
    }).catch(() => {});

    res.json(customer);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update customer
router.put("/:id", auth, requirePermission("manage_customers"), async (req, res) => {
  const {
    name,
    phone,
    email,
    platform,
    platform_link,
    total_fee,
    notes,
    status,
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customers SET name=$1,phone=$2,email=$3,platform=$4,platform_link=$5,
       total_fee=$6,notes=$7,status=$8,updated_at=NOW()
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [
        name,
        phone || "",
        email || "",
        platform || "",
        platform_link || "",
        parseFloat(total_fee) || 0,
        notes || "",
        status || "Active",
        req.params.id,
        req.tenantId,
      ],
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE customer
router.delete("/:id", auth, requirePermission("manage_customers"), async (req, res) => {
  try {
    await pool.query("DELETE FROM customers WHERE id=$1 AND user_id=$2", [
      req.params.id,
      req.tenantId,
    ]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST add payment
router.post("/:id/payments", auth, requirePermission("manage_customers"), async (req, res) => {
  const { amount, payment_date, due_date, payment_mode, status, notes } =
    req.body;
  if (!amount || !payment_date)
    return res.status(400).json({ error: "Amount and date required" });
  try {
    const result = await pool.query(
      `INSERT INTO customer_payments (customer_id,user_id,amount,payment_date,due_date,payment_mode,status,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        req.params.id,
        req.tenantId,
        parseFloat(amount),
        payment_date,
        due_date || null,
        payment_mode || "Cash",
        status || "Paid",
        notes || "",
      ],
    );
    await pool.query(
      `UPDATE customers SET amount_paid=(SELECT COALESCE(SUM(amount),0) FROM customer_payments WHERE customer_id=$1 AND status='Paid'),updated_at=NOW() WHERE id=$1`,
      [req.params.id],
    );

    // ✅ Fire fee_due trigger if status=Due
    if (status === "Due") {
      const cust = await pool.query("SELECT * FROM customers WHERE id=$1", [
        req.params.id,
      ]);
      if (cust.rows[0]) {
        fireTrigger("fee_due", req.tenantId, {
          name: cust.rows[0].name,
          phone: cust.rows[0].phone,
          email: cust.rows[0].email,
          amount: amount,
          due_date: due_date || payment_date,
        }).catch(() => {});
      }
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update payment
router.put("/:id/payments/:pid", auth, requirePermission("manage_customers"), async (req, res) => {
  const { status, payment_date, amount, payment_mode, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customer_payments SET status=$1,payment_date=$2,amount=$3,payment_mode=$4,notes=$5 WHERE id=$6 AND customer_id=$7 RETURNING *`,
      [
        status || "Paid",
        payment_date,
        parseFloat(amount),
        payment_mode || "Cash",
        notes || "",
        req.params.pid,
        req.params.id,
      ],
    );
    await pool.query(
      `UPDATE customers SET amount_paid=(SELECT COALESCE(SUM(amount),0) FROM customer_payments WHERE customer_id=$1 AND status='Paid'),updated_at=NOW() WHERE id=$1`,
      [req.params.id],
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE payment
router.delete("/:id/payments/:pid", auth, requirePermission("manage_customers"), async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM customer_payments WHERE id=$1 AND customer_id=$2",
      [req.params.pid, req.params.id],
    );
    await pool.query(
      `UPDATE customers SET amount_paid=(SELECT COALESCE(SUM(amount),0) FROM customer_payments WHERE customer_id=$1 AND status='Paid'),updated_at=NOW() WHERE id=$1`,
      [req.params.id],
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
