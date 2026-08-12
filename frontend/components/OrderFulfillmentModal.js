"use client";
import { useState, useEffect } from "react";
import api from "../lib/api";

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
    pincode: order?.pincode || customer?.pincode || "",
    amount: order?.amount || "",
    payment_type: order?.payment_type || "prepaid",
    advance_paid: order?.advance_paid || "",
    next_due_date: order?.next_due_date ? order.next_due_date.split("T")[0] : "",
    tracking_id: order?.tracking_id || "",
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stages, setStages] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    api
      .get("/order-stages")
      .then((r) => {
        setStages(r.data);
        // Fresh orders default to the first configured stage instead of blank.
        if (!isEdit && r.data.length > 0) {
          setForm((f) => (f.stage ? f : { ...f, stage: r.data[0].name }));
        }
      })
      .catch(() => {});
    api.get("/inventory").then((r) => setInventory(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

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
      await onSave({
        ...form,
        items: items.filter((it) => it.name.trim()),
      });
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
            <Field label="Pincode">
              <input name="pincode" value={form.pincode} onChange={handle} placeholder="e.g. 110001" style={inp} />
            </Field>
            <Field label="Order Amount (₹)">
              <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handle} style={inp} />
            </Field>

            <Field label="Payment Type">
              <select name="payment_type" value={form.payment_type} onChange={handle} style={inp}>
                <option value="prepaid">Prepaid</option>
                <option value="cod">COD (Cash on Delivery)</option>
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
            <Field label="Courier Tracking ID">
              <input name="tracking_id" value={form.tracking_id} onChange={handle} placeholder="Optional — AWB / tracking number" style={inp} />
            </Field>

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
                        {inv.name} {inv.stock_qty <= 0 ? "(out of stock)" : `— stock ${inv.stock_qty}`}
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
