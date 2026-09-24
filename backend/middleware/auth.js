const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// ── Basic auth — verify token and load tenant/permissions
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    // Left-joins the owner's own row (whether this request IS the owner, or
    // is one of their employees) so a Super Admin suspension on the owner
    // locks out the whole tenant without touching any employee's own
    // is_blocked flag — reactivating the owner restores everyone exactly
    // as they were.
    const result = await pool.query(
      `SELECT u.id, u.role, u.parent_id, u.permissions, u.role_label, u.is_blocked,
              COALESCE(owner.suspended_by_admin, u.suspended_by_admin, false) AS tenant_suspended
       FROM users u
       LEFT JOIN users owner ON owner.id = u.parent_id
       WHERE u.id=$1`,
      [decoded.userId]
    );
    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: 'Invalid token' });
    if (row.is_blocked) return res.status(403).json({ error: 'ACCOUNT_BLOCKED', message: 'This account has been blocked. Contact your admin.' });
    if (row.tenant_suspended) return res.status(403).json({ error: 'TENANT_SUSPENDED', message: 'This account has been suspended. Contact support.' });

    req.user = {
      id: row.id,
      role: row.role,
      parentId: row.parent_id,
      permissions: row.permissions || {},
      roleLabel: row.role_label || '',
    };
    req.tenantId = row.parent_id || row.id;

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Superadmin only
const superadminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Subscription check — must be active or in trial
// Must be used after auth middleware (uses req.tenantId and req.userRole)
const requireSubscription = async (req, res, next) => {
  if (req.userRole === 'superadmin' || req.user?.role === 'superadmin') return next();

  try {
    let tenantId = req.tenantId;

    // Fallback: if auth hasn't run, decode token ourselves
    if (!tenantId) {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'No token provided' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'superadmin') return next();
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      const row = await pool.query('SELECT parent_id FROM users WHERE id=$1', [decoded.userId]);
      tenantId = row.rows[0]?.parent_id || decoded.userId;
    }

    const sub = await pool.query(
      `SELECT s.*, p.name as plan_name, p.max_leads, p.max_customers, p.max_employees, p.features
       FROM subscriptions s JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT 1`,
      [tenantId]
    );

    if (sub.rows.length === 0) {
      return res.status(403).json({ error: 'NO_SUBSCRIPTION', message: 'Please select a plan to continue' });
    }

    const s = sub.rows[0];
    const now = new Date();
    // 5-state machine: trialing, active, past_due, canceled, expired.
    const GRACE_MS = 3 * 24 * 60 * 60 * 1000; // matches utils/billing-cron.js's GRACE_DAYS

    if (s.status === 'trialing' && s.trial_ends_at && new Date(s.trial_ends_at) < now) {
      return res.status(403).json({ error: 'TRIAL_EXPIRED', message: 'Your free trial has expired. Please upgrade your plan.' });
    }
    if (s.status === 'expired') {
      return res.status(403).json({ error: 'SUBSCRIPTION_EXPIRED', message: 'Your subscription has expired. Please renew.' });
    }
    // Cancelled keeps full access until the period it was already paid for
    // ends — only blocks once ends_at actually passes, same as a normal
    // active subscription running out.
    if (s.status === 'canceled' && s.ends_at && new Date(s.ends_at) < now) {
      await pool.query("UPDATE subscriptions SET status='expired' WHERE id=$1", [s.id]);
      return res.status(403).json({ error: 'SUBSCRIPTION_EXPIRED', message: 'Your subscription has expired. Please renew.' });
    }
    // past_due is the non-blocking grace period — access stays on while
    // Razorpay retries the charge. The hourly cron is what normally flips
    // this to expired once the grace window passes; this is just a
    // defensive fallback so a request never slips through on a stale
    // status if the cron hasn't run yet.
    if (s.status === 'past_due' && s.past_due_since && now - new Date(s.past_due_since) > GRACE_MS) {
      await pool.query("UPDATE subscriptions SET status='expired' WHERE id=$1", [s.id]);
      return res.status(403).json({ error: 'SUBSCRIPTION_EXPIRED', message: 'Your subscription has expired. Please renew.' });
    }
    if (s.status === 'active' && s.ends_at && new Date(s.ends_at) < now) {
      await pool.query("UPDATE subscriptions SET status='expired' WHERE id=$1", [s.id]);
      return res.status(403).json({ error: 'SUBSCRIPTION_EXPIRED', message: 'Your subscription has expired. Please renew.' });
    }

    // Parse features array (may come as string from DB)
    s.features = typeof s.features === 'string' ? JSON.parse(s.features) : (s.features || []);
    req.subscription = s;
    next();
  } catch (e) {
    console.error('requireSubscription error:', e.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Plan feature gate — requireSubscription must run first
// Feature keys: 'core', 'customers', 'lead_sources', 'automation', 'employees'
const requirePlanFeature = (feat) => (req, res, next) => {
  if (req.userRole === 'superadmin') return next();
  if (!req.subscription) return res.status(403).json({ error: 'NO_SUBSCRIPTION' });
  const features = req.subscription.features || [];
  if (!features.includes(feat)) {
    return res.status(403).json({
      error: 'FEATURE_NOT_IN_PLAN',
      message: `The "${feat}" feature is not included in your current plan. Please upgrade to access it.`,
      feature: feat,
    });
  }
  next();
};

// ── Permission gate — owner/superadmin always pass; sub-accounts need the flag
const { hasPermission } = require('../utils/permissions');
const requirePermission = (key) => (req, res, next) => {
  if (!hasPermission(req, key)) {
    return res.status(403).json({ error: 'Permission denied' });
  }
  next();
};

module.exports = { auth, superadminAuth, requireSubscription, requirePermission, requirePlanFeature };
