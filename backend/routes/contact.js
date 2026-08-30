const express = require("express");
const { pool } = require("../db");
const mailer = require("../utils/mailer");

const router = express.Router();

// POST /api/contact — public, no auth. The marketing site's Contact page
// (and the "Custom" pricing card's CTA) submit here.
router.post("/", async (req, res) => {
  const { name, email, phone, company, message, source } = req.body || {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Name, email, and message are required" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO contact_requests (name, email, phone, company, message, source)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name.trim(), email.trim(), phone?.trim() || "", company?.trim() || "", message.trim(), source || ""],
    );
    // Never let an email hiccup fail the submission — mailer.send() already
    // swallows its own errors and logs them, so the request just resolves.
    await mailer.sendContactNotification(result.rows[0]);
    res.json({ success: true });
  } catch (e) {
    console.error("Contact form error:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
