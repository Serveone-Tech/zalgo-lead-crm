const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { auth, requirePermission, requireSubscription, requirePlanFeature } = require("../middleware/auth");
const { PERMISSION_KEYS, hasPermission, isOwner } = require("../utils/permissions");
const { getEffectiveEmployeeLimit } = require("../utils/seat-limit");

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

// GET one page of this tenant's sub-accounts — also returns total row count
// and activeCount (not blocked) so the Team page's seat-usage summary stays
// accurate even though the table itself only holds one page at a time.
router.get("/", auth, requireSubscription, requirePlanFeature("employees"), requirePermission("manage_employees"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 25));
    const search = (req.query.search || "").trim();
    const params = [req.tenantId];
    let where = "parent_id=$1";
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    params.push(pageSize, (page - 1) * pageSize);
    const result = await pool.query(
      `SELECT id, name, email, role_label, permissions, is_blocked, created_at, COUNT(*) OVER() AS total_count
       FROM users WHERE ${where} ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    const total = result.rows[0]?.total_count ? parseInt(result.rows[0].total_count) : 0;
    const rows = result.rows.map(({ total_count, ...rest }) => rest);
    const active = await pool.query(
      "SELECT COUNT(*) FROM users WHERE parent_id=$1 AND is_blocked=false",
      [req.tenantId],
    );
    res.json({ rows, total, active_count: parseInt(active.rows[0].count) });
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
    // Effective limit = plan's own base + any active purchased add-on
    // bundles + a Super Admin's manual grant, live-computed so an expired
    // bundle naturally stops counting (see utils/seat-limit.js). Only
    // ACTIVE (not deactivated) employees count against it — deactivating
    // someone frees their seat without touching their account or data,
    // same idea as unassigning a desk instead of firing them.
    const { limit } = await getEffectiveEmployeeLimit(req.tenantId);
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
    const nextRoleLabel = role_label || "";
    const nextPermissions = sanitizePermissions(permissions);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, onboarded, parent_id, role_label, permissions)
       VALUES ($1,$2,$3,'employee',true,$4,$5,$6)
       RETURNING id, name, email, role_label, permissions, created_at`,
      [name, email, hashed, req.tenantId, nextRoleLabel, nextPermissions],
    );
    await pool.query(
      `INSERT INTO employee_permission_audit
       (user_id, changed_by, employee_id, old_role_label, new_role_label, old_permissions, new_permissions)
       VALUES ($1,$2,$3,NULL,$4,NULL,$5)`,
      [req.tenantId, req.user.id, result.rows[0].id, nextRoleLabel, nextPermissions],
    ).catch((e) => console.error("employee_permission_audit insert failed:", e.message));
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
      "SELECT id, role_label, permissions FROM users WHERE id=$1 AND parent_id=$2",
      [req.params.id, req.tenantId],
    );
    const before = owned.rows[0];
    if (!before)
      return res.status(404).json({ error: "Employee not found" });

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password=$1 WHERE id=$2", [
        hashed,
        req.params.id,
      ]);
    }

    const nextRoleLabel = role_label || "";
    const nextPermissions = sanitizePermissions(permissions);
    const result = await pool.query(
      `UPDATE users SET name=$1, role_label=$2, permissions=$3
       WHERE id=$4 AND parent_id=$5
       RETURNING id, name, email, role_label, permissions, created_at`,
      [name, nextRoleLabel, nextPermissions, req.params.id, req.tenantId],
    );

    // Only log when something about the role/permissions actually changed
    // — not every save (e.g. a password reset with identical role fields
    // shouldn't add a no-op audit row).
    const roleChanged = before.role_label !== nextRoleLabel;
    const permsChanged = JSON.stringify(before.permissions || {}) !== JSON.stringify(nextPermissions);
    if (roleChanged || permsChanged) {
      await pool.query(
        `INSERT INTO employee_permission_audit
         (user_id, changed_by, employee_id, old_role_label, new_role_label, old_permissions, new_permissions)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [req.tenantId, req.user.id, req.params.id, before.role_label, nextRoleLabel, before.permissions, nextPermissions],
      ).catch((e) => console.error("employee_permission_audit insert failed:", e.message));
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET the permission-change history for one employee — owner only, same
// as every other owner-level reporting view.
router.get("/:id/permission-history", auth, requireSubscription, requirePlanFeature("employees"), async (req, res) => {
  if (!isOwner(req)) return res.status(403).json({ error: "Permission denied" });
  try {
    const result = await pool.query(
      `SELECT a.id, a.old_role_label, a.new_role_label, a.old_permissions, a.new_permissions, a.created_at,
              u.name AS changed_by_name
       FROM employee_permission_audit a
       LEFT JOIN users u ON u.id = a.changed_by
       WHERE a.user_id=$1 AND a.employee_id=$2
       ORDER BY a.created_at DESC`,
      [req.tenantId, req.params.id],
    );
    res.json(result.rows);
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
      const { limit } = await getEffectiveEmployeeLimit(req.tenantId);
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
