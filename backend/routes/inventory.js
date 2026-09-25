const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { auth, requireSubscription, requirePlanFeature } = require("../middleware/auth");
const { hasPermission, isOwner } = require("../utils/permissions");

// GET /api/inventory — deliberately open to any authenticated tenant member
// (not gated by view_inventory) since this also powers the item dropdown in
// the Order Fulfillment form, which every order-taker needs regardless of
// whether they can see the dedicated Inventory page. Both that picker and
// the Notifications page's low-stock widget genuinely need the whole
// catalog (search-to-select, full low-stock scan) — LIMIT here is a safety
// cap against a truly unbounded query, not real pagination; the Inventory
// management page's own table uses /paged below instead.
router.get("/", auth, requireSubscription, requirePlanFeature("customers"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM inventory_items WHERE user_id=$1 ORDER BY name ASC LIMIT 2000",
      [req.tenantId],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one page of the catalog, for the Inventory management page's table —
// also returns total row count and low-stock count so the page's summary
// numbers stay accurate even though the table itself only holds one page.
router.get("/paged", auth, requireSubscription, requirePlanFeature("customers"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 25));
    const search = (req.query.search || "").trim();
    const params = [req.tenantId];
    let where = "user_id=$1";
    if (search) {
      params.push(`%${search}%`);
      where += ` AND name ILIKE $${params.length}`;
    }
    params.push(pageSize, (page - 1) * pageSize);
    const result = await pool.query(
      `SELECT *, COUNT(*) OVER() AS total_count FROM inventory_items
       WHERE ${where} ORDER BY name ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    const total = result.rows[0]?.total_count ? parseInt(result.rows[0].total_count) : 0;
    const rows = result.rows.map(({ total_count, ...rest }) => rest);
    const lowStock = await pool.query(
      `SELECT COUNT(*) FROM inventory_items ii
       LEFT JOIN user_settings us ON us.user_id = ii.user_id
       WHERE ii.user_id=$1 AND ii.stock_qty <= COALESCE(us.low_stock_threshold, 10)`,
      [req.tenantId],
    );
    res.json({ rows, total, low_stock_count: parseInt(lowStock.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, requireSubscription, requirePlanFeature("customers"), async (req, res) => {
  if (!isOwner(req) && !hasPermission(req, "manage_inventory")) {
    return res.status(403).json({ error: "Permission denied" });
  }
  try {
    const { name, price = 0, stock_qty = 0, weight_kg = 0, hsn_code = "" } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
    const { rows } = await pool.query(
      "INSERT INTO inventory_items (user_id, name, price, stock_qty, weight_kg, hsn_code) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [req.tenantId, name.trim(), parseFloat(price) || 0, parseInt(stock_qty) || 0, parseFloat(weight_kg) || 0, hsn_code.trim()],
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", auth, requireSubscription, requirePlanFeature("customers"), async (req, res) => {
  if (!isOwner(req) && !hasPermission(req, "manage_inventory")) {
    return res.status(403).json({ error: "Permission denied" });
  }
  try {
    const { name, price, stock_qty, weight_kg, hsn_code } = req.body;
    const { rows } = await pool.query(
      `UPDATE inventory_items SET
         name=COALESCE($1, name),
         price=COALESCE($2, price),
         stock_qty=COALESCE($3, stock_qty),
         weight_kg=COALESCE($4, weight_kg),
         hsn_code=COALESCE($5, hsn_code),
         updated_at=NOW()
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [
        name?.trim() || null,
        price !== undefined && price !== "" ? parseFloat(price) : null,
        stock_qty !== undefined && stock_qty !== "" ? parseInt(stock_qty) : null,
        weight_kg !== undefined && weight_kg !== "" ? parseFloat(weight_kg) : null,
        hsn_code !== undefined ? hsn_code.trim() : null,
        req.params.id,
        req.tenantId,
      ],
    );
    if (!rows[0]) return res.status(404).json({ error: "Item not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// No delete-guard needed — order_items.inventory_item_id is ON DELETE SET
// NULL, so past orders keep their name/price snapshot even if the catalog
// entry they were picked from is later removed.
router.delete("/:id", auth, requireSubscription, requirePlanFeature("customers"), async (req, res) => {
  if (!isOwner(req) && !hasPermission(req, "delete_inventory")) {
    return res.status(403).json({ error: "Permission denied" });
  }
  try {
    await pool.query("DELETE FROM inventory_items WHERE id=$1 AND user_id=$2", [req.params.id, req.tenantId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
