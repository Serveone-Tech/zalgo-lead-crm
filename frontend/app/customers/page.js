"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import api, { formatCurrency } from "../../lib/api";
import { Users, DollarSign, Clock, TrendingUp } from "lucide-react";

function today() {
  return new Date().toISOString().split("T")[0];
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function isOverdue(d) {
  return d && (d.split ? d.split("T")[0] : d) < today();
}
function isToday(d) {
  return d && (d.split ? d.split("T")[0] : d) === today();
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    platform: "",
    platform_link: "",
    total_fee: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/customers");
      setCustomers(data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        const q = search.toLowerCase();
        return (
          !q ||
          c.name.toLowerCase().includes(q) ||
          (c.phone || "").includes(q) ||
          (c.email || "").toLowerCase().includes(q)
        );
      }),
    [customers, search],
  );

  const addCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/customers", form);
      setShowAdd(false);
      setForm({
        name: "",
        phone: "",
        email: "",
        platform: "",
        platform_link: "",
        total_fee: "",
        notes: "",
      });
      load();
    } catch {}
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm("Delete this customer and all payment records?")) return;
    setDeleting(id);
    await api.delete(`/customers/${id}`);
    setDeleting(null);
    load();
  };

  const fmt = mounted ? formatCurrency : (n) => `₹${parseFloat(n) || 0}`;
  const totalFee = customers.reduce(
    (s, c) => s + parseFloat(c.total_fee || 0),
    0,
  );
  const totalCollected = customers.reduce(
    (s, c) => s + parseFloat(c.total_collected || 0),
    0,
  );
  const totalDue = customers.reduce(
    (s, c) => s + parseFloat(c.total_due_amount || 0),
    0,
  );

  return (
    <div style={{ padding: "28px 32px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-main)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Customers
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            {customers.length} customer{customers.length !== 1 ? "s" : ""}
            {customers.filter((c) => isOverdue(c.next_due_date)).length > 0 && (
              <span style={{ color: "var(--danger)", marginLeft: 10 }}>
                • {customers.filter((c) => isOverdue(c.next_due_date)).length}{" "}
                payment overdue
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
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
          <span style={{ fontSize: 16 }}>+</span> Add Customer
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: "Total Customers",
            value: customers.length,
            color: "var(--teal)",
            icon: <Users size={18} />,
          },
          {
            label: "Total Fees",
            value: fmt(totalFee),
            color: "var(--blue)",
            icon: <DollarSign size={18} />,
          },
          {
            label: "Collected",
            value: fmt(totalCollected),
            color: "var(--success)",
            icon: <TrendingUp size={18} />,
          },
          {
            label: "Pending Dues",
            value: fmt(totalDue),
            color: "var(--danger)",
            icon: <Clock size={18} />,
          },
        ].map((sc) => (
          <div
            key={sc.label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "16px 18px",
              borderTop: `3px solid ${sc.color}`,
            }}
          >
            <div style={{ marginBottom: 10, color: sc.color, display: "flex" }}>{sc.icon}</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: sc.color,
                fontFamily: "var(--font-main)",
                lineHeight: 1,
              }}
            >
              {sc.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 5,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {sc.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search by name, phone, email..."
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

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ marginBottom: 12, color: "var(--teal)", display: "flex", justifyContent: "center" }}><Users size={36} /></div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-main)",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {customers.length === 0
                ? "No customers yet"
                : "No matching customers"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {customers.length === 0
                ? 'Convert a lead to "Converted" stage or add manually'
                : "Try adjusting search"}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 900,
              }}
            >
              <thead>
                <tr style={{ background: "var(--bg-surface)" }}>
                  {[
                    "#",
                    "Name",
                    "Phone",
                    "Email",
                    "Total Fee",
                    "Collected",
                    "Balance",
                    "Next Due",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "11px 14px",
                        textAlign: "left",
                        fontSize: 10,
                        color: "var(--text-muted)",
                        fontWeight: 600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        borderBottom: "1px solid var(--border)",
                        fontFamily: "var(--font-main)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const balance =
                    parseFloat(c.total_fee || 0) -
                    parseFloat(c.total_collected || 0);
                  const over = isOverdue(c.next_due_date),
                    tod = isToday(c.next_due_date);
                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.15s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                      onClick={() => router.push(`/customers/${c.id}`)}
                    >
                      <td
                        style={{
                          padding: "12px 14px",
                          color: "var(--text-muted)",
                          fontSize: 12,
                        }}
                      >
                        {i + 1}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div
                          style={{
                            fontFamily: "var(--font-main)",
                            fontWeight: 600,
                            fontSize: 13,
                            color: "var(--text-primary)",
                          }}
                        >
                          {c.name}
                        </div>
                        {c.platform && (
                          <span
                            style={{ fontSize: 10, color: "var(--text-muted)" }}
                          >
                            {c.platform}
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {c.phone || (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {c.email || (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-main)",
                        }}
                      >
                        {fmt(c.total_fee)}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--success)",
                          fontFamily: "var(--font-main)",
                        }}
                      >
                        {fmt(c.total_collected)}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "var(--font-main)",
                          color:
                            balance > 0 ? "var(--warn)" : "var(--text-muted)",
                        }}
                      >
                        {balance > 0 ? (
                          fmt(balance)
                        ) : (
                          <span
                            style={{ color: "var(--success)", fontSize: 11 }}
                          >
                            ✓ Paid
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          whiteSpace: "nowrap",
                          fontSize: 12,
                        }}
                      >
                        {c.next_due_date ? (
                          <span
                            style={{
                              color: over
                                ? "var(--danger)"
                                : tod
                                  ? "var(--warn)"
                                  : "var(--text-secondary)",
                              fontWeight: over || tod ? 700 : 400,
                            }}
                          >
                            {over ? "⚠ " : tod ? "● " : ""}
                            {fmtDate(c.next_due_date)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td
                        style={{ padding: "12px 14px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => router.push(`/customers/${c.id}`)}
                            style={{
                              background: "transparent",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              padding: "5px 10px",
                              color: "var(--teal)",
                              fontSize: 11,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.borderColor =
                                "var(--teal)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.borderColor =
                                "var(--border)")
                            }
                          >
                            View
                          </button>
                          <button
                            onClick={() => del(c.id)}
                            disabled={deleting === c.id}
                            style={{
                              background: "transparent",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              padding: "5px 10px",
                              color: "var(--danger)",
                              fontSize: 11,
                              cursor: "pointer",
                              fontWeight: 600,
                              opacity: deleting === c.id ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.borderColor =
                                "var(--danger)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.borderColor =
                                "var(--border)")
                            }
                          >
                            {deleting === c.id ? "…" : "Del"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--text-muted)",
            textAlign: "right",
          }}
        >
          Showing {filtered.length} of {customers.length} customers
        </div>
      )}

      {showAdd && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false);
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
              maxWidth: 500,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 22,
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
                Add Customer
              </h2>
              <button
                onClick={() => setShowAdd(false)}
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
            <form onSubmit={addCustomer}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div style={{ gridColumn: "1/-1" }}>
                  <F label="Full Name *">
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                      placeholder="Customer name"
                      style={inp}
                    />
                  </F>
                </div>
                <F label="Phone Number">
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="9876543210"
                    style={inp}
                  />
                </F>
                <F label="Email Address">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="customer@email.com"
                    style={inp}
                  />
                </F>
                <F label="Platform">
                  <select
                    value={form.platform}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, platform: e.target.value }))
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
                </F>
                <F label="Total Fee">
                  <input
                    type="number"
                    value={form.total_fee}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, total_fee: e.target.value }))
                    }
                    placeholder="0"
                    style={inp}
                  />
                </F>
                <div style={{ gridColumn: "1/-1" }}>
                  <F label="Notes">
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      rows={2}
                      placeholder="Any notes..."
                      style={{ ...inp, resize: "vertical" }}
                    />
                  </F>
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
                  onClick={() => setShowAdd(false)}
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
                  {saving ? "Saving..." : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, children }) {
  return (
    <div>
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
};
