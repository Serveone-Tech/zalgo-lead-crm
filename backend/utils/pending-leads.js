const { pool } = require("../db");

// Rows with no usable phone number go here instead of the main Leads table,
// so a webhook resync (or an import file with incomplete rows) doesn't
// clutter Leads with uncontactable entries. A cheap name/email dedup stops
// the same phone-less row from piling up every time a source gets re-scanned.
async function savePendingLead(tenantId, { name, email, platform, notes }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim();
  if (!cleanName && !cleanEmail) return false;

  const dup = await pool.query(
    `SELECT id FROM pending_leads WHERE user_id=$1
     AND (LOWER(name)=LOWER($2) OR ($3 != '' AND LOWER(email)=LOWER($3)))
     LIMIT 1`,
    [tenantId, cleanName, cleanEmail],
  );
  if (dup.rows.length > 0) return false;

  await pool.query(
    `INSERT INTO pending_leads (user_id, name, email, platform, notes) VALUES ($1,$2,$3,$4,$5)`,
    [tenantId, cleanName || cleanEmail, cleanEmail, platform || "", notes || ""],
  );
  return true;
}

module.exports = { savePendingLead };
