const express = require("express");
const { pool } = require("../db");
const { auth, requirePermission } = require("../middleware/auth");
const { isOwner } = require("../utils/permissions");
const { PROVIDERS } = require("../utils/delivery-providers");
const { createCourierShipmentForOrder } = require("../utils/courier-shipment");

const router = express.Router();

function maskCredentials(provider, credentials) {
  const masked = {};
  if (!provider) return masked;
  for (const field of provider.fields) {
    const val = credentials?.[field.key] || "";
    masked[field.key] =
      field.type === "password" && val
        ? val.length > 6
          ? val.slice(0, 2) + "****" + val.slice(-2)
          : "****"
        : val;
  }
  return masked;
}

// ── GET city/state for a pincode — auto-fills the Order Fulfillment form
// so the admin doesn't have to type them by hand, and so couriers' create-
// order APIs (which require billing_city/billing_state) reliably get them.
// India Post's public lookup is free and needs no API key/credentials.
router.get("/pincode/:pincode", auth, async (req, res) => {
  const pincode = req.params.pincode;
  if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ error: "Invalid pincode" });
  try {
    const r = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await r.json().catch(() => null);
    const po = data?.[0]?.PostOffice?.[0];
    if (!po) return res.status(404).json({ error: "Pincode not found" });
    res.json({ city: po.District || po.Block || "", state: po.State || "" });
  } catch (e) {
    console.error("Pincode lookup error:", e.message);
    res.status(502).json({ error: "Pincode lookup failed" });
  }
});

// ── GET provider registry — drives the dynamic Settings form ──────
router.get("/providers", auth, (req, res) => {
  const list = Object.entries(PROVIDERS).map(([id, p]) => ({
    id,
    label: p.label,
    fields: p.fields,
    supportsCreateOrder: !!p.createOrder,
  }));
  res.json(list);
});

// ── GET this tenant's connected delivery panels (secrets masked) ──
// Any authenticated tenant member can read this (masked, no real secrets) —
// it's how the frontend decides whether to show the "View Track" button and
// which providers to offer in the order fulfillment form, so gating it
// behind manage_settings hid tracking from every employee even when an
// admin had already configured a provider.
router.get("/credentials", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT provider, enabled, credentials FROM delivery_credentials WHERE user_id=$1 ORDER BY provider ASC",
      [req.tenantId],
    );
    const rows = result.rows.map((row) => ({
      provider: row.provider,
      enabled: row.enabled,
      credentials: maskCredentials(PROVIDERS[row.provider], row.credentials),
    }));
    res.json(rows);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT save one provider's config (a tenant can connect several) ──
router.put("/credentials", auth, requirePermission("manage_settings"), async (req, res) => {
  const { provider, enabled, credentials } = req.body;
  if (!provider || !PROVIDERS[provider]) {
    return res.status(400).json({ error: "Unknown provider" });
  }
  try {
    const existing = await pool.query(
      "SELECT credentials FROM delivery_credentials WHERE user_id=$1 AND provider=$2",
      [req.tenantId, provider],
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
       ON CONFLICT (user_id, provider) DO UPDATE SET enabled=$3, credentials=$4, updated_at=NOW()`,
      [req.tenantId, provider, !!enabled, JSON.stringify(merged || {})],
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE a connected panel ────────────────────────────────────────
router.delete("/credentials/:provider", auth, requirePermission("manage_settings"), async (req, res) => {
  try {
    await pool.query("DELETE FROM delivery_credentials WHERE user_id=$1 AND provider=$2", [req.tenantId, req.params.provider]);
    res.json({ success: true });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET live tracking status for one order ─────────────────────────
router.get("/track/:orderId", auth, async (req, res) => {
  try {
    // Employees can only track orders for customers assigned to them —
    // same boundary as the customer list/detail endpoints.
    const vis = isOwner(req) ? { clause: "", params: [] } : { clause: " AND c.assigned_to=$3", params: [req.user.id] };
    const orderRes = await pool.query(
      `SELECT co.tracking_id, co.provider FROM customer_orders co
       JOIN customers c ON c.id=co.customer_id
       WHERE co.id=$1 AND co.user_id=$2${vis.clause}`,
      [req.params.orderId, req.tenantId, ...vis.params],
    );
    const order = orderRes.rows[0];
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (!order.tracking_id) {
      return res.status(400).json({ error: "This order has no tracking ID" });
    }

    // Orders created before multi-provider support have no `provider` of
    // their own — fall back to any one enabled row so a manually-entered
    // tracking ID still works exactly as it did before this feature.
    const credRes = order.provider
      ? await pool.query("SELECT provider, enabled, credentials FROM delivery_credentials WHERE user_id=$1 AND provider=$2", [req.tenantId, order.provider])
      : await pool.query("SELECT provider, enabled, credentials FROM delivery_credentials WHERE user_id=$1 AND enabled=true LIMIT 1", [req.tenantId]);
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

// ── POST manually (re)trigger courier order creation ───────────────
// Safety valve for when the automatic attempt (triggered at the deduct
// stage) failed — e.g. wrong pickup-location name, courier API down — so
// an admin can fix the config and retry without touching the order again.
router.post("/ship/:orderId", auth, requirePermission("manage_customers"), async (req, res) => {
  try {
    const vis = isOwner(req) ? { clause: "", params: [] } : { clause: " AND c.assigned_to=$3", params: [req.user.id] };
    const orderRes = await pool.query(
      `SELECT co.id FROM customer_orders co JOIN customers c ON c.id=co.customer_id
       WHERE co.id=$1 AND co.user_id=$2${vis.clause}`,
      [req.params.orderId, req.tenantId, ...vis.params],
    );
    if (!orderRes.rows[0]) return res.status(404).json({ error: "Order not found" });

    await createCourierShipmentForOrder(req.params.orderId, req.tenantId);
    const fresh = await pool.query("SELECT tracking_id, courier_order_created, courier_error FROM customer_orders WHERE id=$1", [req.params.orderId]);
    res.json(fresh.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
