const { Pool, types } = require("pg");
require("dotenv").config();

// node-postgres parses DATE/TIMESTAMP columns into local-timezone JS Date
// objects by default. Serializing those via JSON later (toISOString, always
// UTC) shifts the calendar day/time backwards for any positive UTC offset
// (e.g. IST), so a lead due "today" ends up reported as "yesterday" to the
// frontend. Returning the raw string sidesteps the timezone round-trip
// entirely. TIMESTAMP values get their space separator swapped for 'T' so
// they parse the same way plain DATE strings already do (d.split("T")[0]).
types.setTypeParser(types.builtins.DATE, (val) => val);
types.setTypeParser(types.builtins.TIMESTAMP, (val) =>
  val ? val.replace(" ", "T") : val,
);

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
    const alterAutomationCredentials = [
      `ALTER TABLE automation_credentials ADD COLUMN IF NOT EXISTS webhook_token VARCHAR(64) UNIQUE`,
    ];
    for (const q of alterAutomationCredentials) {
      await client.query(q).catch((e) => console.log("alter skip:", e.message));
    }
    for (const q of alterSubscriptions) {
      await client.query(q).catch((e) => console.log("alter skip:", e.message));
    }
    for (const q of alterLeads) {
      await client.query(q).catch((e) => console.log("alter skip:", e.message));
    }

    const alterCustomers = [
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT DEFAULT ''`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) DEFAULT ''`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20) DEFAULT ''`,
    ];
    for (const q of alterCustomers) {
      await client.query(q).catch((e) => console.log("alter skip:", e.message));
    }

    const alterUserSettings = [
      `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS order_fulfillment_stage VARCHAR(50) DEFAULT ''`,
      `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10`,
      // Fallback weight used for order items with no catalog link (custom
      // items typed by hand), so a courier shipment can still be created.
      `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS default_item_weight_kg DECIMAL(10,3) DEFAULT 0.5`,
    ];
    for (const q of alterUserSettings) {
      await client.query(q).catch((e) => console.log("alter skip:", e.message));
    }

    const alterCustomerOrders = [
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'prepaid'`,
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS advance_paid DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`,
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS stage VARCHAR(50) DEFAULT ''`,
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS inventory_deducted BOOLEAN DEFAULT false`,
      // city/state — couriers' create-order APIs require these separately
      // from the free-text address; the existing `provider`/`tracking_id`
      // columns are reused as "which courier this ships with" / "AWB".
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT ''`,
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT ''`,
      // Guards against double-shipping the same order, same pattern as
      // inventory_deducted. courier_error surfaces the courier's own
      // failure message so a bad pickup-location name etc is fixable
      // instead of silently never shipping.
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS courier_order_created BOOLEAN DEFAULT false`,
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS courier_error TEXT DEFAULT ''`,
      // Optional manual overrides for the courier shipment's weight/box
      // dimensions — NULL means "use the auto-computed default" (item
      // weights summed, and a conservative fixed box size), since the
      // auto default is often wrong for the actual physical parcel.
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS package_weight_kg DECIMAL(10,3)`,
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS package_length_cm DECIMAL(10,2)`,
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS package_width_cm DECIMAL(10,2)`,
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS package_height_cm DECIMAL(10,2)`,
      // Who placed this order — powers the Sales Report's "Employee" column.
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL`,
      // Set once, the first time this order's stage reaches an
      // is_delivered-flagged stage — the Sales Report's date filter runs
      // against this (falling back to created_at for older orders that
      // reached that stage before this column/flag existed).
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP`,
      // Whether this is the customer's first order or a repeat purchase —
      // shown on the fulfillment form and as a Sales Report column.
      `ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(10) DEFAULT 'FRESH'`,
    ];
    for (const q of alterCustomerOrders) {
      await client.query(q).catch((e) => console.log("alter skip:", e.message));
    }

    const alterOrderStages = [
      `ALTER TABLE order_stages ADD COLUMN IF NOT EXISTS deduct_inventory BOOLEAN DEFAULT false`,
      `ALTER TABLE order_stages ADD COLUMN IF NOT EXISTS stock_action VARCHAR(10) DEFAULT 'none'`,
      `ALTER TABLE order_stages ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false`,
      // Any number of stages (Cancelled, Returned, ...) can be flagged so
      // orders sitting there stop counting toward pending-dues totals.
      `ALTER TABLE order_stages ADD COLUMN IF NOT EXISTS excludes_dues BOOLEAN DEFAULT false`,
      // Any number of stages (Delivered, Completed, ...) can be flagged so
      // orders that reach them show up in the Sales Report.
      `ALTER TABLE order_stages ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN DEFAULT false`,
    ];
    for (const q of alterOrderStages) {
      await client.query(q).catch((e) => console.log("alter skip:", e.message));
    }
    // One-time backfill: carry the old single deduct_inventory flag over to
    // the new stock_action column so an already-configured tenant doesn't
    // lose their setting.
    await client
      .query(`UPDATE order_stages SET stock_action='deduct' WHERE deduct_inventory=true AND stock_action='none'`)
      .catch((e) => console.log("alter skip:", e.message));
    // One-time backfill: an already-existing "Cancelled"/"Returned" stage
    // almost certainly should stop counting toward pending dues, even
    // though it predates the excludes_dues column.
    await client
      .query(`UPDATE order_stages SET excludes_dues=true WHERE excludes_dues=false AND LOWER(name) IN ('cancelled', 'canceled', 'returned', 'return')`)
      .catch((e) => console.log("alter skip:", e.message));
    // One-time backfill: an already-existing "Delivered"/"Completed" stage
    // almost certainly should count toward the Sales Report, even though it
    // predates the is_delivered column.
    await client
      .query(`UPDATE order_stages SET is_delivered=true WHERE is_delivered=false AND LOWER(name) IN ('delivered', 'completed', 'complete')`)
      .catch((e) => console.log("alter skip:", e.message));

    // inventory_items predates weight_kg/hsn_code — add them for already-existing tenants.
    await client
      .query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,3) DEFAULT 0`)
      .catch((e) => console.log("alter skip:", e.message));
    await client
      .query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20) DEFAULT ''`)
      .catch((e) => console.log("alter skip:", e.message));

    // delivery_credentials predates multi-provider support and was created
    // with a single UNIQUE(user_id) — CREATE TABLE IF NOT EXISTS above
    // won't retroactively fix that on an already-existing table, so swap
    // the constraint explicitly for tenants who already have a row.
    await client
      .query(`ALTER TABLE delivery_credentials DROP CONSTRAINT IF EXISTS delivery_credentials_user_id_key`)
      .catch((e) => console.log("alter skip:", e.message));
    await client
      .query(`ALTER TABLE delivery_credentials ADD CONSTRAINT delivery_credentials_user_provider_key UNIQUE(user_id, provider)`)
      .catch((e) => console.log("alter skip:", e.message));

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
        follow_up_date TIMESTAMP,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pending_leads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        platform VARCHAR(100) DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS lead_messages (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        message_date TIMESTAMP NOT NULL DEFAULT NOW(),
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

      -- One fulfilment/delivery event for a customer: items given, address,
      -- amount, and (optionally) a courier tracking number.
      CREATE TABLE IF NOT EXISTS customer_orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        address TEXT DEFAULT '',
        pincode VARCHAR(10) DEFAULT '',
        amount DECIMAL(12,2) DEFAULT 0,
        payment_type VARCHAR(20) DEFAULT 'prepaid',
        advance_paid DECIMAL(12,2) DEFAULT 0,
        next_due_date DATE,
        tracking_id VARCHAR(100) DEFAULT '',
        provider VARCHAR(50) DEFAULT '',
        stage VARCHAR(50) DEFAULT '',
        -- Guards against double-deducting inventory: set true the moment
        -- this order's items are drawn down (either at creation, if no
        -- deduct-stage is configured, or when it first reaches that stage).
        inventory_deducted BOOLEAN DEFAULT false,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Admin-managed catalog so order items can be picked from a dropdown
      -- instead of typed by hand every time, with price pulled in
      -- automatically. stock_qty is decremented as orders are fulfilled.
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(12,2) DEFAULT 0,
        stock_qty INTEGER DEFAULT 0,
        -- Used to compute a courier shipment's total package weight.
        weight_kg DECIMAL(10,3) DEFAULT 0,
        -- Tax classification code shown per line item in the Sales Report.
        hsn_code VARCHAR(20) DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES customer_orders(id) ON DELETE CASCADE,
        inventory_item_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        quantity INTEGER DEFAULT 1,
        price DECIMAL(12,2) DEFAULT 0
      );

      -- Admin-configurable order pipeline (mirrors the lead "stages" table)
      -- so each tenant can name their own fulfillment stages instead of a
      -- fixed enum.
      CREATE TABLE IF NOT EXISTS order_stages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        color VARCHAR(7) DEFAULT '#00868a',
        sort_order INTEGER DEFAULT 0,
        -- Superseded by stock_action below (kept, unused, to avoid a risky
        -- column drop on an already-live table).
        deduct_inventory BOOLEAN DEFAULT false,
        -- Any number of stages can be 'deduct' or 'restore' — an order's
        -- items draw down stock the first time it reaches a 'deduct' stage,
        -- and give it back if it later reaches a 'restore' stage (e.g. put
        -- on hold or cancelled after being confirmed). If no stage anywhere
        -- is 'deduct', stock is drawn down immediately at order creation
        -- instead (the original, simpler behavior).
        stock_action VARCHAR(10) DEFAULT 'none',
        -- At most one stage per tenant has this true — where a freshly
        -- fulfilled order starts out.
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Per-tenant delivery-provider config — a tenant can connect any
      -- number of these (Delhivery, Shiprocket, a generic link-out, ...),
      -- one row per provider type. 'credentials' shape depends on
      -- 'provider' so new providers can be added later without a schema
      -- change. Order-creation providers also stash a 'pickup_location'
      -- inside 'credentials' (just another dynamic field from the registry).
      CREATE TABLE IF NOT EXISTS delivery_credentials (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(50) DEFAULT '',
        enabled BOOLEAN DEFAULT false,
        credentials JSONB DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, provider)
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
        webhook_token VARCHAR(64) UNIQUE,
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

    // ── STEP 3.5: Widen follow-up date columns to carry a time too ──
    // (safe to re-run: altering a column to the type it already is is a no-op)
    const alterDateTimeCols = [
      `ALTER TABLE leads ALTER COLUMN follow_up_date TYPE TIMESTAMP USING follow_up_date::timestamp`,
      `ALTER TABLE lead_messages ALTER COLUMN message_date TYPE TIMESTAMP USING message_date::timestamp`,
    ];
    for (const q of alterDateTimeCols) {
      await client.query(q).catch((e) => console.log("alter skip:", e.message));
    }

    // Runs here (after inventory_items is created above), not in the early
    // STEP 2 alters — the FK target has to already exist.
    await client
      .query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS inventory_item_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL`)
      .catch((e) => console.log("alter skip:", e.message));

    // ── STEP 3.6: Indexes ─────────────────────────────────────
    // Every query in this app filters by tenant (user_id) first — without an
    // index on it, Postgres was doing a full sequential scan of these tables
    // on every single request, which is what made the app feel slow as data
    // grew. CREATE INDEX IF NOT EXISTS is safe to run on every boot.
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_leads_user_stage ON leads(user_id, stage)`,
      `CREATE INDEX IF NOT EXISTS idx_leads_user_assigned ON leads(user_id, assigned_to)`,
      `CREATE INDEX IF NOT EXISTS idx_leads_user_followup ON leads(user_id, follow_up_date)`,
      `CREATE INDEX IF NOT EXISTS idx_leads_user_created ON leads(user_id, created_at DESC)`,
      // Powers the phone-duplicate check (regexp_replace(phone,...)) used on every lead add/import.
      `CREATE INDEX IF NOT EXISTS idx_leads_phone_digits ON leads(user_id, (regexp_replace(phone, '\\D', '', 'g')))`,
      `CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_customer_payments_user_id ON customer_payments(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_lead_messages_lead_id ON lead_messages(lead_id)`,
      `CREATE INDEX IF NOT EXISTS idx_stages_user_id ON stages(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_order_stages_user_id ON order_stages(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pending_leads_user_id ON pending_leads(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_automation_triggers_user_id ON automation_triggers(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id)`,
      `CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_id ON customer_orders(customer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_customer_orders_user_id ON customer_orders(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`,
      `CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to)`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id)`,
    ];
    for (const q of indexes) {
      await client.query(q).catch((e) => console.log("index skip:", e.message));
    }

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
