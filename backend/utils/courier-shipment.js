const { pool } = require("../db");
const { PROVIDERS } = require("./delivery-providers");

// Creates the shipment at whichever courier the order's `provider` names,
// and drops the AWB straight into the order's existing `tracking_id` field
// so the current tracking feature keeps working unchanged. Called from the
// exact same trigger point as stock deduction (see leads.js/customers.js) —
// never throws, since a courier API hiccup must not block saving the order;
// failures land in `courier_error` instead so they're visible and retryable
// (see POST /delivery/ship/:orderId).
async function createCourierShipmentForOrder(orderId, tenantId) {
  try {
    const orderRes = await pool.query(
      `SELECT co.*, c.name AS customer_name, c.phone, c.email, c.alternate_phone
       FROM customer_orders co JOIN customers c ON c.id = co.customer_id
       WHERE co.id=$1 AND co.user_id=$2`,
      [orderId, tenantId],
    );
    const order = orderRes.rows[0];
    if (!order) return;
    if (!order.provider || order.provider === "generic" || order.courier_order_created) return;

    const provider = PROVIDERS[order.provider];
    if (!provider || !provider.createOrder) return;

    const credRes = await pool.query(
      "SELECT enabled, credentials FROM delivery_credentials WHERE user_id=$1 AND provider=$2",
      [tenantId, order.provider],
    );
    const cred = credRes.rows[0];
    if (!cred || !cred.enabled) return;

    const [itemsRes, settingsRes] = await Promise.all([
      pool.query(
        `SELECT oi.quantity, oi.price, oi.name, i.weight_kg
         FROM order_items oi LEFT JOIN inventory_items i ON i.id = oi.inventory_item_id
         WHERE oi.order_id=$1`,
        [orderId],
      ),
      pool.query("SELECT default_item_weight_kg FROM user_settings WHERE user_id=$1", [tenantId]),
    ]);
    const defaultWeight = parseFloat(settingsRes.rows[0]?.default_item_weight_kg) || 0.5;
    const items = itemsRes.rows;
    const computedWeightKg = items.reduce((sum, it) => {
      const perUnit = it.weight_kg !== null && it.weight_kg !== undefined ? parseFloat(it.weight_kg) : defaultWeight;
      return sum + perUnit * (parseInt(it.quantity) || 1);
    }, 0) || defaultWeight;
    // The admin can override weight/dimensions per order (Order Fulfillment
    // form) when the auto-computed default (item weights, or a fixed box
    // size) doesn't match the actual physical parcel being shipped.
    const weightKg = order.package_weight_kg !== null ? parseFloat(order.package_weight_kg) : computedWeightKg;
    const lengthCm = order.package_length_cm !== null ? parseFloat(order.package_length_cm) : 10;
    const widthCm = order.package_width_cm !== null ? parseFloat(order.package_width_cm) : 10;
    const heightCm = order.package_height_cm !== null ? parseFloat(order.package_height_cm) : 10;

    const isCod = order.payment_type === "cod";
    const payload = {
      orderId: order.id,
      customerName: order.customer_name,
      phone: order.phone,
      alternatePhone: order.alternate_phone,
      email: order.email,
      address: order.address,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      paymentType: order.payment_type,
      codAmount: isCod ? parseFloat(order.amount) - parseFloat(order.advance_paid || 0) : 0,
      totalAmount: parseFloat(order.amount) || 0,
      weightKg,
      lengthCm,
      widthCm,
      heightCm,
      items: items.map((it) => ({ name: it.name, quantity: it.quantity, price: it.price })),
    };

    const { awb, note } = await provider.createOrder(cred.credentials || {}, payload);
    if (awb) {
      await pool.query(
        "UPDATE customer_orders SET tracking_id=$1, courier_order_created=true, courier_error='' WHERE id=$2",
        [awb, orderId],
      );
    } else {
      // Shipment exists at the courier but no AWB yet — don't mark
      // courier_order_created so a retry can pick up where this left off,
      // but surface the note so it's not silent.
      await pool.query("UPDATE customer_orders SET courier_error=$1 WHERE id=$2", [note || "Shipment created but no AWB assigned yet.", orderId]);
    }
  } catch (e) {
    console.error("Courier shipment creation failed:", e.message);
    await pool
      .query("UPDATE customer_orders SET courier_error=$1 WHERE id=$2", [e.message || "Courier shipment creation failed", orderId])
      .catch(() => {});
  }
}

module.exports = { createCourierShipmentForOrder };
