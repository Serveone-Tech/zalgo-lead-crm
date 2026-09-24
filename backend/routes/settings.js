const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { auth, requirePermission, requireSubscription, requirePlanFeature } = require("../middleware/auth");

const router = express.Router();

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "QAR", symbol: "QR", name: "Qatari Riyal" },
];

router.get("/currencies", (req, res) => res.json(CURRENCIES));

router.get("/", auth, requireSubscription, requirePlanFeature("core"), async (req, res) => {
  try {
    let result = await pool.query(
      "SELECT * FROM user_settings WHERE user_id=$1",
      [req.tenantId],
    );
    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO user_settings (user_id, currency, currency_symbol, institute_name)
         VALUES ($1,'INR','₹','') RETURNING *`,
        [req.tenantId],
      );
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.put(
  "/",
  auth,
  requireSubscription,
  requirePlanFeature("core"),
  requirePermission("manage_settings"),
  async (req, res) => {
    const {
      currency,
      currency_symbol,
      institute_name,
      order_fulfillment_stage,
      low_stock_threshold,
      default_item_weight_kg,
      invoice_seq_start,
      invoice_seq_pattern,
    } = req.body;
    try {
      // Each Settings tab saves only the field(s) it owns — when a call
      // doesn't include one, keep whatever was already saved instead of
      // blanking/zeroing it out (this previously only applied to
      // order_fulfillment_stage/low_stock_threshold, silently resetting
      // currency/institute_name to defaults on every threshold-only save
      // from the Inventory page — now consistent across all fields).
      const stageParam =
        order_fulfillment_stage !== undefined ? order_fulfillment_stage : null;
      const thresholdParam =
        low_stock_threshold !== undefined && low_stock_threshold !== ""
          ? parseInt(low_stock_threshold)
          : null;
      const weightParam =
        default_item_weight_kg !== undefined && default_item_weight_kg !== ""
          ? parseFloat(default_item_weight_kg)
          : null;
      // Changing the starting number resets the running counter to match —
      // it's a "start numbering from here" control, same as the reference
      // tool this mirrors. invoice_seq_next itself is never settable
      // directly; it only moves forward as real invoices get numbered.
      const seqStartParam =
        invoice_seq_start !== undefined && invoice_seq_start !== ""
          ? parseInt(invoice_seq_start) || 0
          : null;
      const seqPatternParam =
        invoice_seq_pattern !== undefined && invoice_seq_pattern.trim() ? invoice_seq_pattern.trim() : null;
      const result = await pool.query(
        `INSERT INTO user_settings (user_id, currency, currency_symbol, institute_name, order_fulfillment_stage, low_stock_threshold, default_item_weight_kg, invoice_seq_start, invoice_seq_pattern, invoice_seq_next, updated_at)
       VALUES ($1,COALESCE($2,'INR'),COALESCE($3,'₹'),COALESCE($4,''),COALESCE($5,''),COALESCE($6,10),COALESCE($7,0.5),COALESCE($8,0),COALESCE($9,'INV-{seq}'),COALESCE($8,0),NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         currency=COALESCE($2, user_settings.currency),
         currency_symbol=COALESCE($3, user_settings.currency_symbol),
         institute_name=COALESCE($4, user_settings.institute_name),
         order_fulfillment_stage=COALESCE($5, user_settings.order_fulfillment_stage),
         low_stock_threshold=COALESCE($6, user_settings.low_stock_threshold),
         default_item_weight_kg=COALESCE($7, user_settings.default_item_weight_kg),
         invoice_seq_start=COALESCE($8, user_settings.invoice_seq_start),
         invoice_seq_pattern=COALESCE($9, user_settings.invoice_seq_pattern),
         invoice_seq_next=COALESCE($8, user_settings.invoice_seq_next),
         updated_at=NOW()
       RETURNING *`,
        [
          req.tenantId,
          currency || null,
          currency_symbol || null,
          institute_name !== undefined ? institute_name : null,
          stageParam,
          thresholdParam,
          weightParam,
          seqStartParam,
          seqPatternParam,
        ],
      );
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  },
);

router.post("/change-password", auth, async (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password)
    return res.status(400).json({ error: "Both fields are required" });
  if (new_password.length < 6)
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters" });
  try {
    const result = await pool.query("SELECT password FROM users WHERE id=$1", [
      req.userId,
    ]);
    if (!result.rows[0])
      return res.status(404).json({ error: "User not found" });
    const valid = await bcrypt.compare(old_password, result.rows[0].password);
    if (!valid)
      return res.status(401).json({ error: "Current password is incorrect" });
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [
      hashed,
      req.userId,
    ]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
