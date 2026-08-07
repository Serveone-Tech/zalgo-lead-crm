const { pool } = require("../db");

let fireTrigger = async () => {}; // safe default
try {
  fireTrigger = require("./automation-trigger").fireTrigger;
} catch (e) {}

// Ensures a Customer row exists for this lead (creating one on first call),
// fires the lead_converted automation, and returns the customer id either
// way. Used both when a lead's stage becomes "Converted" and when someone
// fills in the order-fulfillment form for a lead that hasn't been formally
// converted yet — either path should land in the same Customers record.
async function getOrCreateCustomerFromLead(tenantId, lead) {
  const existingCustomer = await pool.query(
    "SELECT id FROM customers WHERE lead_id=$1",
    [lead.id],
  );
  if (existingCustomer.rows.length > 0) {
    return existingCustomer.rows[0];
  }

  const colCheck = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='customers'`,
  );
  const cols = colCheck.rows.map((r) => r.column_name);

  const fields = ["user_id", "lead_id", "name"];
  const values = [tenantId, lead.id, lead.name];

  if (cols.includes("phone")) {
    fields.push("phone");
    values.push(lead.phone || "");
  }
  if (cols.includes("email")) {
    fields.push("email");
    values.push(lead.email || "");
  }
  if (cols.includes("platform")) {
    fields.push("platform");
    values.push(lead.platform || "");
  }
  if (cols.includes("platform_link")) {
    fields.push("platform_link");
    values.push(lead.platform_link || "");
  }
  if (cols.includes("assigned_to")) {
    fields.push("assigned_to");
    values.push(lead.assigned_to || null);
  }
  fields.push("total_fee", "amount_paid");
  values.push(0, 0);

  const placeholders = values.map((_, i) => `$${i + 1}`).join(",");
  const inserted = await pool.query(
    `INSERT INTO customers (${fields.join(",")}) VALUES (${placeholders}) RETURNING id`,
    values,
  );

  fireTrigger("lead_converted", tenantId, {
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
  }).catch(() => {});

  return inserted.rows[0];
}

module.exports = { getOrCreateCustomerFromLead };
