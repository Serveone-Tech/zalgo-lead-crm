"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api, { formatCurrency } from "../../../lib/api";
import OrderFulfillmentModal from "../../../components/OrderFulfillmentModal";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [trackResults, setTrackResults] = useState({});
  const [trackingId, setTrackingId] = useState(null);
  const [editOrderModal, setEditOrderModal] = useState(null);
  const [historyModalOrder, setHistoryModalOrder] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    load();
    api
      .get("/delivery/credentials")
      .then((r) => setDeliveryEnabled(!!(r.data.enabled && r.data.provider)))
      .catch(() => {});
  }, [id]);

  const viewTrack = async (order) => {
    setTrackingId(order.id);
    try {
      const { data } = await api.get(`/delivery/track/${order.id}`);
      if (data.link_only) {
        window.open(data.url, "_blank", "noreferrer");
      } else {
        setTrackResults((r) => ({ ...r, [order.id]: data }));
      }
    } catch (err) {
      setTrackResults((r) => ({
        ...r,
        [order.id]: { error: err.response?.data?.error || "Failed to fetch tracking status" },
      }));
    }
    setTrackingId(null);
  };

  const saveOrderEdit = async (form) => {
    await api.put(`/customers/${id}/orders/${editOrderModal.id}`, form);
    setEditOrderModal(null);
    load();
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/customers/${id}`);
      setCustomer(data);
      setOrders(data.orders || []);
      setEditForm({
        name: data.name,
        phone: data.phone || "",
        email: data.email || "",
        platform: data.platform || "",
        platform_link: data.platform_link || "",
        total_fee: data.total_fee,
        notes: data.notes || "",
        status: data.status || "Active",
      });
    } catch {
      router.push("/customers");
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await api.put(`/customers/${id}`, editForm);
    setSaving(false);
    setEditing(false);
    load();
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "var(--text-muted)",
        }}
      >
        Loading...
      </div>
    );
  if (!customer) return null;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      {/* Back */}
      <button
        onClick={() => router.push("/customers")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "var(--font-main)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--text-primary)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-muted)")
        }
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to Customers
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <div>
          {/* Customer info card */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "24px",
              marginBottom: 20,
            }}
          >
            {!editing ? (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "var(--teal)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#fff",
                        fontFamily: "var(--font-main)",
                        flexShrink: 0,
                      }}
                    >
                      {customer.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2
                        style={{
                          fontFamily: "var(--font-main)",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginBottom: 4,
                        }}
                      >
                        {customer.name}
                      </h2>
                      {customer.platform && (
                        <span
                          style={{
                            background: "rgba(91,163,217,0.13)",
                            color: "var(--blue)",
                            borderRadius: 5,
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {customer.platform}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        flexWrap: "wrap",
                        marginTop: 6,
                      }}
                    >
                      {customer.phone && (
                        <span
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          📞 {customer.phone}
                        </span>
                      )}
                      {customer.email && (
                        <span
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          ✉ {customer.email}
                        </span>
                      )}
                      {customer.assigned_to_name && (
                        <span
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          👤 {customer.assigned_to_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 7,
                      padding: "7px 14px",
                      color: "var(--teal)",
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "var(--teal)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                  >
                    Edit
                  </button>
                </div>
                {customer.platform_link && (
                  <a
                    href={customer.platform_link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 12,
                      color: "var(--teal)",
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    {customer.platform_link
                      .replace("https://", "")
                      .substring(0, 50)}
                  </a>
                )}
                {customer.address && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginBottom: 12,
                    }}
                  >
                    📍 {customer.address}
                    {customer.pincode ? ` — ${customer.pincode}` : ""}
                  </div>
                )}
                {customer.notes && (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "var(--bg-surface)",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "var(--text-secondary)",
                    }}
                  >
                    📝 {customer.notes}
                  </div>
                )}
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background:
                        customer.status === "Active"
                          ? "rgba(82,184,138,0.12)"
                          : "rgba(100,100,100,0.13)",
                      color:
                        customer.status === "Active"
                          ? "var(--success)"
                          : "#888",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontFamily: "var(--font-main)",
                    }}
                  >
                    {customer.status}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Enrolled{" "}
                    {fmtDate(customer.converted_at || customer.created_at)}
                  </span>
                </div>
              </>
            ) : (
              <form onSubmit={saveEdit}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 18,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-main)",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    Edit Customer
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: 18,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {[
                    { k: "name", l: "Name *", req: true, col: "1/-1" },
                    { k: "phone", l: "Phone Number" },
                    { k: "email", l: "Email Address", type: "email" },
                    { k: "total_fee", l: "Total Fee", type: "number" },
                  ].map(({ k, l, req, type, col }) => (
                    <div key={k} style={{ gridColumn: col || "auto" }}>
                      <Lbl>{l}</Lbl>
                      <input
                        type={type || "text"}
                        value={editForm[k] || ""}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, [k]: e.target.value }))
                        }
                        required={!!req}
                        style={inp}
                      />
                    </div>
                  ))}
                  <div>
                    <Lbl>Platform</Lbl>
                    <select
                      value={editForm.platform || ""}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, platform: e.target.value }))
                      }
                      style={inp}
                    >
                      {[
                        "",
                        "LinkedIn",
                        "Instagram",
                        "WhatsApp",
                        "Email",
                        "Referral",
                        "Other",
                      ].map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Lbl>Status</Lbl>
                    <select
                      value={editForm.status || "Active"}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, status: e.target.value }))
                      }
                      style={inp}
                    >
                      <option>Active</option>
                      <option>Completed</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <Lbl>Notes</Lbl>
                    <textarea
                      value={editForm.notes || ""}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      rows={2}
                      style={{ ...inp, resize: "vertical" }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "flex-end",
                    marginTop: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 7,
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
                      padding: "8px 18px",
                      borderRadius: 7,
                      background: "var(--teal)",
                      border: "none",
                      color: "#fff",
                      fontFamily: "var(--font-main)",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Order History */}
          {orders.length > 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "24px",
                marginTop: 20,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-main)",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 16,
                }}
              >
                📦 Orders
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {orders.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                          {formatCurrency(o.amount)} — {fmtDate(o.created_at)}
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 20,
                              padding: "2px 8px",
                              background: o.payment_type === "cod" ? "var(--warn-dim)" : "rgba(82,184,138,0.1)",
                              color: o.payment_type === "cod" ? "var(--warn)" : "var(--success)",
                            }}
                          >
                            {o.payment_type === "cod" ? "COD" : "Prepaid"}
                          </span>
                        </div>
                        {o.payment_type === "cod" && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            Advance {formatCurrency(o.advance_paid || 0)}
                            {" · "}
                            {parseFloat(o.amount || 0) - parseFloat(o.advance_paid || 0) > 0 ? (
                              <span style={{ color: "var(--warn)", fontWeight: 600 }}>
                                Balance {formatCurrency(parseFloat(o.amount || 0) - parseFloat(o.advance_paid || 0))} due
                              </span>
                            ) : (
                              <span style={{ color: "var(--success)" }}>✓ Fully collected</span>
                            )}
                          </div>
                        )}
                        {(o.address || o.pincode) && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            📍 {o.address} {o.pincode ? `— ${o.pincode}` : ""}
                          </div>
                        )}
                        {o.next_due_date && (
                          <div style={{ fontSize: 11, color: "var(--warn)", marginTop: 2 }}>
                            🔁 Next due: {fmtDate(o.next_due_date)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {deliveryEnabled && o.tracking_id && (
                          <button
                            onClick={() => viewTrack(o)}
                            disabled={trackingId === o.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 7,
                              background: "transparent",
                              border: "1px solid var(--teal)",
                              color: "var(--teal-light)",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: trackingId === o.id ? "not-allowed" : "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {trackingId === o.id ? "Checking…" : "🚚 View Track"}
                          </button>
                        )}
                        <button
                          onClick={() => setEditOrderModal(o)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 7,
                            background: "transparent",
                            border: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ✏️ Edit Order
                        </button>
                      </div>
                    </div>

                    {o.items?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                        {o.items.map((it) => (
                          <span
                            key={it.id}
                            style={{
                              fontSize: 11,
                              background: "var(--bg-card)",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              padding: "3px 9px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {it.name} × {it.quantity}
                            {parseFloat(it.price) > 0 ? ` (${formatCurrency(it.price)})` : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    {o.notes && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>{o.notes}</div>
                    )}

                    {trackResults[o.id] && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "8px 12px",
                          background: trackResults[o.id].error ? "var(--danger-dim)" : "var(--teal-dim)",
                          border: `1px solid ${trackResults[o.id].error ? "var(--danger)" : "var(--teal)"}`,
                          borderRadius: 8,
                          fontSize: 12,
                          color: trackResults[o.id].error ? "var(--danger)" : "var(--teal-light)",
                        }}
                      >
                        {trackResults[o.id].error ? (
                          `⚠ ${trackResults[o.id].error}`
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                            <span>
                              Status: {trackResults[o.id].status}
                              {trackResults[o.id].location ? ` — ${trackResults[o.id].location}` : ""}
                              {trackResults[o.id].updated_at ? ` (${trackResults[o.id].updated_at})` : ""}
                            </span>
                            {trackResults[o.id].history?.length > 0 && (
                              <button
                                onClick={() => setHistoryModalOrder(o)}
                                style={{
                                  background: "transparent",
                                  border: "1px solid var(--teal)",
                                  color: "var(--teal-light)",
                                  borderRadius: 6,
                                  padding: "3px 10px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                📋 Full History
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Payment Summary, derived from Orders (Prepaid/COD) */}
        <div>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "22px",
              position: "sticky",
              top: 24,
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-main)",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 18,
              }}
            >
              Payment Summary
            </h3>

            {orders.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                No orders yet — payment info shows here once an order is fulfilled.
              </div>
            ) : (
              [
                {
                  label: "Total Order Value",
                  value: formatCurrency(orders.reduce((s, o) => s + parseFloat(o.amount || 0), 0)),
                  color: "var(--text-primary)",
                  big: true,
                },
                {
                  label: "Collected",
                  value: formatCurrency(orders.reduce((s, o) => s + parseFloat(o.advance_paid || 0), 0)),
                  color: "var(--success)",
                },
                {
                  label: "COD Balance Due",
                  value: (() => {
                    const due = orders
                      .filter((o) => o.payment_type === "cod")
                      .reduce((s, o) => s + Math.max(0, parseFloat(o.amount || 0) - parseFloat(o.advance_paid || 0)), 0);
                    return due > 0 ? formatCurrency(due) : "✓ Nothing due";
                  })(),
                  color: (() => {
                    const due = orders
                      .filter((o) => o.payment_type === "cod")
                      .reduce((s, o) => s + Math.max(0, parseFloat(o.amount || 0) - parseFloat(o.advance_paid || 0)), 0);
                    return due > 0 ? "var(--warn)" : "var(--success)";
                  })(),
                  big: true,
                },
              ].map(({ label, value, color, big }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-main)",
                      fontWeight: big ? 700 : 600,
                      fontSize: big ? 14 : 13,
                      color,
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {historyModalOrder && (
        <TrackingHistoryModal
          order={historyModalOrder}
          result={trackResults[historyModalOrder.id]}
          onClose={() => setHistoryModalOrder(null)}
        />
      )}

      {editOrderModal && (
        <OrderFulfillmentModal
          order={editOrderModal}
          customer={customer}
          onClose={() => setEditOrderModal(null)}
          onSave={saveOrderEdit}
        />
      )}
    </div>
  );
}

function fmtScanDateTime(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d; // courier sent something we can't parse — show it raw rather than hide it
  return (
    dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    ", " +
    dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  );
}

function TrackingHistoryModal({ order, result, onClose }) {
  // Backend sends newest-first (for the compact inline summary); the courier's
  // own tracking panel reads top-to-bottom oldest→newest, so flip it here —
  // this is display-only, doesn't change what the backend returns.
  const history = [...(result?.history || [])].reverse();
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
          borderRadius: 14,
          padding: "24px",
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-main)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              🚚 Tracking History
            </h2>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              AWB / Tracking No: {order.tracking_id}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 20, cursor: "pointer", padding: "2px 6px", borderRadius: 6 }}
          >
            ✕
          </button>
        </div>

        {result?.status && (
          <div
            style={{
              marginTop: 14,
              marginBottom: 18,
              padding: "10px 14px",
              background: "var(--teal-dim)",
              border: "1px solid var(--teal)",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--teal-light)",
            }}
          >
            Current Status: {result.status}
            {result.location ? ` — ${result.location}` : ""}
          </div>
        )}

        {history.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>
            No detailed scan history available from the courier for this shipment.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {history.map((h, idx) => {
              const isLatest = idx === history.length - 1;
              return (
              <div key={idx} style={{ display: "flex", gap: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 14 }}>
                  <div
                    style={{
                      width: isLatest ? 20 : 10,
                      height: isLatest ? 20 : 10,
                      marginLeft: isLatest ? -5 : 0,
                      borderRadius: "50%",
                      background: isLatest ? "var(--teal)" : "var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      flexShrink: 0,
                      marginTop: 4,
                      border: isLatest ? "2px solid var(--teal-light)" : "none",
                    }}
                  >
                    {isLatest ? "🚚" : ""}
                  </div>
                  {idx < history.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: "var(--border)", minHeight: 24 }} />
                  )}
                </div>
                <div style={{ flex: 1, marginBottom: 16 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-main)",
                      fontWeight: isLatest ? 700 : 600,
                      fontSize: 13,
                      color: isLatest ? "var(--teal-light)" : "var(--text-primary)",
                    }}
                  >
                    {fmtScanDateTime(h.date) || "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                    {h.status || "Update"}
                    {h.location ? ` at ${h.location}` : ""}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Lbl({ children }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 10,
        color: "var(--text-secondary)",
        marginBottom: 5,
        fontWeight: 500,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        fontFamily: "var(--font-main)",
      }}
    >
      {children}
    </label>
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
};
