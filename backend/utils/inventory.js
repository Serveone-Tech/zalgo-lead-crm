const { pool } = require("../db");

// Every order stage for this tenant with its stock_action ('none' | 'deduct'
// | 'restore'). Any number of stages can be 'deduct' or 'restore' — there's
// no single-stage restriction like there is for is_default.
async function getStageStockActions(tenantId) {
  const { rows } = await pool.query(
    "SELECT name, stock_action FROM order_stages WHERE user_id=$1",
    [tenantId],
  );
  return rows;
}

function isDeductStage(stageRows, stageName) {
  return stageRows.some((r) => r.name === stageName && r.stock_action === "deduct");
}

function isRestoreStage(stageRows, stageName) {
  return stageRows.some((r) => r.name === stageName && r.stock_action === "restore");
}

// If no stage anywhere is configured as 'deduct', the feature is effectively
// off — stock draws down immediately at order creation instead (the
// original, simpler behavior), regardless of which stage the order starts on.
function anyDeductStageConfigured(stageRows) {
  return stageRows.some((r) => r.stock_action === "deduct");
}

// Draws down stock for every inventory-linked item on this order, then
// marks the order so this never runs twice in a row (whether triggered at
// creation or on a later stage change) until a restore resets the flag.
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

// The reverse of deductStockForOrder — gives the stock back (e.g. an order
// that was confirmed then got put on hold or cancelled) and clears the
// deducted flag, so a later re-confirmation can deduct it again cleanly.
async function restoreStockForOrder(orderId, tenantId) {
  const { rows: items } = await pool.query(
    "SELECT inventory_item_id, quantity FROM order_items WHERE order_id=$1 AND inventory_item_id IS NOT NULL",
    [orderId],
  );
  for (const item of items) {
    await pool.query(
      "UPDATE inventory_items SET stock_qty = stock_qty + $1, updated_at=NOW() WHERE id=$2 AND user_id=$3",
      [item.quantity, item.inventory_item_id, tenantId],
    );
  }
  await pool.query("UPDATE customer_orders SET inventory_deducted=false WHERE id=$1", [orderId]);
}

module.exports = {
  getStageStockActions,
  isDeductStage,
  isRestoreStage,
  anyDeductStageConfigured,
  deductStockForOrder,
  restoreStockForOrder,
};
