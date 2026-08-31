"use client";
import { useState, useEffect } from "react";
import api from "../lib/api";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

// Handles both creating an order (pass `lead`) and editing an existing one
// (pass `order` + `customer`) — same field set either way. Only the primary
// phone number stays locked/read-only in both modes: it's the identity key
// the order was created against, so it isn't something this form changes.
export default function OrderFulfillmentModal({ lead, order, customer, onClose, onSave }) {
  const isEdit = !!order;
  const phone = customer?.phone || lead?.phone || "";
  const [form, setForm] = useState({
    name: customer?.name || lead?.name || "",
    email: customer?.email || lead?.email || "",
    alternate_phone: customer?.alternate_phone || "",
    address: order?.address || customer?.address || "",
    city: order?.city || "",
    state: order?.state || "",
    pincode: order?.pincode || customer?.pincode || "",
    amount: order?.amount || "",
    payment_type: order?.payment_type || "prepaid",
    order_type: order?.order_type || "FRESH",
    advance_paid: order?.advance_paid || "",
    next_due_date: order?.next_due_date ? order.next_due_date.split("T")[0] : "",
    tracking_id: order?.tracking_id || "",
    provider: order?.provider || "",
    package_weight_kg: order?.package_weight_kg || "",
    package_length_cm: order?.package_length_cm || "",
    package_width_cm: order?.package_width_cm || "",
    package_height_cm: order?.package_height_cm || "",
    stage: order?.stage || "",
    notes: order?.notes || "",
  });
  const [items, setItems] = useState(
    order?.items?.length > 0
      ? order.items.map((i) => ({
          inventory_item_id: i.inventory_item_id || "",
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        }))
      : [{ inventory_item_id: "", name: "", quantity: 1, price: "" }],
  );
  const [attachmentFile, setAttachmentFile] = useState(null);
  const existingAttachment = { path: order?.attachment_path || "", name: order?.attachment_name || "" };
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stages, setStages] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [deliveryProviders, setDeliveryProviders] = useState([]);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [defaultItemWeightKg, setDefaultItemWeightKg] = useState(0.5);
  // Whether the Discounted Price has been hand-edited — until it is, it
  // auto-tracks the items total. An existing order's saved amount already
  // reflects a deliberate (possibly discounted) figure, so edit mode starts
  // "touched" to avoid silently overwriting it the moment items load.
  const [amountTouched, setAmountTouched] = useState(isEdit);

  useEffect(() => {
    api
      .get("/order-stages")
      .then((r) => {
        setStages(r.data);
        // Fresh orders start on whichever stage the admin marked as default,
        // falling back to the first configured stage if none is marked.
        if (!isEdit && r.data.length > 0) {
          const defaultStage = r.data.find((s) => s.is_default) || r.data[0];
          setForm((f) => (f.stage ? f : { ...f, stage: defaultStage.name }));
        }
      })
      .catch(() => {});
    api.get("/inventory").then((r) => setInventory(r.data)).catch(() => {});
    api
      .get("/settings")
      .then((r) => setDefaultItemWeightKg(parseFloat(r.data.default_item_weight_kg) || 0.5))
      .catch(() => {});
    // Only providers the tenant has actually connected+enabled and that
    // support auto-shipping are offered here — a "generic" link-out
    // provider has no createOrder, so it's excluded (AWB stays manual).
    Promise.all([
      api.get("/delivery/providers").catch(() => ({ data: [] })),
      api.get("/delivery/credentials").catch(() => ({ data: [] })),
    ]).then(([registry, configured]) => {
      const enabled = Array.isArray(configured.data) ? configured.data.filter((d) => d.enabled) : [];
      const merged = enabled
        .map((cfg) => registry.data.find((p) => p.id === cfg.provider))
        .filter((p) => p && p.supportsCreateOrder);
      setDeliveryProviders(merged);
    });
    // An older order edited before City/State existed has a pincode but
    // no city/state saved yet — look them up once on open instead of
    // waiting for the admin to retype a pincode that's already there.
    if (isEdit && /^\d{6}$/.test(form.pincode) && (!form.city || !form.state)) {
      lookupPincode(form.pincode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemsTotal = items.reduce(
    (sum, it) => sum + (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0),
    0,
  );

  // Mirrors the backend's own weight computation (utils/courier-shipment.js)
  // so the "auto: X kg" hint next to the override field is accurate.
  const autoWeightKg =
    items.reduce((sum, it) => {
      const inv = inventory.find((i) => String(i.id) === String(it.inventory_item_id));
      const perUnit = inv?.weight_kg ? parseFloat(inv.weight_kg) : defaultItemWeightKg;
      return sum + perUnit * (parseInt(it.quantity) || 1);
    }, 0) || defaultItemWeightKg;

  // Keep the Discounted Price synced to the items total as items change —
  // stops the moment the user types a number in that field themselves.
  useEffect(() => {
    if (!amountTouched) {
      setForm((f) => ({ ...f, amount: itemsTotal.toFixed(2) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsTotal]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleAmount = (e) => {
    setAmountTouched(true);
    setForm((f) => ({ ...f, amount: e.target.value }));
  };
  const resetAmountToTotal = () => {
    setAmountTouched(false);
    setForm((f) => ({ ...f, amount: itemsTotal.toFixed(2) }));
  };

  // Auto-fills City/State the moment a valid 6-digit pincode is entered (or,
  // in edit mode, on open if they're missing for an already-saved pincode),
  // so couriers' create-order APIs (which require both) reliably get them
  // without the admin typing them by hand every time.
  const lookupPincode = (pincode) => {
    setPincodeLoading(true);
    api
      .get(`/delivery/pincode/${pincode}`)
      .then((r) => setForm((f) => (f.pincode === pincode ? { ...f, city: r.data.city, state: r.data.state } : f)))
      .catch(() => {})
      .finally(() => setPincodeLoading(false));
  };
  const handlePincode = (e) => {
    const pincode = e.target.value;
    setForm((f) => ({ ...f, pincode }));
    if (/^\d{6}$/.test(pincode)) lookupPincode(pincode);
  };

  const updateItem = (i, key, val) =>
    setItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  const addItem = () => setItems((rows) => [...rows, { inventory_item_id: "", name: "", quantity: 1, price: "" }]);
  const removeItem = (i) => setItems((rows) => rows.filter((_, idx) => idx !== i));

  // Picking a catalog item fills name + price in one go; picking "Custom"
  // clears the link and leaves both free-text for a one-off item.
  const pickInventoryItem = (i, invId) => {
    if (!invId) {
      updateItemFields(i, { inventory_item_id: "", name: "", price: "" });
      return;
    }
    const match = inventory.find((inv) => String(inv.id) === String(invId));
    if (!match) return;
    updateItemFields(i, { inventory_item_id: invId, name: match.name, price: match.price });
  };
  const updateItemFields = (i, patch) =>
    setItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError("");
    setSaving(true);
    try {
      const result = await onSave({
        ...form,
        items: items.filter((it) => it.name.trim()),
      });
      if (attachmentFile) {
        const orderId = order?.id || result?.order_id || result?.id;
        const customerId = customer?.id || result?.customer_id;
        if (orderId && customerId) {
          const fd = new FormData();
          fd.append("file", attachmentFile);
          await api.post(`/customers/${customerId}/orders/${orderId}/attachment`, fd);
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to save order. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "26px 24px",
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontFamily: "var(--font-main)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            {isEdit ? "Edit Order" : "Fulfill Order"} — {form.name}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 20, cursor: "pointer", padding: "2px 6px", borderRadius: 6 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit}>
          {error && (
            <div style={{ marginBottom: 14, padding: "9px 13px", background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: 8, fontSize: 12, color: "var(--danger)", fontFamily: "var(--font-main)" }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Customer Name *">
                <input name="name" value={form.name} onChange={handle} required style={inp} />
              </Field>
            </div>

            <Field label="Phone (locked)">
              <input value={phone} readOnly style={inpLocked} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" value={form.email} onChange={handle} style={inp} />
            </Field>
            <Field label="Alternate Number">
              <input name="alternate_phone" value={form.alternate_phone} onChange={handle} placeholder="Optional — second contact number" style={inp} />
            </Field>

            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Delivery Address">
                <textarea name="address" value={form.address} onChange={handle} rows={2} style={{ ...inp, resize: "vertical" }} />
              </Field>
            </div>
            <Field label={pincodeLoading ? "Pincode (looking up city/state…)" : "Pincode"}>
              <input name="pincode" value={form.pincode} onChange={handlePincode} placeholder="e.g. 110001" style={inp} />
            </Field>
            <Field label="City">
              <input name="city" value={form.city} onChange={handle} placeholder="Auto-filled from pincode" style={inp} />
            </Field>
            <Field label="State">
              <input name="state" value={form.state} onChange={handle} placeholder="Auto-filled from pincode" style={inp} />
            </Field>
            <Field label="Items Total (₹)">
              <input value={itemsTotal.toFixed(2)} readOnly style={inpLocked} />
            </Field>
            <Field
              label={
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Discounted Price (₹)
                  {amountTouched && parseFloat(form.amount) !== itemsTotal && (
                    <button
                      type="button"
                      onClick={resetAmountToTotal}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--teal)",
                        fontSize: 10,
                        cursor: "pointer",
                        textDecoration: "underline",
                        textTransform: "none",
                        letterSpacing: 0,
                        padding: 0,
                      }}
                    >
                      reset to total
                    </button>
                  )}
                </span>
              }
            >
              <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleAmount} style={inp} />
            </Field>

            <Field label="Payment Type">
              <select name="payment_type" value={form.payment_type} onChange={handle} style={inp}>
                <option value="prepaid">Prepaid</option>
                <option value="cod">COD (Cash on Delivery)</option>
              </select>
            </Field>
            <Field label="Order Type">
              <select name="order_type" value={form.order_type} onChange={handle} style={inp}>
                <option value="FRESH">FRESH</option>
                <option value="REPEAT">REPEAT</option>
              </select>
            </Field>

            {form.payment_type === "cod" && (
              <>
                <Field label="Advance Paid (₹)">
                  <input name="advance_paid" type="number" min="0" step="0.01" value={form.advance_paid} onChange={handle} placeholder="0" style={inp} />
                </Field>
                <Field label="Balance Due (₹)">
                  <input
                    value={Math.max(0, (parseFloat(form.amount) || 0) - (parseFloat(form.advance_paid) || 0)).toFixed(2)}
                    readOnly
                    style={inpLocked}
                  />
                </Field>
              </>
            )}

            <Field label="Next Due Date">
              <input name="next_due_date" type="date" value={form.next_due_date} onChange={handle} style={inp} />
            </Field>
            <Field label="Delivery Provider">
              <select name="provider" value={form.provider} onChange={handle} style={inp}>
                <option value="">— Manual / no auto-ship —</option>
                {deliveryProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Courier Tracking ID">
              <input name="tracking_id" value={form.tracking_id} onChange={handle} placeholder={form.provider ? "Auto-filled once the order ships" : "Optional — AWB / tracking number"} style={inp} />
            </Field>

            {form.provider && (
              <>
                <Field label={`Package Weight (kg) — auto: ${autoWeightKg.toFixed(2)}`}>
                  <input name="package_weight_kg" type="number" min="0" step="0.01" value={form.package_weight_kg} onChange={handle} placeholder={`Leave blank to use ${autoWeightKg.toFixed(2)} kg`} style={inp} />
                </Field>
                <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <Field label="Length (cm)">
                    <input name="package_length_cm" type="number" min="0" step="0.1" value={form.package_length_cm} onChange={handle} placeholder="10" style={inp} />
                  </Field>
                  <Field label="Width (cm)">
                    <input name="package_width_cm" type="number" min="0" step="0.1" value={form.package_width_cm} onChange={handle} placeholder="10" style={inp} />
                  </Field>
                  <Field label="Height (cm)">
                    <input name="package_height_cm" type="number" min="0" step="0.1" value={form.package_height_cm} onChange={handle} placeholder="10" style={inp} />
                  </Field>
                </div>
              </>
            )}

            <Field label="Order Stage">
              <select name="stage" value={form.stage} onChange={handle} style={inp}>
                <option value="">— None —</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Items given */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-main)" }}>
              Items Given
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    padding: 8,
                    background: "var(--bg-surface)",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <select
                    value={item.inventory_item_id || ""}
                    onChange={(e) => pickInventoryItem(i, e.target.value)}
                    style={inp}
                  >
                    <option value="">✏️ Custom item (type below)</option>
                    {inventory.map((inv) => (
                      <option key={inv.id} value={inv.id} disabled={inv.stock_qty <= 0}>
                        {inv.name}{inv.stock_qty <= 0 ? " (out of stock)" : ""}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      readOnly={!!item.inventory_item_id}
                      placeholder="Item name"
                      style={{ ...(item.inventory_item_id ? inpLocked : inp), flex: 2 }}
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", e.target.value)}
                      placeholder="Qty"
                      style={{ ...inp, flex: 1 }}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(i, "price", e.target.value)}
                      placeholder="Price"
                      style={{ ...inp, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                      style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--danger)", cursor: items.length === 1 ? "not-allowed" : "pointer", padding: "0 10px", opacity: items.length === 1 ? 0.4 : 1 }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                style={{ alignSelf: "flex-start", background: "transparent", border: "1px dashed var(--border)", borderRadius: 8, padding: "7px 14px", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-main)" }}
              >
                + Add Item
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Field label="Notes">
              <textarea name="notes" value={form.notes} onChange={handle} rows={2} placeholder="Anything else about this order..." style={{ ...inp, resize: "vertical" }} />
            </Field>
          </div>

          <div style={{ marginTop: 14 }}>
            <Field label="Attachment (payment screenshot, report, etc.) — optional">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                style={{ ...inp, padding: "7px 11px" }}
              />
              {attachmentFile ? (
                <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>Selected: {attachmentFile.name}</div>
              ) : existingAttachment.path ? (
                <div style={{ marginTop: 6, fontSize: 11 }}>
                  <a href={`${API_ORIGIN}${existingAttachment.path}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)" }}>
                    📎 View current attachment {existingAttachment.name ? `(${existingAttachment.name})` : ""}
                  </a>
                  <span style={{ color: "var(--text-muted)" }}> — choose a file above to replace it</span>
                </div>
              ) : null}
            </Field>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: "9px 20px", borderRadius: "var(--radius-sm)", background: saving ? "var(--bg-hover)" : "var(--gradient-accent)", border: "none", color: "#fff", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "var(--shadow-glow)" }}
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, color: "var(--text-secondary)", marginBottom: 5, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-main)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inp = {
  width: "100%",
  padding: "9px 11px",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const inpLocked = {
  ...inp,
  background: "var(--bg-surface)",
  color: "var(--text-muted)",
  cursor: "not-allowed",
};
