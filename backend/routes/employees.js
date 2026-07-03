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

// GET lightweight id+name list — usable by anyone who can assign leads
router.get("/list", auth, requireSubscription, requirePlanFeature("employees"), async (req, res) => {
  if (!isOwner(req) && !hasPermission(req, "manage_employees") && !hasPermission(req, "assign_leads")) {
    return res.status(403).json({ error: "Permission denied" });
  }
  try {
    const result = await pool.query(
      `SELECT id, name, role_label FROM users WHERE parent_id=$1 ORDER BY name ASC`,
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
      `SELECT id, name, email, role_label, permissions, created_at
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
