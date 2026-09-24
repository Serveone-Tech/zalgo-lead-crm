const { pool } = require("../db");

// One row per state-changing Super Admin action — target_type/target_id
// identify what was acted on (e.g. 'tenant'/userId, 'plan'/planId), details
// is free-form JSON for whatever's useful to reconstruct "what happened"
// later (never put a raw password or secret in here). Failures here never
// block the action itself — logging is best-effort, not part of the
// transaction, since losing an audit row is bad but blocking a real admin
// action because of a logging hiccup would be worse.
async function logAdminAction(adminUserId, actionType, targetType, targetId, details = {}) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (admin_user_id, action_type, target_type, target_id, details)
       VALUES ($1,$2,$3,$4,$5)`,
      [adminUserId, actionType, targetType, targetId ?? null, JSON.stringify(details)],
    );
  } catch (e) {
    console.error("[admin-audit] failed to log action:", e.message);
  }
}

module.exports = { logAdminAction };
