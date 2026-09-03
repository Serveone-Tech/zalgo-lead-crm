const express = require("express");
const { pool } = require("../db");
const { auth, requirePermission, requireSubscription, requirePlanFeature } = require("../middleware/auth");
const { fireTrigger } = require("../utils/automation-trigger");
const { isOwner } = require("../utils/permissions");
const { getStageStockActions, isDeductStage, isRestoreStage, isDeliveredStage, deductStockForOrder, restoreStockForOrder } = require("../utils/inventory");
const { createCourierShipmentForOrder } = require("../utils/courier-shipment");
const { PROVIDERS } = require("../utils/delivery-providers");
const ExcelJS = require("exceljs");
const upload = require("../middleware/upload");

const router = express.Router();

// Employees only see customers assigned to them; owners/superadmins see all.
// Unlike leads there's no "view all" override permission for this — the
// ask was a strict admin-sees-all / employee-sees-own-assigned split.
const visibilityClause = (req, paramIndex) => {
  if (isOwner(req)) return { clause: "", params: [] };
  return { clause: ` AND c.assigned_to=$${paramIndex}`, params: [req.user.id] };
};

// GET all customers
router.get("/", auth, requireSubscription, requirePlanFeature("customers"), requirePermission("view_customers"), async (req, res) => {
  try {
    // Collected/due figures now come from each customer's Orders (Prepaid is
    // collected in full at fulfillment; COD tracks advance_paid vs balance)
    // instead of the old standalone payments ledger.
    const vis = visibilityClause(req, 2);
    const result = await pool.query(
      `SELECT c.*, u.name AS assigned_to_name,
        COALESCE(SUM(co.advance_paid),0) AS total_collected,
        COALESCE(SUM(co.amount),0) AS total_order_value,
        -- Cancelled/returned orders (stage flagged excludes_dues) no longer
        -- count toward what's still owed — the sale isn't happening.
        COALESCE(SUM(CASE WHEN co.payment_type='cod' AND NOT COALESCE(os_due.excludes_dues,false) THEN co.amount - COALESCE(co.advance_paid,0) ELSE 0 END),0) AS total_due_amount,
        (SELECT MIN(co2.next_due_date) FROM customer_orders co2
         LEFT JOIN order_stages os2 ON os2.user_id=co2.user_id AND os2.name=co2.stage
         WHERE co2.customer_id=c.id AND co2.payment_type='cod' AND co2.deleted_at IS NULL
           AND NOT COALESCE(os2.excludes_dues,false)
           AND (co2.amount - COALESCE(co2.advance_paid,0)) > 0) AS next_due_date,
        -- Whichever is more recent — the customer being added, or their most
        -- recent order — is what "just happened" for this customer, and
        -- what the list is sorted by so new activity always floats to top.
        GREATEST(c.created_at, COALESCE(MAX(co.created_at), c.created_at)) AS last_activity_at,
        (SELECT co3.id FROM customer_orders co3
         WHERE co3.customer_id=c.id AND co3.deleted_at IS NULL
         ORDER BY co3.created_at DESC LIMIT 1) AS latest_order_id,
        (SELECT co3.stage FROM customer_orders co3
         WHERE co3.customer_id=c.id AND co3.deleted_at IS NULL
         ORDER BY co3.created_at DESC LIMIT 1) AS latest_order_stage,
        (SELECT co3.amount FROM customer_orders co3
         WHERE co3.customer_id=c.id AND co3.deleted_at IS NULL
         ORDER BY co3.created_at DESC LIMIT 1) AS latest_order_amount,
        (SELECT co3.payment_type FROM customer_orders co3
         WHERE co3.customer_id=c.id AND co3.deleted_at IS NULL
         ORDER BY co3.created_at DESC LIMIT 1) AS latest_order_payment_type,
        (SELECT co3.tracking_id FROM customer_orders co3
         WHERE co3.customer_id=c.id AND co3.deleted_at IS NULL
         ORDER BY co3.created_at DESC LIMIT 1) AS latest_order_tracking_id,
        (SELECT COUNT(*) FROM customer_orders co4
         WHERE co4.customer_id=c.id AND co4.deleted_at IS NULL) AS order_count
       FROM customers c
       LEFT JOIN customer_orders co ON co.customer_id=c.id AND co.deleted_at IS NULL
       LEFT JOIN order_stages os_due ON os_due.user_id=co.user_id AND os_due.name=co.stage
       LEFT JOIN users u ON u.id=c.assigned_to
       WHERE c.user_id=$1${vis.clause} GROUP BY c.id, u.name ORDER BY last_activity_at DESC`,
      [req.tenantId, ...vis.params],
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET due/upcoming — BEFORE /:id. Pulls unpaid balances from COD orders.
router.get("/due/upcoming", auth, requireSubscription, requirePlanFeature("customers"), requirePermission("view_customers"), async (req, res) => {
  try {
    const vis = visibilityClause(req, 2);
    const result = await pool.query(
      `SELECT co.id, co.customer_id, c.name AS customer_name, c.phone, c.email,
         co.next_due_date AS due_date, (co.amount - COALESCE(co.advance_paid,0)) AS amount
       FROM customer_orders co JOIN customers c ON c.id=co.customer_id
       LEFT JOIN order_stages os ON os.user_id=co.user_id AND os.name=co.stage
       WHERE c.user_id=$1 AND co.deleted_at IS NULL AND co.payment_type='cod' AND NOT COALESCE(os.excludes_dues,false) AND (co.amount - COALESCE(co.advance_paid,0)) > 0${vis.clause}
       ORDER BY co.next_due_date ASC NULLS LAST LIMIT 30`,
      [req.tenantId, ...vis.params],
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET Sales Report (Excel) — delivered orders only, one row per item.
// BEFORE /:id so "reports" never gets swallowed as an :id param. "Delivered"
// means the order's current stage is flagged is_delivered in Settings →
// Order Stages (any number of stages can carry that flag, same pattern as
// excludes_dues) — not a hardcoded stage name, since tenants rename/retype
// their own stages (one tenant's is literally "DELIVERDED", a typo).
router.get("/reports/sales-excel", auth, requireSubscription, requirePlanFeature("customers"), requirePermission("view_customers"), async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from and to dates are required" });

    const vis = visibilityClause(req, 4);
    // One row per ORDER, not per item — items/HSN/quantity are aggregated
    // into comma-separated lists (still positionally aligned with each
    // other) so a 3-item order doesn't repeat its full total 3 times.
    // Employee = the customer's assigned employee, not who logged the
    // order — that's what "Employee" is meant to answer here.
    const result = await pool.query(
      `SELECT
         COALESCE(co.delivered_at, co.created_at) AS delivered_date,
         c.name AS customer_name,
         co.city, co.pincode, co.state,
         items_agg.item_names,
         items_agg.hsn_codes,
         items_agg.quantities,
         co.payment_type,
         co.amount AS total_amount,
         emp.name AS employee_name,
         co.order_type,
         co.tracking_id,
         co.provider
       FROM customer_orders co
       JOIN customers c ON c.id = co.customer_id
       JOIN order_stages os ON os.user_id = co.user_id AND os.name = co.stage AND os.is_delivered = true
       LEFT JOIN users emp ON emp.id = c.assigned_to
       LEFT JOIN (
         SELECT oi.order_id,
                STRING_AGG(oi.name, ', ' ORDER BY oi.id) AS item_names,
                STRING_AGG(NULLIF(i.hsn_code, ''), ', ' ORDER BY oi.id) AS hsn_codes,
                STRING_AGG(oi.quantity::text, ', ' ORDER BY oi.id) AS quantities
         FROM order_items oi
         LEFT JOIN inventory_items i ON i.id = oi.inventory_item_id
         GROUP BY oi.order_id
       ) items_agg ON items_agg.order_id = co.id
       WHERE co.user_id=$1 AND co.deleted_at IS NULL
         AND COALESCE(co.delivered_at, co.created_at) >= $2
         AND COALESCE(co.delivered_at, co.created_at) < ($3::date + INTERVAL '1 day')${vis.clause}
       ORDER BY delivered_date DESC, co.id`,
      [req.tenantId, from, to, ...vis.params],
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");
    sheet.columns = [
      { header: "Delivered Date", key: "delivered_date", width: 18 },
      { header: "Customer Name", key: "customer_name", width: 24 },
      { header: "City", key: "city", width: 16 },
      { header: "Pincode", key: "pincode", width: 10 },
      { header: "State", key: "state", width: 16 },
      { header: "HSN Code", key: "hsn_code", width: 16 },
      { header: "Item", key: "item_name", width: 32 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "COD", key: "cod", width: 10 },
      { header: "Total Amount", key: "total_amount", width: 14 },
      { header: "Employee", key: "employee_name", width: 20 },
      { header: "Order Type", key: "order_type", width: 12 },
      { header: "Tracking ID", key: "tracking_id", width: 20 },
      { header: "Courier", key: "courier", width: 16 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const row of result.rows) {
      sheet.addRow({
        delivered_date: row.delivered_date ? row.delivered_date.split("T")[0] : "",
        customer_name: row.customer_name,
        city: row.city || "",
        pincode: row.pincode || "",
        state: row.state || "",
        hsn_code: row.hsn_codes || "",
        item_name: row.item_names || "",
        quantity: row.quantities || "",
        cod: row.payment_type === "cod" ? "COD" : "Prepaid",
        total_amount: parseFloat(row.total_amount) || 0,
        employee_name: row.employee_name || "",
        order_type: row.order_type || "FRESH",
        tracking_id: row.tracking_id || "",
        courier: PROVIDERS[row.provider]?.label || row.provider || "",
      });
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="sales-report-${from}-to-${to}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error("Sales report error:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Trash — owner-only, and BEFORE /:id so "trash" never gets swallowed as
// an :id param. Orders deleted below land here instead of being destroyed
// outright; only the owner can see this list or permanently remove
// something from it.
router.get("/trash/orders", auth, requireSubscription, requirePlanFeature("customers"), async (req, res) => {
  if (!isOwner(req)) return res.status(403).json({ error: "Permission denied" });
  try {
    const orders = await pool.query(
      `SELECT co.*, c.name AS customer_name
       FROM customer_orders co JOIN customers c ON c.id=co.customer_id
       WHERE c.user_id=$1 AND co.deleted_at IS NOT NULL
       ORDER BY co.deleted_at DESC`,
      [req.tenantId],
    );
    const orderIds = orders.rows.map((o) => o.id);
    let items = [];
    if (orderIds.length > 0) {
      const itemsRes = await pool.query(
        "SELECT * FROM order_items WHERE order_id = ANY($1::int[])",
        [orderIds],
      );
      items = itemsRes.rows;
    }
    res.json(orders.rows.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) })));
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/trash/orders/:orderId", auth, async (req, res) => {
  if (!isOwner(req)) return res.status(403).json({ error: "Permission denied" });
  try {
    const result = await pool.query(
      `DELETE FROM customer_orders co USING customers c
       WHERE co.id=$1 AND co.customer_id=c.id AND c.user_id=$2 AND co.deleted_at IS NOT NULL
       RETURNING co.id`,
      [req.params.orderId, req.tenantId],
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Order not found in trash" });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/trash/orders/:orderId/restore", auth, async (req, res) => {
  if (!isOwner(req)) return res.status(403).json({ error: "Permission denied" });
  try {
    const result = await pool.query(
      `UPDATE customer_orders co SET deleted_at=NULL
       FROM customers c
       WHERE co.id=$1 AND co.customer_id=c.id AND c.user_id=$2 AND co.deleted_at IS NOT NULL
       RETURNING co.id`,
      [req.params.orderId, req.tenantId],
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Order not found in trash" });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET single customer
router.get("/:id", auth, requireSubscription, requirePlanFeature("customers"), requirePermission("view_customers"), async (req, res) => {
  try {
    const vis = visibilityClause(req, 3);
    const [cust, orders] = await Promise.all([
      pool.query(
        `SELECT c.*, u.name AS assigned_to_name FROM customers c
         LEFT JOIN users u ON u.id=c.assigned_to
         WHERE c.id=$1 AND c.user_id=$2${vis.clause}`,
        [req.params.id, req.tenantId, ...vis.params],
      ),
      pool.query(
        "SELECT * FROM customer_orders WHERE customer_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC",
        [req.params.id],
      ),
    ]);
    if (!cust.rows[0]) return res.status(404).json({ error: "Not found" });

    const orderIds = orders.rows.map((o) => o.id);
    let items = [];
    if (orderIds.length > 0) {
      const itemsRes = await pool.query(
        "SELECT * FROM order_items WHERE order_id = ANY($1::int[])",
        [orderIds],
      );
      items = itemsRes.rows;
    }
    const ordersWithItems = orders.rows.map((o) => ({
      ...o,
      items: items.filter((i) => i.order_id === o.id),
    }));

    res.json({ ...cust.rows[0], orders: ordersWithItems });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST create customer
router.post("/", auth, requireSubscription, requirePlanFeature("customers"), requirePermission("manage_customers"), async (req, res) => {
  const { name, phone, email, platform, platform_link, total_fee, notes } =
    req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  try {
    // Enforce max_customers plan limit (-1 = unlimited)
    const maxCust = req.subscription?.max_customers ?? -1;
    if (maxCust > 0) {
      const count = await pool.query("SELECT COUNT(*) FROM customers WHERE user_id=$1", [req.tenantId]);
      if (parseInt(count.rows[0].count) >= maxCust) {
        return res.status(403).json({
          error: "CUSTOMER_LIMIT_REACHED",
          message: `Your plan allows a maximum of ${maxCust} customers. Please upgrade to add more.`,
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO customers (user_id, name, phone, email, platform, platform_link, total_fee, amount_paid, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8) RETURNING *`,
      [
        req.tenantId,
        name,
        phone || "",
        email || "",
        platform || "",
        platform_link || "",
        parseFloat(total_fee) || 0,
        notes || "",
      ],
    );
    const customer = result.rows[0];

    // ✅ Fire lead_converted trigger
    fireTrigger("lead_converted", req.tenantId, {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      amount: customer.total_fee,
    }).catch(() => {});

    res.json(customer);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update customer
router.put("/:id", auth, requirePermission("manage_customers"), async (req, res) => {
  const {
    name,
    phone,
    email,
    platform,
    platform_link,
    total_fee,
    notes,
    status,
    address,
    pincode,
    assigned_to,
  } = req.body;
  try {
    const vis = visibilityClause(req, 14);
    // assigned_to only gets touched when the caller actually sent it — the
    // main Edit Customer form doesn't include an assignment field at all, so
    // treating a missing key as "unassign" was silently wiping out whatever
    // assignment a lead had carried over on every unrelated detail edit.
    const touchAssignment = assigned_to !== undefined;
    const result = await pool.query(
      `UPDATE customers c SET name=$1,phone=$2,email=$3,platform=$4,platform_link=$5,
       total_fee=$6,notes=$7,status=$8,address=$9,pincode=$10,
       assigned_to=CASE WHEN $11 THEN $12::int ELSE assigned_to END,
       updated_at=NOW()
       WHERE id=$13 AND user_id=$14${vis.clause} RETURNING *`,
      [
        name,
        phone || "",
        email || "",
        platform || "",
        platform_link || "",
        parseFloat(total_fee) || 0,
        notes || "",
        status || "Active",
        address || "",
        pincode || "",
        touchAssignment,
        touchAssignment ? assigned_to || null : null,
        req.params.id,
        req.tenantId,
        ...vis.params,
      ],
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE customer
router.delete("/:id", auth, requirePermission("delete_customers"), async (req, res) => {
  try {
    const vis = visibilityClause(req, 3);
    await pool.query(`DELETE FROM customers c WHERE id=$1 AND user_id=$2${vis.clause}`, [
      req.params.id,
      req.tenantId,
      ...vis.params,
    ]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST bulk delete — same permanent delete as the single-customer route
// above (no trash/undo for customers themselves, only orders have that),
// just applied to a whole list-page selection at once. POST (not DELETE)
// so the id list can travel safely in the body.
router.post("/bulk-delete", auth, requirePermission("delete_customers"), async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No customers selected" });
  }
  try {
    const vis = visibilityClause(req, 3);
    const result = await pool.query(
      `DELETE FROM customers c WHERE id=ANY($1) AND user_id=$2${vis.clause} RETURNING id`,
      [ids, req.tenantId, ...vis.params],
    );
    res.json({ success: true, deleted: result.rows.length });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT order — the full Order Fulfillment record (customer name/email/alt
// phone/address, order amount/payment/tracking, items) stays editable after
// submission, since none of it is reliably final at the moment of first
// fulfillment (a courier's tracking number, a COD collection, even a typo'd
// address). Only the customer's primary phone is intentionally excluded —
// that's the identity key the order was created against.
router.put("/:id/orders/:orderId", auth, requirePermission("manage_customers"), async (req, res) => {
  const {
    name,
    email,
    alternate_phone,
    address,
    city,
    state,
    pincode,
    amount,
    payment_type,
    advance_paid,
    next_due_date,
    tracking_id,
    provider,
    order_type,
    stage,
    notes,
    items,
    package_weight_kg,
    package_length_cm,
    package_width_cm,
    package_height_cm,
  } = req.body;
  try {
    const vis = visibilityClause(req, 3);
    const owns = await pool.query(
      `SELECT id FROM customers c WHERE id=$1 AND user_id=$2${vis.clause}`,
      [req.params.id, req.tenantId, ...vis.params],
    );
    if (!owns.rows[0]) return res.status(404).json({ error: "Not found" });

    await pool.query(
      `UPDATE customers SET
         name=COALESCE($1, name),
         email=COALESCE($2, email),
         alternate_phone=COALESCE($3, alternate_phone),
         address=COALESCE($4, address),
         pincode=COALESCE($5, pincode),
         updated_at=NOW()
       WHERE id=$6 AND user_id=$7`,
      [
        name || null,
        email !== undefined ? email : null,
        alternate_phone !== undefined ? alternate_phone : null,
        address !== undefined ? address : null,
        pincode !== undefined ? pincode : null,
        req.params.id,
        req.tenantId,
      ],
    );

    const result = await pool.query(
      `UPDATE customer_orders SET
         address=COALESCE($1, address),
         pincode=COALESCE($2, pincode),
         amount=COALESCE($3, amount),
         payment_type=COALESCE($4, payment_type),
         advance_paid=COALESCE($5, advance_paid),
         next_due_date=COALESCE($6, next_due_date),
         tracking_id=COALESCE($7, tracking_id),
         provider=COALESCE($8, provider),
         stage=COALESCE($9, stage),
         notes=COALESCE($10, notes),
         city=COALESCE($11, city),
         state=COALESCE($12, state),
         package_weight_kg=COALESCE($13, package_weight_kg),
         package_length_cm=COALESCE($14, package_length_cm),
         package_width_cm=COALESCE($15, package_width_cm),
         package_height_cm=COALESCE($16, package_height_cm),
         order_type=COALESCE($17, order_type)
       WHERE id=$18 AND customer_id=$19 AND deleted_at IS NULL RETURNING *`,
      [
        address !== undefined ? address : null,
        pincode !== undefined ? pincode : null,
        amount !== undefined && amount !== "" ? parseFloat(amount) : null,
        payment_type === "cod" || payment_type === "prepaid" ? payment_type : null,
        advance_paid !== undefined && advance_paid !== "" ? parseFloat(advance_paid) : null,
        next_due_date !== undefined ? (next_due_date || null) : null,
        tracking_id !== undefined ? tracking_id : null,
        provider !== undefined ? provider : null,
        stage !== undefined ? stage : null,
        notes !== undefined ? notes : null,
        city !== undefined ? city : null,
        state !== undefined ? state : null,
        package_weight_kg !== undefined && package_weight_kg !== "" ? parseFloat(package_weight_kg) : null,
        package_length_cm !== undefined && package_length_cm !== "" ? parseFloat(package_length_cm) : null,
        package_width_cm !== undefined && package_width_cm !== "" ? parseFloat(package_width_cm) : null,
        package_height_cm !== undefined && package_height_cm !== "" ? parseFloat(package_height_cm) : null,
        order_type === "FRESH" || order_type === "REPEAT" ? order_type : null,
        req.params.orderId,
        req.params.id,
      ],
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Order not found" });

    // Items are a full replace-set rather than a diff — simplest correct
    // behavior for a form that just resubmits its whole items list. Note:
    // unlike order creation, editing an order's items does NOT adjust
    // inventory stock — reconciling a diff against whatever stock changes
    // may have happened since is more complexity than this needs right now.
    if (Array.isArray(items)) {
      await pool.query("DELETE FROM order_items WHERE order_id=$1", [req.params.orderId]);
      const itemRows = items.filter((i) => i?.name?.trim());
      for (const item of itemRows) {
        await pool.query(
          "INSERT INTO order_items (order_id, inventory_item_id, name, quantity, price) VALUES ($1,$2,$3,$4,$5)",
          [
            req.params.orderId,
            item.inventory_item_id ? parseInt(item.inventory_item_id) : null,
            item.name.trim(),
            parseInt(item.quantity) || 1,
            parseFloat(item.price) || 0,
          ],
        );
      }
    }

    // A stage change can trigger stock moving either direction:
    //  - into a 'deduct' stage (e.g. Confirmed) draws down stock, but only
    //    if it hasn't already been drawn down for this order.
    //  - into a 'restore' stage (e.g. Hold, Cancelled) gives it back, but
    //    only if it was actually deducted in the first place — moving an
    //    order that was never confirmed straight to Cancelled has nothing
    //    to restore.
    // The inventory_deducted flag is what makes both directions safe to run
    // repeatedly as the stage flips back and forth.
    let shipped = false;
    let stageRows = null;
    if (stage !== undefined) {
      stageRows = await getStageStockActions(req.tenantId);
      if (!result.rows[0].inventory_deducted && isDeductStage(stageRows, stage)) {
        await deductStockForOrder(req.params.orderId, req.tenantId);
        result.rows[0].inventory_deducted = true;
        // Same stage transition that draws down stock is what ships the
        // order — create it at whichever courier was picked (no-op if none).
        await createCourierShipmentForOrder(req.params.orderId, req.tenantId);
        shipped = true;
      } else if (result.rows[0].inventory_deducted && isRestoreStage(stageRows, stage)) {
        await restoreStockForOrder(req.params.orderId, req.tenantId);
        result.rows[0].inventory_deducted = false;
      }

      // Set once, the first time this order reaches a delivered stage — the
      // Sales Report filters/sorts by this. Guarded so flipping back and
      // forth between stages later doesn't keep resetting the original date.
      if (isDeliveredStage(stageRows, stage) && !result.rows[0].delivered_at) {
        await pool.query("UPDATE customer_orders SET delivered_at=NOW() WHERE id=$1", [req.params.orderId]);
        result.rows[0].delivered_at = new Date().toISOString();
      }
    }

    // Admin picked/changed the Delivery Provider on an order that hasn't
    // shipped yet — e.g. fixing a wrong choice after a failed attempt.
    // Without this, changing the dropdown only updated the `provider`
    // column and left the *previous* provider's courier_error sitting
    // there unchanged, which read as if the retry had already happened.
    // Only auto-ship once the order's stage is actually confirmed (a
    // 'deduct' stage) — picking a courier while still on an unconfirmed
    // stage (e.g. the default Processing) just saves the choice for later.
    if (!shipped && provider !== undefined && !result.rows[0].courier_order_created) {
      if (stageRows === null) stageRows = await getStageStockActions(req.tenantId);
      if (isDeductStage(stageRows, result.rows[0].stage)) {
        await pool.query("UPDATE customer_orders SET courier_error='' WHERE id=$1", [req.params.orderId]);
        if (provider) await createCourierShipmentForOrder(req.params.orderId, req.tenantId);
        shipped = true;
      }
    }

    // createCourierShipmentForOrder wrote tracking_id/courier_error directly
    // to the row — re-fetch so the response reflects it instead of the
    // stale in-memory copy from before that call.
    if (shipped) {
      const fresh = await pool.query("SELECT * FROM customer_orders WHERE id=$1", [req.params.orderId]);
      if (fresh.rows[0]) result.rows[0] = fresh.rows[0];
    }

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Optional proof file attached from the fulfillment form — an advance
// payment screenshot, a report, whatever the tenant wants on record for
// this order. Re-uploading replaces whatever was attached before.
router.post("/:id/orders/:orderId/attachment", auth, requirePermission("manage_customers"), (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
      const vis = visibilityClause(req, 3);
      const owns = await pool.query(
        `SELECT id FROM customers c WHERE id=$1 AND user_id=$2${vis.clause}`,
        [req.params.id, req.tenantId, ...vis.params],
      );
      if (!owns.rows[0]) return res.status(404).json({ error: "Not found" });

      const attachmentPath = `/uploads/order-attachments/${req.file.filename}`;
      const result = await pool.query(
        `UPDATE customer_orders SET attachment_path=$1, attachment_name=$2
         WHERE id=$3 AND customer_id=$4 AND deleted_at IS NULL RETURNING id, attachment_path, attachment_name`,
        [attachmentPath, req.file.originalname, req.params.orderId, req.params.id],
      );
      if (!result.rows[0]) return res.status(404).json({ error: "Order not found" });
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });
});

// DELETE order — soft delete only. An employee with manage_customers can
// remove a mistaken/duplicate order from the customer's view, but the row
// itself moves to Trash rather than being destroyed — only the owner can
// permanently delete it from there (see /trash/orders below).
router.delete("/:id/orders/:orderId", auth, requirePermission("manage_customers"), async (req, res) => {
  try {
    const vis = visibilityClause(req, 3);
    const owns = await pool.query(
      `SELECT id FROM customers c WHERE id=$1 AND user_id=$2${vis.clause}`,
      [req.params.id, req.tenantId, ...vis.params],
    );
    if (!owns.rows[0]) return res.status(404).json({ error: "Not found" });

    const result = await pool.query(
      "UPDATE customer_orders SET deleted_at=NOW() WHERE id=$1 AND customer_id=$2 AND deleted_at IS NULL RETURNING id",
      [req.params.orderId, req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Order not found" });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
