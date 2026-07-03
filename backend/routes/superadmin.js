const express = require('express');
const { pool } = require('../db');
const { superadminAuth } = require('../middleware/auth');
const mailer = require('../utils/mailer');

const router = express.Router();

// ── GET all users with subscription info
router.get('/users', superadminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.name, u.email, u.role, u.onboarded, u.created_at,
        o.name as org_name, o.phone as org_phone, o.logo_url,
        s.id as sub_id, s.status as sub_status, s.billing_cycle,
        s.starts_at, s.ends_at, s.trial_ends_at, s.amount_paid,
        p.id as plan_id, p.name as plan_name, p.price_monthly,
        (SELECT COUNT(*) FROM leads l WHERE l.user_id=u.id) as lead_count,
        (SELECT COUNT(*) FROM customers c WHERE c.user_id=u.id) as customer_count
      FROM users u
      LEFT JOIN organisations o ON o.user_id=u.id
      LEFT JOIN LATERAL (
        SELECT * FROM subscriptions WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1
      ) s ON true
      LEFT JOIN plans p ON p.id=s.plan_id
      WHERE u.role != 'superadmin'
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ── GET dashboard stats
router.get('/stats', superadminAuth, async (req, res) => {
  try {
    const [total, active, trial, expired, cancelled, revenue] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role!='superadmin'"),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status='active'"),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status='trial'"),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status='expired'"),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status='cancelled'"),
      pool.query("SELECT COALESCE(SUM(amount_paid),0) as total FROM subscriptions WHERE status='active'"),
    ]);
    res.json({
      total_users: parseInt(total.rows[0].count),
      active: parseInt(active.rows[0].count),
      trial: parseInt(trial.rows[0].count),
      expired: parseInt(expired.rows[0].count),
      cancelled: parseInt(cancelled.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].total),
    });
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

      await pool.query("UPDATE subscriptions SET status='cancelled' WHERE user_id=$1", [userId]);
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, starts_at, ends_at, notes, created_by)
         VALUES ($1,$2,'active',$3,$4,$5,$6,$7)`,
        [userId, plan_id, billing_cycle||'monthly', now, ends_at, notes||'', req.userId]
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
      await pool.query("UPDATE subscriptions SET status='cancelled' WHERE user_id=$1", [userId]);
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, starts_at, trial_ends_at, notes, created_by)
         VALUES ($1,$2,'trial','trial',$3,$4,$5,$6)`,
        [userId, plan.rows[0]?.id || 1, now, trial_ends_at, notes||'Trial extended by admin', req.userId]
      );
      if (u) mailer.sendTrialStarted(u.email, u.name, plan.rows[0]?.name || 'Trial', trial_ends_at);
    }

    res.json({ success: true });
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
