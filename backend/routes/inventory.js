const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { auth } = require("../middleware/auth");
const { hasPermission, isOwner } = require("../utils/permissions");

// GET /api/inventory — deliberately open to any authenticated tenant member
// (not gated by view_inventory) since this also powers the item dropdown in
// the Order Fulfillment form, which every order-taker needs regardless of
// whether they can see the dedicated Inventory page.
router.get("/", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM inventory_items WHERE user_id=$1 ORDER BY name ASC",
      [req.tenantId],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  if (!isOwner(req) && !hasPermission(req, "manage_inventory")) {
    return res.status(403).json({ error: "Permission denied" });
  }
  try {
    const { name, price = 0, stock_qty = 0, weight_kg = 0 } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
    const { rows } = await pool.query(
      "INSERT INTO inventory_items (user_id, name, price, stock_qty, weight_kg) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [req.tenantId, name.trim(), parseFloat(price) || 0, parseInt(stock_qty) || 0, parseFloat(weight_kg) || 0],
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", auth, async (req, res) => {
  if (!isOwner(req) && !hasPermission(req, "manage_inventory")) {
    return res.status(403).json({ error: "Permission denied" });
  }
  try {
    const { name, price, stock_qty, weight_kg } = req.body;
    const { rows } = await pool.query(
      `UPDATE inventory_items SET
         name=COALESCE($1, name),
         price=COALESCE($2, price),
         stock_qty=COALESCE($3, stock_qty),
         weight_kg=COALESCE($4, weight_kg),
         updated_at=NOW()
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [
        name?.trim() || null,
        price !== undefined && price !== "" ? parseFloat(price) : null,
        stock_qty !== undefined && stock_qty !== "" ? parseInt(stock_qty) : null,
        weight_kg !== undefined && weight_kg !== "" ? parseFloat(weight_kg) : null,
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
router.delete("/:id", auth, async (req, res) => {
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
