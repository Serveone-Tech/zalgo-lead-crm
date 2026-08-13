const { pool } = require("../db");

// The tenant's single configured "deduct stock here" order stage, or null
// if none is set — in which case stock is drawn down immediately at order
// creation instead (see routes/leads.js fulfill-order).
async function getDeductStageName(tenantId) {
  const { rows } = await pool.query(
    "SELECT name FROM order_stages WHERE user_id=$1 AND deduct_inventory=true LIMIT 1",
    [tenantId],
  );
  return rows[0]?.name || null;
}

// Draws down stock for every inventory-linked item on this order, then
// marks the order so this never runs twice for the same order (whether
// triggered at creation or on a later stage change).
async function deductStockForOrder(orderId, tenantId) {
  const { rows: items } = await pool.query(
    "SELECT inventory_item_id, quantity FROM order_items WHERE order_id=$1 AND inventory_item_id IS NOT NULL",
    [orderId],
  );
  for (const item of items) {
    await pool.query(
      "UPDATE inventory_items SET stock_qty = stock_qty - $1, updated_at=NOW() WHERE id=$2 AND user_id=$3",
      [item.quantity, item.inventory_item_id, tenantId],
    );
  }
  await pool.query("UPDATE customer_orders SET inventory_deducted=true WHERE id=$1", [orderId]);
}

module.exports = { getDeductStageName, deductStockForOrder };
