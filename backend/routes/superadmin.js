const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { superadminAuth } = require('../middleware/auth');
const { PERMISSION_KEYS } = require('../utils/permissions');
const mailer = require('../utils/mailer');

const router = express.Router();

const sanitizePermissions = (input = {}) => {
  const clean = {};
  for (const key of PERMISSION_KEYS) clean[key] = input[key] === true;
  return clean;
};

// Confirms :id is an owner (not an employee/superadmin) and returns their
// row — every employee route below is scoped through this so Super Admin
// can only reach an employee via their actual parent, never by guessing ids.
async function requireOwner(id) {
  const { rows } = await pool.query("SELECT id FROM users WHERE id=$1 AND role='user' AND parent_id IS NULL", [id]);
  return rows[0] || null;
}

// ── GET all users with subscription info
router.get('/users', superadminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.name, u.email, u.role, u.onboarded, u.created_at,
        o.name as org_name, o.phone as org_phone, o.logo_url,
        s.id as sub_id, s.status as sub_status, s.billing_cycle,
        s.starts_at, s.ends_at, s.trial_ends_at, s.amount_paid,
        s.employee_limit_override,
        p.id as plan_id, p.name as plan_name, p.price_monthly, p.max_employees,
        (SELECT COUNT(*) FROM leads l WHERE l.user_id=u.id) as lead_count,
        (SELECT COUNT(*) FROM customers c WHERE c.user_id=u.id) as customer_count,
        (SELECT COUNT(*) FROM users e WHERE e.parent_id=u.id) as employee_count
      FROM users u
      LEFT JOIN organisations o ON o.user_id=u.id
      LEFT JOIN LATERAL (
        SELECT * FROM subscriptions WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1
      ) s ON true
      LEFT JOIN plans p ON p.id=s.plan_id
      WHERE u.role='user' AND u.parent_id IS NULL
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ── GET one owner's employees — powers the nested view on the dashboard
// (mixing owners and their sub-accounts into one flat list was confusing).
router.get('/users/:id/employees', superadminAuth, async (req, res) => {
  try {
    const owner = await requireOwner(req.params.id);
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    const result = await pool.query(
      `SELECT id, name, email, role_label, permissions, is_blocked, created_at
       FROM users WHERE parent_id=$1 ORDER BY created_at DESC`,
      [req.params.id],
    );
    res.json(result.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ── POST add an employee under this owner — same shape as the tenant's own
// Team page, just triggered by Super Admin on their behalf.
router.post('/users/:id/employees', superadminAuth, async (req, res) => {
  const { name, email, password, role_label, permissions } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });
  try {
    const owner = await requireOwner(req.params.id);
    if (!owner) return res.status(404).json({ error: 'Owner not found' });

    // Same seat-limit rule the tenant themselves is held to — Super Admin
    // sees the same error and can raise the limit from this same screen.
    const subRes = await pool.query(
      `SELECT s.employee_limit_override, p.max_employees FROM subscriptions s JOIN plans p ON p.id=s.plan_id
       WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1`,
      [req.params.id],
    );
    const limit = subRes.rows[0]?.employee_limit_override ?? subRes.rows[0]?.max_employees;
    if (limit != null && limit !== -1) {
      const { rows } = await pool.query('SELECT COUNT(*) FROM users WHERE parent_id=$1', [req.params.id]);
      if (parseInt(rows[0].count) >= limit) {
        return res.status(403).json({ error: `Employee limit reached (${limit}). Raise the seat limit first.` });
      }
    }

    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, onboarded, parent_id, role_label, permissions)
       VALUES ($1,$2,$3,'employee',true,$4,$5,$6)
       RETURNING id, name, email, role_label, permissions, is_blocked, created_at`,
      [name, email, hashed, req.params.id, role_label || '', sanitizePermissions(permissions)],
    );
    res.json(result.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ── PUT edit an employee (name/role/permissions, optional password reset)
router.put('/users/:id/employees/:empId', superadminAuth, async (req, res) => {
  const { name, role_label, permissions, password } = req.body;
  try {
    const owned = await pool.query('SELECT id FROM users WHERE id=$1 AND parent_id=$2', [req.params.empId, req.params.id]);
    if (!owned.rows[0]) return res.status(404).json({ error: 'Employee not found' });

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hashed, req.params.empId]);
    }

    const result = await pool.query(
      `UPDATE users SET name=$1, role_label=$2, permissions=$3
       WHERE id=$4 AND parent_id=$5
       RETURNING id, name, email, role_label, permissions, is_blocked, created_at`,
      [name, role_label || '', sanitizePermissions(permissions), req.params.empId, req.params.id],
    );
    res.json(result.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ── PUT block/unblock an employee — they simply can't log in or use an
// existing token while blocked; nothing else about their account changes.
router.put('/users/:id/employees/:empId/block', superadminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET is_blocked=$1 WHERE id=$2 AND parent_id=$3
       RETURNING id, name, email, role_label, permissions, is_blocked, created_at`,
      [!!req.body.blocked, req.params.empId, req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ── DELETE an employee — unassign their leads first, same as the tenant's
// own Team page does.
router.delete('/users/:id/employees/:empId', superadminAuth, async (req, res) => {
  try {
    const owned = await pool.query('SELECT id FROM users WHERE id=$1 AND parent_id=$2', [req.params.empId, req.params.id]);
    if (!owned.rows[0]) return res.status(404).json({ error: 'Employee not found' });

    await pool.query('UPDATE leads SET assigned_to=NULL WHERE assigned_to=$1', [req.params.empId]);
    await pool.query('DELETE FROM users WHERE id=$1 AND parent_id=$2', [req.params.empId, req.params.id]);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ── GET dashboard stats
router.get('/stats', superadminAuth, async (req, res) => {
  try {
    const [total, active, trial, expired, cancelled, revenue, newContacts] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role!='superadmin'"),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status='active'"),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status='trial'"),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status='expired'"),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status='cancelled'"),
      pool.query("SELECT COALESCE(SUM(amount_paid),0) as total FROM subscriptions WHERE status='active'"),
      pool.query("SELECT COUNT(*) FROM contact_requests WHERE status='new'"),
    ]);
    res.json({
      total_users: parseInt(total.rows[0].count),
      active: parseInt(active.rows[0].count),
      trial: parseInt(trial.rows[0].count),
      expired: parseInt(expired.rows[0].count),
      cancelled: parseInt(cancelled.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].total),
      newContactRequests: parseInt(newContacts.rows[0].count),
    });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── GET contact form submissions (marketing site inbox)
router.get('/contact-requests', superadminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── PUT update a contact request's status
router.put('/contact-requests/:id', superadminAuth, async (req, res) => {
  const { status } = req.body;
  if (!['new', 'contacted', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const result = await pool.query(
      'UPDATE contact_requests SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── GET all plans
router.get('/plans', superadminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plans ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── POST create plan
router.post('/plans', superadminAuth, async (req, res) => {
  const { name, description, price_monthly, price_yearly, trial_days, is_free, max_leads, max_customers, features, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Plan name required' });
  try {
    const result = await pool.query(
      `INSERT INTO plans (name, description, price_monthly, price_yearly, trial_days, is_free, max_leads, max_customers, features, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true) RETURNING *`,
      [name, description||'', parseFloat(price_monthly)||0, parseFloat(price_yearly)||0,
       parseInt(trial_days)||0, !!is_free, parseInt(max_leads)||-1, parseInt(max_customers)||-1,
       JSON.stringify(features||[]), parseInt(sort_order)||0]
    );
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── PUT update plan
router.put('/plans/:id', superadminAuth, async (req, res) => {
  const { name, description, price_monthly, price_yearly, trial_days, is_free, max_leads, max_customers, features, is_active, sort_order } = req.body;
  try {
    const result = await pool.query(
      `UPDATE plans SET name=$1, description=$2, price_monthly=$3, price_yearly=$4,
       trial_days=$5, is_free=$6, max_leads=$7, max_customers=$8, features=$9, is_active=$10, sort_order=$11
       WHERE id=$12 RETURNING *`,
      [name, description||'', parseFloat(price_monthly)||0, parseFloat(price_yearly)||0,
       parseInt(trial_days)||0, !!is_free, parseInt(max_leads)||-1, parseInt(max_customers)||-1,
       JSON.stringify(features||[]), !!is_active, parseInt(sort_order)||0, req.params.id]
    );
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── DELETE plan
router.delete('/plans/:id', superadminAuth, async (req, res) => {
  try {
    // Check if any active subscriptions on this plan
    const active = await pool.query(
      "SELECT COUNT(*) FROM subscriptions WHERE plan_id=$1 AND status IN ('active','trial')",
      [req.params.id]
    );
    if (parseInt(active.rows[0].count) > 0) {
      return res.status(400).json({ error: `Cannot delete — ${active.rows[0].count} active subscriptions on this plan` });
    }
    await pool.query('DELETE FROM plans WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── POST update user subscription (upgrade/downgrade/cancel/extend)
router.post('/users/:id/subscription', superadminAuth, async (req, res) => {
  const { action, plan_id, billing_cycle, days, notes } = req.body;
  const userId = req.params.id;
  try {
    // Fetch user info for emails
    const userRow = await pool.query('SELECT name, email FROM users WHERE id=$1', [userId]);
    const u = userRow.rows[0];

    if (action === 'activate') {
      const plan = await pool.query('SELECT * FROM plans WHERE id=$1', [plan_id]);
      if (!plan.rows[0]) return res.status(404).json({ error: 'Plan not found' });
      const now = new Date();
      const d = parseInt(days) || (billing_cycle === 'yearly' ? 365 : 30);
      const ends_at = new Date(now.getTime() + d * 86400000);

      // Changing plans replaces the subscription row — carry over any
      // employee-limit override so switching plans doesn't silently reset
      // a seat increase the tenant already had.
      const prevOverride = await pool.query(
        'SELECT employee_limit_override FROM subscriptions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1', [userId]
      );
      await pool.query("UPDATE subscriptions SET status='cancelled' WHERE user_id=$1", [userId]);
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, starts_at, ends_at, notes, created_by, employee_limit_override)
         VALUES ($1,$2,'active',$3,$4,$5,$6,$7,$8)`,
        [userId, plan_id, billing_cycle||'monthly', now, ends_at, notes||'', req.userId, prevOverride.rows[0]?.employee_limit_override ?? null]
      );
      if (u) mailer.sendPlanActivated(u.email, u.name, plan.rows[0].name, billing_cycle||'monthly', ends_at);

    } else if (action === 'extend') {
      const sub = await pool.query(
        'SELECT s.*, p.name as plan_name FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1', [userId]
      );
      if (!sub.rows[0]) return res.status(404).json({ error: 'No subscription found' });
      const s = sub.rows[0];
      const extDays = parseInt(days) || 30;
      const base = s.ends_at ? new Date(s.ends_at) : new Date();
      const newEnd = new Date(base.getTime() + extDays * 86400000);
      await pool.query(
        "UPDATE subscriptions SET ends_at=$1, status='active', expiry_reminder_sent=false, expired_email_sent=false, notes=$2, updated_at=NOW() WHERE id=$3",
        [newEnd, notes||s.notes, s.id]
      );
      if (u) mailer.sendPlanExtended(u.email, u.name, s.plan_name, newEnd, extDays);

    } else if (action === 'cancel') {
      const sub = await pool.query(
        'SELECT s.*, p.name as plan_name FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1', [userId]
      );
      await pool.query(
        "UPDATE subscriptions SET status='cancelled', notes=$1, updated_at=NOW() WHERE user_id=$2",
        [notes||'Cancelled by admin', userId]
      );
      if (u && sub.rows[0]) mailer.sendPlanCancelled(u.email, u.name, sub.rows[0].plan_name);

    } else if (action === 'trial') {
      const plan = await pool.query('SELECT * FROM plans WHERE id=$1', [plan_id || 1]);
      const now = new Date();
      const trial_ends_at = new Date(now.getTime() + (parseInt(days)||14) * 86400000);
      const prevOverride = await pool.query(
        'SELECT employee_limit_override FROM subscriptions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1', [userId]
      );
      await pool.query("UPDATE subscriptions SET status='cancelled' WHERE user_id=$1", [userId]);
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, starts_at, trial_ends_at, notes, created_by, employee_limit_override)
         VALUES ($1,$2,'trial','trial',$3,$4,$5,$6,$7)`,
        [userId, plan.rows[0]?.id || 1, now, trial_ends_at, notes||'Trial extended by admin', req.userId, prevOverride.rows[0]?.employee_limit_override ?? null]
      );
      if (u) mailer.sendTrialStarted(u.email, u.name, plan.rows[0]?.name || 'Trial', trial_ends_at);
    }

    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ── PUT set a per-tenant employee-seat override — used when a tenant on
// Basic/Pro (10 seats) or Pro Max (15) asks for more than their plan allows.
// A null/empty limit clears the override back to the plan's own default.
router.put('/users/:id/employee-limit', superadminAuth, async (req, res) => {
  const { limit } = req.body;
  const userId = req.params.id;
  try {
    const value = limit === '' || limit === null || limit === undefined ? null : parseInt(limit);
    if (value !== null && (isNaN(value) || value < 0)) {
      return res.status(400).json({ error: 'Limit must be a non-negative number' });
    }
    const result = await pool.query(
      `UPDATE subscriptions SET employee_limit_override=$1, updated_at=NOW()
       WHERE id = (SELECT id FROM subscriptions WHERE user_id=$2 ORDER BY created_at DESC LIMIT 1)
       RETURNING id`,
      [value, userId],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'No subscription found' });
    res.json({ success: true, employee_limit_override: value });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ── DELETE user
router.delete('/users/:id', superadminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1 AND role!=\'superadmin\'', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
