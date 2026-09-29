const { pool } = require("../db");

// A tenant's effective employee seat limit — live-computed, not a single
// mutated integer, so an expiring purchased add-on bundle naturally drops
// out on its own without needing a sweep to "undo" anything:
//   plan.max_employees (-1 = unlimited, short-circuits the rest)
//   + SUM(seats_added) from every PAID, not-yet-expired addon purchase
//   + subscriptions.superadmin_seat_override (a Super Admin's manual grant)
async function getEffectiveEmployeeLimit(tenantId) {
  const subRes = await pool.query(
    `SELECT s.superadmin_seat_override, p.max_employees
     FROM subscriptions s JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1`,
    [tenantId],
  );
  const sub = subRes.rows[0];
  if (!sub) return { limit: 0, base: 0, purchasedSeats: 0, adminOverride: 0, activeBundles: [] };
  if (sub.max_employees === -1) return { limit: -1, base: -1, purchasedSeats: 0, adminOverride: sub.superadmin_seat_override || 0, activeBundles: [] };

  const bundlesRes = await pool.query(
    `SELECT id, bundles, seats_added, expires_at, paid_at FROM employee_addon_purchases
     WHERE user_id=$1 AND status='paid' AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY expires_at ASC NULLS LAST`,
    [tenantId],
  );
  const purchasedSeats = bundlesRes.rows.reduce((sum, r) => sum + r.seats_added, 0);
  const adminOverride = sub.superadmin_seat_override || 0;
  return {
    limit: sub.max_employees + purchasedSeats + adminOverride,
    base: sub.max_employees,
    purchasedSeats,
    adminOverride,
    activeBundles: bundlesRes.rows,
  };
}

module.exports = { getEffectiveEmployeeLimit };
