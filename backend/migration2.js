require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    const cols = [
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT ''`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT ''`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS platform VARCHAR(100) DEFAULT ''`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS platform_link TEXT DEFAULT ''`,
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT ''`,
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT ''`,
    ];
    for (const q of cols) {
      await client.query(q);
      console.log(
        "✅",
        q.split("ADD COLUMN IF NOT EXISTS")[1]?.split(" ")[1] || q,
      );
    }
    console.log("\n✅ All columns added successfully!");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    client.release();
    process.exit(0);
  }
}
migrate();
