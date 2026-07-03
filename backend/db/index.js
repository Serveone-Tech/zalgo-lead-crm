const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    // ── STEP 1: Create base tables if not exist ──────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── STEP 2: ALTER existing tables — add missing columns ──
    // These run safely whether columns already exist or not
    const alterUsers = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES users(id)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS role_label VARCHAR(50) DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'`,
    ];
    for (const q of alterUsers) {
      await client.query(q).catch((e) => console.log("alter skip:", e.message));
    }

    const alterLeads = [
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL`,
    ];

    const alterSubscriptions = [
      `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS expiry_reminder_sent BOOLEAN DEFAULT false`,
      `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS expired_email_sent BOOLEAN DEFAULT false`,
    ];
    for (const q of alterSubscriptions) {
      await client.query(q).catch((e) => console.log("alter skip:", e.message));
    }
    for (const q of alterLeads) {
      await client.query(q).catch((e) => console.log("alter skip:", e.message));
    }

    // ── STEP 3: Rest of the tables ───────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS organisations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        address TEXT DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        state VARCHAR(100) DEFAULT '',
        website VARCHAR(255) DEFAULT '',
        logo_url TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        price_monthly DECIMAL(10,2) DEFAULT 0,
        price_yearly DECIMAL(10,2) DEFAULT 0,
        trial_days INTEGER DEFAULT 0,
        features JSONB DEFAULT '[]',
        max_leads INTEGER DEFAULT -1,
        max_customers INTEGER DEFAULT -1,
        is_active BOOLEAN DEFAULT true,
        is_free BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'trial',
        billing_cycle VARCHAR(10) DEFAULT 'monthly',
        starts_at TIMESTAMP DEFAULT NOW(),
        ends_at TIMESTAMP,
        trial_ends_at TIMESTAMP,
        amount_paid DECIMAL(10,2) DEFAULT 0,
        payment_ref VARCHAR(255) DEFAULT '',
        notes TEXT DEFAULT '',
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        currency VARCHAR(10) DEFAULT 'INR',
        currency_symbol VARCHAR(10) DEFAULT '₹',
        institute_name VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        platform VARCHAR(100) DEFAULT 'LinkedIn',
        platform_link TEXT DEFAULT '',
        stage VARCHAR(50) DEFAULT 'New',
        last_message TEXT DEFAULT '',
        follow_up_date DATE,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS lead_messages (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        message_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        platform VARCHAR(100) DEFAULT '',
        platform_link TEXT DEFAULT '',
        stage VARCHAR(50) DEFAULT '',
        notes TEXT DEFAULT '',
        total_fee DECIMAL(12,2) DEFAULT 0,
        amount_paid DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        converted_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customer_payments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(12,2) NOT NULL,
        payment_date DATE NOT NULL,
        due_date DATE,
        payment_mode VARCHAR(50) DEFAULT 'Cash',
        status VARCHAR(50) DEFAULT 'Paid',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS automation_credentials (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        email_enabled BOOLEAN DEFAULT false,
        email_api_key TEXT DEFAULT '',
        email_from VARCHAR(255) DEFAULT '',
        email_from_name VARCHAR(255) DEFAULT '',
        sms_enabled BOOLEAN DEFAULT false,
        sms_account_sid TEXT DEFAULT '',
        sms_auth_token TEXT DEFAULT '',
        sms_from VARCHAR(50) DEFAULT '',
        whatsapp_enabled BOOLEAN DEFAULT false,
        wa_account_sid TEXT DEFAULT '',
        wa_auth_token TEXT DEFAULT '',
        wa_from VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS automation_triggers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        trigger_id VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT false,
        channels TEXT[] DEFAULT '{}',
        template TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, trigger_id)
      );

      CREATE TABLE IF NOT EXISTS stages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        color VARCHAR(7) DEFAULT '#00868a',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS password_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── STEP 4: Seed default plans ───────────────────────────
    const planCount = await client.query("SELECT COUNT(*) FROM plans");
    if (parseInt(planCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO plans (name, description, price_monthly, price_yearly, trial_days, is_free, is_active, sort_order, max_leads, max_customers, features) VALUES
        ('Free Trial', 'Get started with basic features', 0, 0, 14, true, true, 0, 50, 20,
          '["Up to 50 Leads", "Up to 20 Customers", "Basic Follow-up Reminders", "14 Day Free Trial"]'::jsonb),
        ('Basic', 'Perfect for individual coaches', 499, 4999, 0, false, true, 1, 500, 200,
          '["Up to 500 Leads", "Up to 200 Customers", "Payment Tracking", "Follow-up Automation", "Email Support"]'::jsonb),
        ('Pro', 'For growing coaching businesses', 999, 9999, 0, false, true, 2, -1, -1,
          '["Unlimited Leads", "Unlimited Customers", "Full Automation (Email+SMS+WhatsApp)", "Priority Support", "Custom Branding"]'::jsonb)
      `);
      console.log("✅ Default plans seeded");
    }

    // ── STEP 5: Migrate plan features to machine-readable keys ──
    // Only updates plans that still have old human-readable feature strings
    await client.query(`
      UPDATE plans SET features='["customers","bulk_upload"]'::jsonb
      WHERE sort_order=0 AND (features IS NULL OR features::text LIKE '%Up to%' OR features::text LIKE '%Day Free%');

      UPDATE plans SET features='["customers","bulk_upload"]'::jsonb
      WHERE sort_order=1 AND (features IS NULL OR features::text LIKE '%Up to%');

      UPDATE plans SET features='["customers","automation","bulk_upload","employees"]'::jsonb
      WHERE sort_order=2 AND (features IS NULL OR features::text LIKE '%Unlimited%' OR features::text LIKE '%Full Automation%');
    `).catch((e) => console.log("plan migration skip:", e.message));

    // ── STEP 6: Seed superadmin ──────────────────────────────
    const bcrypt = require("bcryptjs");
    const saEmail = process.env.SUPERADMIN_EMAIL || "superadmin@zalgo.com";
    const saPass = process.env.SUPERADMIN_PASSWORD || "superadmin123";
    const exists = await client.query("SELECT id FROM users WHERE email=$1", [
      saEmail,
    ]);
    if (exists.rows.length === 0) {
      const hashed = await bcrypt.hash(saPass, 10);
      await client.query(
        `INSERT INTO users (name, email, password, role, onboarded)
         VALUES ('Super Admin', $1, $2, 'superadmin', true)`,
        [saEmail, hashed],
      );
      console.log(`✅ Superadmin created: ${saEmail} / ${saPass}`);
    } else {
      // Ensure existing superadmin has correct role
      await client.query(
        `UPDATE users SET role='superadmin', onboarded=true WHERE email=$1`,
        [saEmail],
      );
    }

    // ── STEP 6: Mark all existing users as onboarded ─────────
    // Set defaults for existing users who had no role column
    await client
      .query(
        `
      UPDATE users SET role='user', onboarded=true
      WHERE role IS NULL OR role = ''
    `,
      )
      .catch(() => {});

    console.log("✅ Database initialized successfully");
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
