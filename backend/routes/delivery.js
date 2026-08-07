const express = require("express");
const { pool } = require("../db");
const { auth, requirePermission } = require("../middleware/auth");
const { PROVIDERS } = require("../utils/delivery-providers");

const router = express.Router();

// ── GET provider registry — drives the dynamic Settings form ──────
router.get("/providers", auth, (req, res) => {
  const list = Object.entries(PROVIDERS).map(([id, p]) => ({
    id,
    label: p.label,
    fields: p.fields,
  }));
  res.json(list);
});

// ── GET this tenant's saved provider config (secrets masked) ──────
router.get("/credentials", auth, requirePermission("manage_settings"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT provider, enabled, credentials FROM delivery_credentials WHERE user_id=$1",
      [req.tenantId],
    );
    if (result.rows.length === 0) {
      return res.json({ provider: "", enabled: false, credentials: {} });
    }
    const row = result.rows[0];
    const provider = PROVIDERS[row.provider];
    const masked = {};
    if (provider) {
      for (const field of provider.fields) {
        const val = row.credentials?.[field.key] || "";
        masked[field.key] =
          field.type === "password" && val
            ? val.length > 6
              ? val.slice(0, 2) + "****" + val.slice(-2)
              : "****"
            : val;
      }
    }
    res.json({ provider: row.provider, enabled: row.enabled, credentials: masked });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT save provider config ───────────────────────────────────────
router.put("/credentials", auth, requirePermission("manage_settings"), async (req, res) => {
  const { provider, enabled, credentials } = req.body;
  if (provider && !PROVIDERS[provider]) {
    return res.status(400).json({ error: "Unknown provider" });
  }
  try {
    const existing = await pool.query(
      "SELECT credentials FROM delivery_credentials WHERE user_id=$1",
      [req.tenantId],
    );
    const cur = existing.rows[0]?.credentials || {};

    // Masked values (containing "****") mean "unchanged" — keep the stored one.
    const merged = { ...credentials };
    for (const key of Object.keys(merged)) {
      if (typeof merged[key] === "string" && merged[key].includes("****")) {
        merged[key] = cur[key] || "";
      }
    }

    await pool.query(
      `INSERT INTO delivery_credentials (user_id, provider, enabled, credentials, updated_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (user_id) DO UPDATE SET provider=$2, enabled=$3, credentials=$4, updated_at=NOW()`,
      [req.tenantId, provider || "", !!enabled, JSON.stringify(merged || {})],
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET live tracking status for one order ─────────────────────────
router.get("/track/:orderId", auth, async (req, res) => {
  try {
    const orderRes = await pool.query(
      "SELECT tracking_id FROM customer_orders WHERE id=$1 AND user_id=$2",
      [req.params.orderId, req.tenantId],
    );
    const order = orderRes.rows[0];
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (!order.tracking_id) {
      return res.status(400).json({ error: "This order has no tracking ID" });
    }

    const credRes = await pool.query(
      "SELECT provider, enabled, credentials FROM delivery_credentials WHERE user_id=$1",
      [req.tenantId],
    );
    const cred = credRes.rows[0];
    if (!cred || !cred.enabled || !cred.provider) {
      return res.status(400).json({ error: "Delivery tracking is not enabled. Configure it in Settings." });
    }

    const provider = PROVIDERS[cred.provider];
    if (!provider) return res.status(400).json({ error: "Unknown delivery provider configured" });

    if (cred.provider === "generic") {
      const template = cred.credentials?.url_template || "";
      const url = template.replace("{tracking_id}", encodeURIComponent(order.tracking_id));
      return res.json({ link_only: true, url });
    }

    if (!provider.track) {
      return res.status(400).json({ error: "This provider does not support live tracking" });
    }

    const status = await provider.track(cred.credentials || {}, order.tracking_id);
    res.json({ link_only: false, ...status });
  } catch (e) {
    console.error("Tracking error:", e.message);
    res.status(502).json({ error: e.message || "Failed to fetch tracking status" });
  }
});

module.exports = router;
