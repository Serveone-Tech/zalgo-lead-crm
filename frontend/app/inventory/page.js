"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api, { formatCurrency, refreshUser } from "../../lib/api";
import { isOwnerUser, hasPerm } from "../../lib/permissions";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", stock_qty: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [threshold, setThreshold] = useState(10);
  const [thresholdInput, setThresholdInput] = useState("10");
  const [thresholdSaving, setThresholdSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    const cached = localStorage.getItem("crm_user");
    if (cached) setUser(JSON.parse(cached));
    refreshUser().then((fresh) => {
      if (fresh) {
        setUser(fresh);
        if (!isOwnerUser(fresh) && !hasPerm(fresh, "view_inventory")) router.push("/dashboard");
      }
    });
    load();
    api
      .get("/settings")
      .then((r) => {
        const t = r.data.low_stock_threshold ?? 10;
        setThreshold(t);
        setThresholdInput(String(t));
      })
      .catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/inventory");
      setItems(data);
    } catch {
      // no-op — keep whatever was already loaded
    } finally {
      setLoading(false);
    }
  };

  const saveThreshold = async () => {
    setThresholdSaving(true);
    try {
      const { data } = await api.put("/settings", { low_stock_threshold: thresholdInput });
      setThreshold(data.low_stock_threshold);
    } catch {
      // no-op — input stays as typed so the user can retry
    }
    setThresholdSaving(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", price: "", stock_qty: "" });
    setError("");
    setShowForm(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name, price: item.price, stock_qty: item.stock_qty });
    setError("");
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/inventory/${editing.id}`, form);
      } else {
        await api.post("/inventory", form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const del = async (item) => {
    if (!confirm(`Delete "${item.name}" from inventory? Past orders keep their own item details either way.`)) return;
    setDeleting(item.id);
    try {
      await api.delete(`/inventory/${item.id}`);
      load();
    } catch {
      // no-op — leave the row in place so the user can retry
    }
    setDeleting(null);
  };

  const fmt = mounted ? formatCurrency : (n) => `₹${parseFloat(n) || 0}`;
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const lowStockItems = items.filter((i) => i.stock_qty <= threshold);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-main)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Package size={22} /> Inventory
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            {items.length} item{items.length !== 1 ? "s" : ""} — these show up in the Order Fulfillment form's item
            dropdown, with price filled in automatically.
          </p>
        </div>
        {(isOwnerUser(user) || hasPerm(user, "manage_inventory")) && (
          <button
            onClick={openAdd}
            style={{
              background: "var(--teal)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 18px",
              fontFamily: "var(--font-main)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Plus size={16} /> Add Item
          </button>
        )}
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{lowStockItems.length > 0 ? "⚠️" : "✅"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: lowStockItems.length > 0 ? "var(--warn)" : "var(--text-secondary)", fontFamily: "var(--font-main)" }}>
              {lowStockItems.length > 0
                ? `${lowStockItems.length} item${lowStockItems.length !== 1 ? "s" : ""} at or below the low-stock alert level`
                : "All items are above the low-stock alert level"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              You'll see a low-stock notification whenever stock drops to this number or below.
            </div>
          </div>
        </div>
        {(isOwnerUser(user) || hasPerm(user, "manage_settings")) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-main)" }}>Alert at</label>
            <input
              type="number"
              min="0"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              style={{
                width: 70,
                padding: "7px 10px",
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: 7,
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={saveThreshold}
              disabled={thresholdSaving || parseInt(thresholdInput) === threshold}
              style={{
                padding: "7px 14px",
                borderRadius: 7,
                background: thresholdSaving ? "var(--bg-hover)" : "var(--teal)",
                border: "none",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: thresholdSaving || parseInt(thresholdInput) === threshold ? "not-allowed" : "pointer",
                fontFamily: "var(--font-main)",
              }}
            >
              {thresholdSaving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search items..."
          style={{
            width: "100%",
            maxWidth: 420,
            padding: "10px 14px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text-primary)",
            fontSize: 14,
            outline: "none",
            fontFamily: "var(--font-main)",
          }}
        />
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ marginBottom: 12, color: "var(--teal)", display: "flex", justifyContent: "center" }}>
              <Package size={36} />
            </div>
            <div style={{ color: "var(--text-secondary)", fontFamily: "var(--font-main)", fontWeight: 600, marginBottom: 6 }}>
              {items.length === 0 ? "No items yet" : "No matching items"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {items.length === 0 ? 'Click "+ Add Item" to build your catalog' : "Try adjusting search"}
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)" }}>
                {["Name", "Price", "Stock", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "11px 14px",
                      textAlign: h === "Actions" ? "right" : "left",
                      fontSize: 10,
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      borderBottom: "1px solid var(--border)",
                      fontFamily: "var(--font-main)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 14px", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{fmt(item.price)}</td>
                  <td
                    style={{
                      padding: "12px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: item.stock_qty <= 0 ? "var(--danger)" : item.stock_qty <= threshold ? "var(--warn)" : "var(--success)",
                    }}
                  >
                    {item.stock_qty}
                    {item.stock_qty <= 0 ? " (out of stock)" : item.stock_qty <= threshold ? " (low)" : ""}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      {(isOwnerUser(user) || hasPerm(user, "manage_inventory")) && (
                        <button
                          onClick={() => openEdit(item)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            padding: "5px 10px",
                            color: "var(--teal)",
                            fontSize: 11,
                            cursor: "pointer",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      )}
                      {(isOwnerUser(user) || hasPerm(user, "delete_inventory")) && (
                        <button
                          onClick={() => del(item)}
                          disabled={deleting === item.id}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            padding: "5px 10px",
                            color: "var(--danger)",
                            fontSize: 11,
                            cursor: "pointer",
                            fontWeight: 600,
                            opacity: deleting === item.id ? 0.5 : 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Trash2 size={12} /> {deleting === item.id ? "…" : "Del"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
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
              borderRadius: 14,
              padding: "26px 24px",
              width: "100%",
              maxWidth: 420,
            }}
          >
            <h2 style={{ fontFamily: "var(--font-main)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>
              {editing ? "Edit Item" : "Add Item"}
            </h2>

            {error && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "9px 13px",
                  background: "var(--danger-dim)",
                  border: "1px solid var(--danger)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--danger)",
                  fontFamily: "var(--font-main)",
                }}
              >
                ⚠ {error}
              </div>
            )}

            <form onSubmit={submit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={lbl}>Item Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="e.g. Liver DX Capsules"
                    style={inp}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={lbl}>Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="0"
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock_qty}
                      onChange={(e) => setForm((f) => ({ ...f, stock_qty: e.target.value }))}
                      placeholder="0"
                      style={inp}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 8,
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    background: saving ? "var(--bg-hover)" : "var(--teal)",
                    border: "none",
                    color: "#fff",
                    fontFamily: "var(--font-main)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = {
  display: "block",
  fontSize: 10,
  color: "var(--text-secondary)",
  marginBottom: 5,
  fontWeight: 500,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  fontFamily: "var(--font-main)",
};
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
