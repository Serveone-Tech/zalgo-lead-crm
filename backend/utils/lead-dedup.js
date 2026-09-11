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
// excludeId lets an update skip matching itself. Accepts an optional
// `db` (a checked-out client) so callers inside withPhoneLock's
// transaction can reuse the same connection instead of the shared pool.
async function findDuplicateLeadByPhone(tenantId, phone, excludeId = null, db = pool) {
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
  const { rows } = await db.query(query, params);
  return rows[0] || null;
}

// Serialises "does a lead with this phone already exist?" + "insert if not"
// for a single tenant+phone so a burst of near-simultaneous webhook calls
// (Meta retrying delivery, a Sheets sync firing twice, two WhatsApp
// messages arriving within milliseconds of each other) can't all pass the
// duplicate check before any of them commits an insert — which is exactly
// how the same phone number ended up with 2-3 separate lead rows in
// production. Postgres advisory locks are the fix: acquire one keyed to
// (tenantId, phone) for the duration of a transaction, so a second caller
// for the same tenant+phone blocks until the first has committed and its
// new row is actually visible to the second caller's duplicate check.
//
// `fn(client)` receives a checked-out client already inside BEGIN, with
// the lock held — do the SELECT-for-duplicate and the INSERT (if needed)
// against `client`, not the shared pool, so they're part of the same
// transaction the lock protects.
async function withPhoneLock(tenantId, phone, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1, hashtext($2))", [tenantId, phoneKey(phone)]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { phoneKey, findDuplicateLeadByPhone, isValidPhone, cleanPhoneValue, withPhoneLock };
