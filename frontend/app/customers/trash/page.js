"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api, { formatCurrency, refreshUser } from "../../../lib/api";
import { isOwnerUser } from "../../../lib/permissions";
import { Trash2, ArrowLeft, RotateCcw } from "lucide-react";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OrderTrashPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    const cached = localStorage.getItem("crm_user");
    if (cached) setUser(JSON.parse(cached));
    refreshUser().then((fresh) => {
      if (fresh) {
        setUser(fresh);
        // Non-owners can't see Trash at all — bounce them out rather than
        // showing an empty/broken page.
        if (!isOwnerUser(fresh)) router.push("/customers");
      }
    });
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/customers/trash/orders");
      setOrders(data);
    } catch {
      router.push("/customers");
    } finally {
      setLoading(false);
    }
  };

  const destroy = async (orderId) => {
    if (!confirm("Permanently delete this order? This cannot be undone.")) return;
    setDeleting(orderId);
    try {
      await api.delete(`/customers/trash/orders/${orderId}`);
      load();
    } catch {
      // no-op — leave it in the list so the user can retry
    }
    setDeleting(null);
  };

  const restore = async (orderId) => {
    setRestoring(orderId);
    try {
      await api.put(`/customers/trash/orders/${orderId}/restore`);
      load();
    } catch {
      // no-op — leave it in the list so the user can retry
    }
    setRestoring(null);
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <button
        onClick={() => router.push("/customers")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "var(--font-main)",
        }}
      >
        <ArrowLeft size={16} />
        Back to Customers
      </button>

      <h1
        style={{
          fontFamily: "var(--font-main)",
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <Trash2 size={22} /> Order Trash
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
        Orders deleted by any team member land here first — nothing is gone for good until you
        permanently delete it below.
      </p>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            Loading...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ marginBottom: 12, color: "var(--teal)", display: "flex", justifyContent: "center" }}>
              <Trash2 size={36} />
            </div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-main)",
                fontWeight: 600,
              }}
            >
              Trash is empty
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {orders.map((o) => (
              <div
                key={o.id}
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                    {formatCurrency(o.amount)} — {o.customer_name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                    Order placed {fmtDate(o.created_at)} · Deleted {fmtDate(o.deleted_at)}
                  </div>
                  {o.address && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      📍 {o.address} {o.pincode ? `— ${o.pincode}` : ""}
                    </div>
                  )}
                  {o.items?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {o.items.map((it) => (
                        <span
                          key={it.id}
                          style={{
                            fontSize: 11,
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            padding: "3px 9px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {it.name} × {it.quantity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => restore(o.id)}
                    disabled={restoring === o.id || deleting === o.id}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 7,
                      background: "transparent",
                      border: "1px solid var(--teal)",
                      color: "var(--teal-light)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: restoring === o.id ? "not-allowed" : "pointer",
                      opacity: restoring === o.id ? 0.5 : 1,
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <RotateCcw size={13} />
                    {restoring === o.id ? "Restoring…" : "Restore"}
                  </button>
                  <button
                    onClick={() => destroy(o.id)}
                    disabled={deleting === o.id || restoring === o.id}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 7,
                      background: "transparent",
                      border: "1px solid var(--danger)",
                      color: "var(--danger)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: deleting === o.id ? "not-allowed" : "pointer",
                      opacity: deleting === o.id ? 0.5 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {deleting === o.id ? "Deleting…" : "Delete Permanently"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
