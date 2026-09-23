const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { auth, requirePermission, requireSubscription, requirePlanFeature } = require("../middleware/auth");
const { PERMISSION_KEYS, hasPermission, isOwner } = require("../utils/permissions");

const router = express.Router();

const sanitizePermissions = (input = {}) => {
  const clean = {};
  for (const key of PERMISSION_KEYS) clean[key] = input[key] === true;
  return clean;
};

// GET lightweight id+name list — usable by anyone who can assign leads.
// Deactivated employees are left out: they must not be pickable for new
// work, even though their existing assignments/data stay untouched and
// keep showing their name wherever that data is already displayed.
router.get("/list", auth, requireSubscription, requirePlanFeature("employees"), async (req, res) => {
  if (!isOwner(req) && !hasPermission(req, "manage_employees") && !hasPermission(req, "assign_leads")) {
    return res.status(403).json({ error: "Permission denied" });
  }
  try {
    const result = await pool.query(
      `SELECT id, name, role_label FROM users WHERE parent_id=$1 AND is_blocked=false ORDER BY name ASC`,
      [req.tenantId],
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET all sub-accounts for this tenant
router.get("/", auth, requireSubscription, requirePlanFeature("employees"), requirePermission("manage_employees"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role_label, permissions, is_blocked, created_at
       FROM users WHERE parent_id=$1 ORDER BY created_at DESC`,
      [req.tenantId],
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST create employee
router.post("/", auth, requireSubscription, requirePlanFeature("employees"), requirePermission("manage_employees"), async (req, res) => {
  const { name, email, password, role_label, permissions } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email, password required" });
  try {
    // -1 on the plan means unlimited; an admin-set override on the
    // subscription (given when a tenant asks for more seats) always wins
    // over the plan's own default. Only ACTIVE (not deactivated) employees
    // count against the seat limit — deactivating someone frees their seat
    // without touching their account or data, same idea as unassigning a
    // desk instead of firing them.
    const limit = req.subscription.employee_limit_override ?? req.subscription.max_employees;
    if (limit !== -1 && limit !== null) {
      const { rows } = await pool.query("SELECT COUNT(*) FROM users WHERE parent_id=$1 AND is_blocked=false", [req.tenantId]);
      if (parseInt(rows[0].count) >= limit) {
        return res.status(403).json({
          error: `Employee limit reached (${limit} on your plan). Contact us to request more seats.`,
        });
      }
    }

    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, onboarded, parent_id, role_label, permissions)
       VALUES ($1,$2,$3,'employee',true,$4,$5,$6)
       RETURNING id, name, email, role_label, permissions, created_at`,
      [name, email, hashed, req.tenantId, role_label || "", sanitizePermissions(permissions)],
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update employee (role_label, permissions, optional password reset)
router.put("/:id", auth, requireSubscription, requirePlanFeature("employees"), requirePermission("manage_employees"), async (req, res) => {
  const { name, role_label, permissions, password } = req.body;
  try {
    const owned = await pool.query(
      "SELECT id FROM users WHERE id=$1 AND parent_id=$2",
      [req.params.id, req.tenantId],
    );
    if (owned.rows.length === 0)
      return res.status(404).json({ error: "Employee not found" });

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password=$1 WHERE id=$2", [
        hashed,
        req.params.id,
      ]);
    }

    const result = await pool.query(
      `UPDATE users SET name=$1, role_label=$2, permissions=$3
       WHERE id=$4 AND parent_id=$5
       RETURNING id, name, email, role_label, permissions, created_at`,
      [name, role_label || "", sanitizePermissions(permissions), req.params.id, req.tenantId],
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT activate/deactivate — a deactivated employee simply can't log in (or
// use an existing token — the `auth` middleware checks is_blocked on every
// request, not just at login) and stops counting against the plan's seat
// limit. Nothing else touches their account: their name/email/permissions,
// and everything they've done (leads, orders, notes), stay exactly as they
// are — unlike Remove, which unassigns their leads and deletes the account
// outright. Re-activating is subject to the same seat-limit check a brand
// new employee would face, since it's adding a seat back.
router.put("/:id/status", auth, requireSubscription, requirePlanFeature("employees"), requirePermission("manage_employees"), async (req, res) => {
  const active = !!req.body.active;
  try {
    const owned = await pool.query("SELECT id, is_blocked FROM users WHERE id=$1 AND parent_id=$2", [req.params.id, req.tenantId]);
    if (!owned.rows[0]) return res.status(404).json({ error: "Employee not found" });

    if (active && owned.rows[0].is_blocked) {
      const limit = req.subscription.employee_limit_override ?? req.subscription.max_employees;
      if (limit !== -1 && limit !== null) {
        const { rows } = await pool.query("SELECT COUNT(*) FROM users WHERE parent_id=$1 AND is_blocked=false", [req.tenantId]);
        if (parseInt(rows[0].count) >= limit) {
          return res.status(403).json({
            error: `Employee limit reached (${limit} on your plan). Deactivate another employee or contact us to request more seats.`,
          });
        }
      }
    }

    const result = await pool.query(
      `UPDATE users SET is_blocked=$1 WHERE id=$2 AND parent_id=$3
       RETURNING id, name, email, role_label, permissions, is_blocked, created_at`,
      [!active, req.params.id, req.tenantId],
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE employee — unassign their leads first
router.delete("/:id", auth, requireSubscription, requirePlanFeature("employees"), requirePermission("manage_employees"), async (req, res) => {
  try {
    const owned = await pool.query(
      "SELECT id FROM users WHERE id=$1 AND parent_id=$2",
      [req.params.id, req.tenantId],
    );
    if (owned.rows.length === 0)
      return res.status(404).json({ error: "Employee not found" });

    await pool.query("UPDATE leads SET assigned_to=NULL WHERE assigned_to=$1", [
      req.params.id,
    ]);
    await pool.query("DELETE FROM users WHERE id=$1 AND parent_id=$2", [
      req.params.id,
      req.tenantId,
    ]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
