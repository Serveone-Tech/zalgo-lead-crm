const { pool } = require("../db");

// Normalise a phone number for duplicate comparison: strip everything but
// digits and compare the last 10 (so "+91 98765 43210", "919876543210" and
// "9876543210" are all treated as the same number).
const phoneKey = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? digits.slice(-10) : "";
};

// Junk values like "p:" or "N/A" have no digits (or too few to be a real
// number) — treat those the same as "no phone" instead of storing them
// as if they were a genuine, dedupe-able contact number.
const MIN_PHONE_DIGITS = 6;
const isValidPhone = (phone) => phoneKey(phone).length >= MIN_PHONE_DIGITS;

// Strip label junk some sources glue onto the value (e.g. Meta's sheet sync
// sometimes writes a cell as "p:+919279086530" instead of just the number).
// Keeps a leading "+" if the source had one, drops everything else non-digit.
const cleanPhoneValue = (phone) => {
  const str = String(phone || "");
  const digits = str.replace(/\D/g, "");
  if (!digits) return "";
  return str.includes("+") ? `+${digits}` : digits;
};

// Find an existing lead in this tenant with the same phone number.
// excludeId lets an update skip matching itself.
async function findDuplicateLeadByPhone(tenantId, phone, excludeId = null) {
  const key = phoneKey(phone);
  if (!key) return null;
  const params = [tenantId, key];
  let query = `SELECT id, name FROM leads WHERE user_id=$1
               AND right(regexp_replace(phone, '\\D', '', 'g'), 10) = $2
               AND regexp_replace(phone, '\\D', '', 'g') != ''`;
  if (excludeId) {
    params.push(excludeId);
    query += ` AND id != $${params.length}`;
  }
  query += ` LIMIT 1`;
  const { rows } = await pool.query(query, params);
  return rows[0] || null;
}

module.exports = { phoneKey, findDuplicateLeadByPhone, isValidPhone, cleanPhoneValue };
