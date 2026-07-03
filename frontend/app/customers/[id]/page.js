"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api, { formatCurrency } from "../../../lib/api";

const MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Online"];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function today() {
  return new Date().toISOString().split("T")[0];
}
function isOverdue(d) {
  return d && (d.split ? d.split("T")[0] : d) < today();
}
function isToday(d) {
  return d && (d.split ? d.split("T")[0] : d) === today();
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showPay, setShowPay] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: "",
    payment_date: today(),
    due_date: "",
    payment_mode: "Cash",
    status: "Paid",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [markingPaid, setMark] = useState(null);
  const [delPay, setDelPay] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/customers/${id}`);
      setCustomer(data);
      setPayments(data.payments || []);
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

  const addPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    await api.post(`/customers/${id}/payments`, payForm);
    setSaving(false);
    setShowPay(false);
    setPayForm({
      amount: "",
      payment_date: today(),
      due_date: "",
      payment_mode: "Cash",
      status: "Paid",
      notes: "",
    });
    load();
  };

  const markPaid = async (p) => {
    setMark(p.id);
    await api.put(`/customers/${id}/payments/${p.id}`, {
      ...p,
      status: "Paid",
      payment_date: today(),
    });
    setMark(null);
    load();
  };

  const delPayment = async (pid) => {
    if (!confirm("Delete this payment record?")) return;
    setDelPay(pid);
    await api.delete(`/customers/${id}/payments/${pid}`);
    setDelPay(null);
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

  const totalFee = parseFloat(customer.total_fee || 0);
  const paid = parseFloat(customer.amount_paid || 0);
  const balance = totalFee - paid;
  const progress = totalFee > 0 ? Math.min(100, (paid / totalFee) * 100) : 0;
  const totalDue = payments
    .filter((p) => p.status === "Due")
    .reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  const sorted = [...payments].sort((a, b) => {
    if (a.status === "Due" && b.status !== "Due") return -1;
    if (a.status !== "Due" && b.status === "Due") return 1;
    return new Date(b.payment_date) - new Date(a.payment_date);
  });

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

          {/* Payment Timeline */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-main)",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                💳 Payment History
              </h3>
              <button
                onClick={() => setShowPay(true)}
                style={{
                  background: "var(--teal)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontFamily: "var(--font-main)",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                + Add Payment
              </button>
            </div>

            {sorted.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: "var(--text-muted)",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>💳</div>
                <div style={{ fontSize: 13 }}>
                  No payment records yet. Click "+ Add Payment" to add one.
                </div>
              </div>
            ) : (
              <div>
                {sorted.map((p, idx) => {
                  const isPaid = p.status === "Paid";
                  const over =
                    !isPaid && isOverdue(p.due_date || p.payment_date);
                  const tod =
                    !isPaid && !over && isToday(p.due_date || p.payment_date);
                  const accent = isPaid
                    ? "var(--success)"
                    : over
                      ? "var(--danger)"
                      : tod
                        ? "var(--warn)"
                        : "var(--blue)";
                  const accentDim = isPaid
                    ? "rgba(82,184,138,0.1)"
                    : over
                      ? "var(--danger-dim)"
                      : tod
                        ? "var(--warn-dim)"
                        : "var(--blue-dim)";
                  return (
                    <div
                      key={p.id}
                      style={{ display: "flex", gap: 0, position: "relative" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          marginRight: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 11,
                            height: 11,
                            borderRadius: "50%",
                            background: accent,
                            flexShrink: 0,
                            marginTop: 18,
                            zIndex: 1,
                            border: "2px solid var(--bg-card)",
                            boxShadow: `0 0 0 3px ${accentDim}`,
                          }}
                        />
                        {idx < sorted.length - 1 && (
                          <div
                            style={{
                              width: 2,
                              flex: 1,
                              background: "var(--border)",
                              minHeight: 18,
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          marginBottom: 10,
                          padding: "12px 14px",
                          background: over
                            ? "rgba(224,82,82,0.05)"
                            : "var(--bg-surface)",
                          borderRadius: 9,
                          border: `1px solid ${over ? "rgba(224,82,82,0.2)" : "var(--border)"}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 3,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--font-main)",
                                  fontWeight: 700,
                                  fontSize: 14,
                                  color: "var(--text-primary)",
                                }}
                              >
                                {formatCurrency(p.amount)}
                              </span>
                              <span
                                style={{
                                  background: accentDim,
                                  color: accent,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  borderRadius: 20,
                                  padding: "2px 8px",
                                  fontFamily: "var(--font-main)",
                                }}
                              >
                                {isPaid
                                  ? "✓ Paid"
                                  : over
                                    ? "⚠ Overdue"
                                    : tod
                                      ? "● Due Today"
                                      : "⏳ Due"}
                              </span>
                              {p.payment_mode && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: "var(--text-muted)",
                                    background: "var(--bg-card)",
                                    borderRadius: 5,
                                    padding: "2px 7px",
                                  }}
                                >
                                  {p.payment_mode}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {isPaid
                                ? `Paid on ${fmtDate(p.payment_date)}`
                                : `Due on ${fmtDate(p.due_date || p.payment_date)}`}
                            </div>
                            {p.notes && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-muted)",
                                  marginTop: 3,
                                  fontStyle: "italic",
                                }}
                              >
                                {p.notes}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {!isPaid && (
                              <button
                                onClick={() => markPaid(p)}
                                disabled={markingPaid === p.id}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  background: "rgba(82,184,138,0.1)",
                                  border: "1px solid rgba(82,184,138,0.3)",
                                  color: "var(--success)",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                {markingPaid === p.id ? "…" : "Mark Paid"}
                              </button>
                            )}
                            <button
                              onClick={() => delPayment(p.id)}
                              disabled={delPay === p.id}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: "transparent",
                                border: "1px solid var(--border)",
                                color: "var(--danger)",
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              {delPay === p.id ? "…" : "×"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Fee Summary */}
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
              Fee Summary
            </h3>

            {/* Progress */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Payment Progress
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--success)",
                    fontFamily: "var(--font-main)",
                  }}
                >
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div
                style={{
                  height: 7,
                  background: "var(--bg-surface)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 10,
                    width: `${progress}%`,
                    transition: "width 0.5s ease",
                    background:
                      progress >= 100
                        ? "var(--success)"
                        : progress >= 60
                          ? "var(--teal)"
                          : progress >= 30
                            ? "var(--warn)"
                            : "var(--danger)",
                  }}
                />
              </div>
            </div>

            {[
              {
                label: "Total Fee",
                value: formatCurrency(totalFee),
                color: "var(--text-primary)",
                big: true,
              },
              {
                label: "Collected",
                value: formatCurrency(paid),
                color: "var(--success)",
              },
              {
                label: "Upcoming Due",
                value: formatCurrency(totalDue),
                color: "var(--blue)",
              },
              {
                label: "Balance",
                value: balance > 0 ? formatCurrency(balance) : "✓ Fully Paid",
                color: balance > 0 ? "var(--warn)" : "var(--success)",
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
            ))}

            <button
              onClick={() => setShowPay(true)}
              style={{
                width: "100%",
                marginTop: 18,
                padding: "10px",
                borderRadius: 8,
                background: "var(--teal)",
                border: "none",
                color: "#fff",
                fontFamily: "var(--font-main)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Payment Entry
            </button>
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showPay && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPay(false);
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-main)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Add Payment Entry
              </h2>
              <button
                onClick={() => setShowPay(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Type toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {["Paid", "Due"].map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    setPayForm((f) => ({
                      ...f,
                      status: s,
                      payment_date: s === "Paid" ? today() : f.payment_date,
                    }))
                  }
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "var(--font-main)",
                    fontWeight: 600,
                    fontSize: 13,
                    border: `2px solid ${payForm.status === s ? (s === "Paid" ? "var(--success)" : "var(--warn)") : "var(--border)"}`,
                    background:
                      payForm.status === s
                        ? s === "Paid"
                          ? "rgba(82,184,138,0.1)"
                          : "rgba(224,160,80,0.1)"
                        : "transparent",
                    color:
                      payForm.status === s
                        ? s === "Paid"
                          ? "var(--success)"
                          : "var(--warn)"
                        : "var(--text-muted)",
                  }}
                >
                  {s === "Paid" ? "✓ Mark as Paid" : "⏳ Add Due Date"}
                </button>
              ))}
            </div>

            <form onSubmit={addPayment}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div>
                  <Lbl>Amount *</Lbl>
                  <input
                    type="number"
                    value={payForm.amount}
                    onChange={(e) =>
                      setPayForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    required
                    placeholder="0"
                    style={inp}
                  />
                </div>
                {payForm.status === "Paid" ? (
                  <>
                    <div>
                      <Lbl>Payment Date *</Lbl>
                      <input
                        type="date"
                        value={payForm.payment_date}
                        onChange={(e) =>
                          setPayForm((f) => ({
                            ...f,
                            payment_date: e.target.value,
                          }))
                        }
                        required
                        style={inp}
                      />
                    </div>
                    <div>
                      <Lbl>Payment Mode</Lbl>
                      <select
                        value={payForm.payment_mode}
                        onChange={(e) =>
                          setPayForm((f) => ({
                            ...f,
                            payment_mode: e.target.value,
                          }))
                        }
                        style={inp}
                      >
                        {MODES.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <Lbl>Due Date *</Lbl>
                    <input
                      type="date"
                      value={payForm.due_date}
                      onChange={(e) =>
                        setPayForm((f) => ({
                          ...f,
                          due_date: e.target.value,
                          payment_date: e.target.value,
                        }))
                      }
                      required
                      style={inp}
                    />
                  </div>
                )}
                <div>
                  <Lbl>Notes</Lbl>
                  <input
                    value={payForm.notes}
                    onChange={(e) =>
                      setPayForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder="e.g. 2nd installment"
                    style={inp}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 20,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowPay(false)}
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
                    background: saving
                      ? "var(--bg-hover)"
                      : payForm.status === "Paid"
                        ? "var(--success)"
                        : "var(--warn)",
                    border: "none",
                    color: "#fff",
                    fontFamily: "var(--font-main)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving
                    ? "Saving..."
                    : `Add ${payForm.status === "Paid" ? "Payment" : "Due"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
