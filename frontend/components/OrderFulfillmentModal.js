"use client";
import { useState } from "react";

export default function OrderFulfillmentModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    name: lead?.name || "",
    email: lead?.email || "",
    address: "",
    pincode: "",
    amount: "",
    next_due_date: "",
    tracking_id: "",
    notes: "",
  });
  const [items, setItems] = useState([{ name: "", quantity: 1, price: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const updateItem = (i, key, val) =>
    setItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  const addItem = () => setItems((rows) => [...rows, { name: "", quantity: 1, price: "" }]);
  const removeItem = (i) => setItems((rows) => rows.filter((_, idx) => idx !== i));

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
            Fulfill Order — {lead?.name}
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
              <input value={lead?.phone || ""} readOnly style={inpLocked} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" value={form.email} onChange={handle} style={inp} />
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

            <Field label="Next Due Date">
              <input name="next_due_date" type="date" value={form.next_due_date} onChange={handle} style={inp} />
            </Field>
            <Field label="Courier Tracking ID">
              <input name="tracking_id" value={form.tracking_id} onChange={handle} placeholder="Optional — AWB / tracking number" style={inp} />
            </Field>
          </div>

          {/* Items given */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-main)" }}>
              Items Given
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(i, "name", e.target.value)}
                    placeholder="Item name"
                    style={{ ...inp, flex: 2 }}
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
              {saving ? "Saving..." : "Save Order"}
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
