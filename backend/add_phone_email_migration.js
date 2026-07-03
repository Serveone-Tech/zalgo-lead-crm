// Run this ONCE: node add_phone_email_migration.js
// Adds phone and email columns to the customers table
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT ''`,
    );
    await client.query(
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT ''`,
    );
    await client.query(
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT ''`,
    );
    await client.query(
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT ''`,
    );
    console.log(
      "✅ Migration done — phone & email columns added to leads and customers",
    );
  } finally {
    client.release();
    process.exit(0);
  }
}
migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
