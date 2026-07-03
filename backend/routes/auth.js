const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { auth } = require("../middleware/auth");
const mailer = require("../utils/mailer");

const router = express.Router();

const makeToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

// ── REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, onboarded)
       VALUES ($1, $2, $3, 'user', false) RETURNING id, name, email, role, onboarded`,
      [name, email, hashed],
    );
    const user = result.rows[0];
    const token = makeToken(user);
    res.json({ token, user, redirect: "/onboarding" });
  } catch (err) {
    if (err.code === "23505")
      return res.status(400).json({ error: "Email already registered" });
    res.status(500).json({ error: "Server error" });
  }
});

// ── LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = makeToken(user);
    let redirect = "/dashboard";
    const tenantId = user.parent_id || user.id;

    if (user.role === "superadmin") {
      redirect = "/superadmin";
    } else if (user.parent_id) {
      // Sub-accounts (employees/managers) skip onboarding/plan selection —
      // they ride on the owner's organisation + subscription.
      redirect = "/dashboard";
    } else if (!user.onboarded) {
      redirect = "/onboarding";
    } else {
      // Check subscription
      const sub = await pool.query(
        `SELECT s.*, p.name as plan_name FROM subscriptions s
         JOIN plans p ON p.id = s.plan_id
         WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT 1`,
        [tenantId],
      );

      if (sub.rows.length === 0) {
        redirect = "/plans";
      } else {
        const s = sub.rows[0];
        const now = new Date();

        // Trial expired?
        if (s.status === "trial" && s.trial_ends_at && new Date(s.trial_ends_at) < now) {
          redirect = "/plans";
          if (!s.expired_email_sent) {
            mailer.sendPlanExpired(user.email, user.name, s.plan_name, s.trial_ends_at);
            pool.query("UPDATE subscriptions SET expired_email_sent=true WHERE id=$1", [s.id]);
          }
        }
        // Explicitly cancelled?
        else if (s.status === "cancelled") {
          redirect = "/plans";
        }
        // Active subscription expired?
        else if (s.status === "active" && s.ends_at && new Date(s.ends_at) < now) {
          redirect = "/plans";
          if (!s.expired_email_sent) {
            mailer.sendPlanExpired(user.email, user.name, s.plan_name, s.ends_at);
            pool.query("UPDATE subscriptions SET expired_email_sent=true WHERE id=$1", [s.id]);
          }
        }
        // ✅ Active — check if expiry reminder needed (≤7 days left)
        else if (s.status === "active" && s.ends_at && !s.expiry_reminder_sent) {
          const daysLeft = Math.ceil((new Date(s.ends_at) - now) / 86400000);
          if (daysLeft <= 7) {
            mailer.sendExpiryReminder(user.email, user.name, s.plan_name, s.ends_at, daysLeft);
            pool.query("UPDATE subscriptions SET expiry_reminder_sent=true WHERE id=$1", [s.id]);
          }
          redirect = "/dashboard";
        }
        else {
          redirect = "/dashboard";
        }
      }
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboarded: user.onboarded,
        parent_id: user.parent_id,
        role_label: user.role_label,
        permissions: user.permissions,
      },
      redirect,
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, name, email, role, onboarded, parent_id, role_label, permissions FROM users WHERE id=$1",
      [req.userId],
    );
    if (!user.rows[0]) return res.status(404).json({ error: "User not found" });
    const sub = await pool.query(
      `SELECT s.*, p.name as plan_name, p.max_leads, p.max_customers, p.features
       FROM subscriptions s JOIN plans p ON p.id=s.plan_id
       WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1`,
      [req.tenantId],
    );
    const org = await pool.query(
      "SELECT * FROM organisations WHERE user_id=$1",
      [req.tenantId],
    );
    res.json({
      user: user.rows[0],
      subscription: sub.rows[0] || null,
      organisation: org.rows[0] || null,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── ONBOARDING
router.post("/onboarding", auth, async (req, res) => {
  const { name, email, phone, address, city, state, website, logo_url } =
    req.body;
  if (!name)
    return res.status(400).json({ error: "Organisation name required" });
  try {
    await pool.query(
      `INSERT INTO organisations (user_id, name, email, phone, address, city, state, website, logo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (user_id) DO UPDATE SET
         name=$2, email=$3, phone=$4, address=$5, city=$6, state=$7, website=$8, logo_url=$9, updated_at=NOW()`,
      [
        req.userId,
        name,
        email || "",
        phone || "",
        address || "",
        city || "",
        state || "",
        website || "",
        logo_url || "",
      ],
    );
    await pool.query("UPDATE users SET onboarded=true WHERE id=$1", [
      req.userId,
    ]);
    res.json({ success: true, redirect: "/plans" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── SUBSCRIBE
router.post("/subscribe", auth, async (req, res) => {
  const { plan_id, billing_cycle } = req.body;
  if (!plan_id) return res.status(400).json({ error: "plan_id required" });
  try {
    const plan = await pool.query("SELECT * FROM plans WHERE id=$1", [plan_id]);
    if (!plan.rows[0]) return res.status(404).json({ error: "Plan not found" });
    const p = plan.rows[0];
    const now = new Date();
    let ends_at = null,
      trial_ends_at = null,
      status = "active";

    if (p.is_free || p.trial_days > 0) {
      status = "trial";
      trial_ends_at = new Date(now.getTime() + p.trial_days * 86400000);
    } else {
      const days = billing_cycle === "yearly" ? 365 : 30;
      ends_at = new Date(now.getTime() + days * 86400000);
    }

    // Cancel old subscriptions
    await pool.query(
      "UPDATE subscriptions SET status='cancelled' WHERE user_id=$1",
      [req.userId],
    );

    // New subscription
    await pool.query(
      `INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, starts_at, ends_at, trial_ends_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        req.userId,
        plan_id,
        status,
        billing_cycle || "monthly",
        now,
        ends_at,
        trial_ends_at,
      ],
    );

    // Send confirmation email
    const userRow = await pool.query("SELECT name, email FROM users WHERE id=$1", [req.userId]);
    const u = userRow.rows[0];
    if (u) {
      if (status === "trial") {
        mailer.sendTrialStarted(u.email, u.name, p.name, trial_ends_at);
      } else {
        mailer.sendPlanActivated(u.email, u.name, p.name, billing_cycle || "monthly", ends_at);
      }
    }

    res.json({ success: true, redirect: "/dashboard" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET subscription status
router.get("/subscription", auth, async (req, res) => {
  try {
    const sub = await pool.query(
      `SELECT s.*, p.name as plan_name, p.max_leads, p.max_customers, p.features, p.is_free
       FROM subscriptions s JOIN plans p ON p.id=s.plan_id
       WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1`,
      [req.userId],
    );
    res.json(sub.rows[0] || null);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── FORGOT PASSWORD — Step 1: Send OTP
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  try {
    const result = await pool.query("SELECT id, name FROM users WHERE email=$1 AND parent_id IS NULL", [email]);
    if (!result.rows[0]) return res.status(404).json({ error: "No account found with this email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query("DELETE FROM password_otps WHERE email=$1", [email]);
    await pool.query(
      "INSERT INTO password_otps (email, otp, expires_at) VALUES ($1,$2,$3)",
      [email, otp, expiresAt]
    );

    await mailer.sendOtp(email, result.rows[0].name, otp);

    res.json({ success: true });
  } catch (e) {
    console.error("forgot-password error:", e);
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

// ── FORGOT PASSWORD — Step 2: Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });
  try {
    const result = await pool.query(
      "SELECT * FROM password_otps WHERE email=$1 AND otp=$2 AND used=false ORDER BY created_at DESC LIMIT 1",
      [email, otp]
    );
    const row = result.rows[0];
    if (!row) return res.status(400).json({ error: "Invalid OTP" });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: "OTP has expired. Please request a new one." });

    await pool.query("UPDATE password_otps SET used=true WHERE id=$1", [row.id]);

    // Short-lived reset token (15 min)
    const resetToken = jwt.sign({ email, purpose: "reset" }, process.env.JWT_SECRET, { expiresIn: "15m" });
    res.json({ reset_token: resetToken });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── FORGOT PASSWORD — Step 3: Reset Password
router.post("/reset-password", async (req, res) => {
  const { reset_token, new_password } = req.body;
  if (!reset_token || !new_password) return res.status(400).json({ error: "All fields required" });
  if (new_password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  try {
    let payload;
    try {
      payload = jwt.verify(reset_token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: "Reset link expired. Please start again." });
    }
    if (payload.purpose !== "reset") return res.status(400).json({ error: "Invalid token" });

    const hashed = await bcrypt.hash(new_password, 10);
    const result = await pool.query("UPDATE users SET password=$1 WHERE email=$2 RETURNING id", [hashed, payload.email]);
    if (result.rowCount === 0) return res.status(404).json({ error: "User not found" });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
