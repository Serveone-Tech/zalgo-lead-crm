const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { auth, requirePermission } = require("../middleware/auth");

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

router.get("/", auth, async (req, res) => {
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

router.put("/", auth, requirePermission("manage_settings"), async (req, res) => {
  const { currency, currency_symbol, institute_name } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO user_settings (user_id, currency, currency_symbol, institute_name, updated_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         currency=$2, currency_symbol=$3, institute_name=$4, updated_at=NOW()
       RETURNING *`,
      [
        req.tenantId,
        currency || "INR",
        currency_symbol || "₹",
        institute_name || "",
      ],
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/change-password", auth, async (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password)
    return res.status(400).json({ error: "Both fields are required" });
  if (new_password.length < 6)
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  try {
    const result = await pool.query("SELECT password FROM users WHERE id=$1", [req.userId]);
    if (!result.rows[0]) return res.status(404).json({ error: "User not found" });
    const valid = await bcrypt.compare(old_password, result.rows[0].password);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashed, req.userId]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
