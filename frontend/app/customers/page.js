"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import api, { formatCurrency, refreshUser } from "../../lib/api";
import { isOwnerUser, hasPerm } from "../../lib/permissions";
import { Users, DollarSign, Clock, TrendingUp, Trash2, Calendar, Download } from "lucide-react";

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
  const [confirmDelete, setConfirmDelete] = useState(null);
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
  const [user, setUser] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orderStages, setOrderStages] = useState([]);
  const [stageChanging, setStageChanging] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [reportDownloading, setReportDownloading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    const cached = localStorage.getItem("crm_user");
    if (cached) setUser(JSON.parse(cached));
    refreshUser().then((fresh) => {
      if (fresh) setUser(fresh);
    });
    load();
    api
      .get("/order-stages")
      .then((r) => setOrderStages(r.data))
      .catch(() => {});
  }, []);

  const changeOrderStage = async (c, stage) => {
    if (!c.latest_order_id) return;
    setStageChanging(c.id);
    try {
      await api.put(`/customers/${c.id}/orders/${c.latest_order_id}`, { stage });
      load();
    } catch {
      // no-op — dropdown just stays on whatever it was
    }
    setStageChanging(null);
  };

  const openReportModal = () => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    setReportFrom(firstOfMonth.toISOString().split("T")[0]);
    setReportTo(now.toISOString().split("T")[0]);
    setReportError("");
    setShowReportModal(true);
  };

  const setReportRangeThisMonth = () => {
    const now = new Date();
    setReportFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
    setReportTo(now.toISOString().split("T")[0]);
  };

  const setReportRangeLastMonth = () => {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    setReportFrom(lastMonthStart.toISOString().split("T")[0]);
    setReportTo(lastMonthEnd.toISOString().split("T")[0]);
  };

  const downloadSalesReport = async () => {
    if (!reportFrom || !reportTo) {
      setReportError("Pick both a from and to date");
      return;
    }
    setReportDownloading(true);
    setReportError("");
    try {
      const res = await api.get("/customers/reports/sales-excel", {
        params: { from: reportFrom, to: reportTo },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-report-${reportFrom}-to-${reportTo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setShowReportModal(false);
    } catch {
      setReportError("Failed to download report. Please try again.");
    }
    setReportDownloading(false);
  };

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
        if (
          q &&
          !c.name.toLowerCase().includes(q) &&
          !(c.phone || "").includes(q) &&
          !(c.email || "").toLowerCase().includes(q)
        )
          return false;
        const enrolledDate = c.created_at ? c.created_at.split("T")[0] : null;
        if (dateFrom && (!enrolledDate || enrolledDate < dateFrom)) return false;
        if (dateTo && (!enrolledDate || enrolledDate > dateTo)) return false;
        return true;
      }),
    [customers, search, dateFrom, dateTo],
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
    setDeleting(id);
    try {
      await api.delete(`/customers/${id}`);
      load();
    } catch {
      // no-op — leave the row in place so the user can retry
    }
    setDeleting(null);
    setConfirmDelete(null);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((c) => c.id)),
    );
  };

  const bulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await api.post("/customers/bulk-delete", { ids: Array.from(selectedIds) });
      setSelectedIds(new Set());
      load();
    } catch {
      // no-op — selection stays as-is so the user can retry
    }
    setBulkDeleting(false);
    setConfirmBulkDelete(false);
  };

  const fmt = mounted ? formatCurrency : (n) => `₹${parseFloat(n) || 0}`;
  // Cards reflect whatever's currently filtered (search + date range), not
  // the whole unfiltered customer list — so picking a date range actually
  // changes the numbers shown, not just the table rows.
  // Real order revenue (sum of every order's amount) — the old card summed
  // customers.total_fee, a standalone manually-entered number left over from
  // this product's coaching-tool origin that has no link to actual orders.
  const totalFee = filtered.reduce(
    (s, c) => s + parseFloat(c.total_order_value || 0),
    0,
  );
  const totalCollected = filtered.reduce(
    (s, c) => s + parseFloat(c.total_collected || 0),
    0,
  );
  const totalDue = filtered.reduce(
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
        <div style={{ display: "flex", gap: 10 }}>
          {isOwnerUser(user) && (
            <button
              onClick={() => router.push("/customers/trash")}
              style={{
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
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
              <Trash2 size={15} /> Trash
            </button>
          )}
          <button
            onClick={openReportModal}
            style={{
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
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
            <Download size={15} /> Sales Report
          </button>
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
            value: filtered.length,
            color: "var(--teal)",
            icon: <Users size={18} />,
          },
          {
            label: "Total Order Value",
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

      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search by name, phone, email..."
          style={{
            flex: 1,
            minWidth: 240,
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0 12px",
          }}
        >
          <Calendar size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            max={dateTo || undefined}
            title="Enrolled from"
            style={dateInputStyle}
          />
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            min={dateFrom || undefined}
            title="Enrolled until"
            style={dateInputStyle}
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              title="Clear date range"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 13,
                padding: "4px 2px",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 16px",
            background: "var(--danger-dim)",
            border: "1px solid var(--danger)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)", fontFamily: "var(--font-main)" }}>
            {selectedIds.size} customer{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                padding: "7px 14px",
                borderRadius: 7,
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-main)",
              }}
            >
              Clear
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              style={{
                padding: "7px 14px",
                borderRadius: 7,
                background: "var(--danger)",
                border: "none",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-main)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Trash2 size={13} /> Delete Selected
            </button>
          </div>
        </div>
      )}

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
                minWidth: 1300,
              }}
            >
              <thead>
                <tr style={{ background: "var(--bg-surface)" }}>
                  {(isOwnerUser(user) || hasPerm(user, "delete_customers")) && (
                    <th
                      style={{
                        padding: "11px 14px",
                        borderBottom: "1px solid var(--border)",
                        width: 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onChange={toggleSelectAll}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                  )}
                  {[
                    "#",
                    "Name",
                    "Phone",
                    "Email",
                    "Assigned To",
                    "Latest Order",
                    "Order Stage",
                    "Orders",
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
                  const balance = parseFloat(c.total_due_amount || 0);
                  const over = isOverdue(c.next_due_date),
                    tod = isToday(c.next_due_date);
                  const isSelected = selectedIds.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.15s",
                        cursor: "pointer",
                        background: isSelected ? "var(--bg-hover)" : "transparent",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = isSelected ? "var(--bg-hover)" : "transparent")
                      }
                      onClick={() => router.push(`/customers/${c.id}`)}
                    >
                      {(isOwnerUser(user) || hasPerm(user, "delete_customers")) && (
                        <td style={{ padding: "12px 14px" }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(c.id)}
                            style={{ cursor: "pointer" }}
                          />
                        </td>
                      )}
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
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {c.assigned_to_name || (
                          <span style={{ color: "var(--text-muted)" }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        {c.latest_order_id ? (
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontFamily: "var(--font-main)",
                                fontWeight: 600,
                                fontSize: 12,
                                color: "var(--text-primary)",
                              }}
                            >
                              {fmt(c.latest_order_amount)}
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  borderRadius: 20,
                                  padding: "1px 7px",
                                  background:
                                    c.latest_order_payment_type === "cod"
                                      ? "var(--warn-dim)"
                                      : "rgba(82,184,138,0.1)",
                                  color:
                                    c.latest_order_payment_type === "cod"
                                      ? "var(--warn)"
                                      : "var(--success)",
                                }}
                              >
                                {c.latest_order_payment_type === "cod" ? "COD" : "Prepaid"}
                              </span>
                            </div>
                            {c.latest_order_tracking_id && (
                              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                                {c.latest_order_tracking_id}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td
                        style={{ padding: "12px 14px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.latest_order_id ? (
                          (isOwnerUser(user) || hasPerm(user, "manage_customers")) ? (
                            <select
                              value={c.latest_order_stage || ""}
                              onChange={(e) => changeOrderStage(c, e.target.value)}
                              disabled={stageChanging === c.id}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                fontFamily: "var(--font-main)",
                                borderRadius: 6,
                                padding: "3px 8px",
                                background: "var(--bg-surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text-secondary)",
                                cursor: stageChanging === c.id ? "not-allowed" : "pointer",
                              }}
                            >
                              <option value="">— No stage —</option>
                              {orderStages.map((s) => (
                                <option key={s.id} value={s.name}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          ) : c.latest_order_stage ? (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                              {c.latest_order_stage}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                          )
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          textAlign: "center",
                        }}
                      >
                        {c.order_count || 0}
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
                          {(isOwnerUser(user) || hasPerm(user, "delete_customers")) && (
                            <button
                              onClick={() => setConfirmDelete(c)}
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
                          )}
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

      {showReportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReportModal(false);
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
                marginBottom: 18,
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
                Sales Report
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
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
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              Excel download of every order marked 📬 Delivered (Settings → Order Stages), one row per order —
              delivered date, customer, city/pincode/state, items/HSN codes/quantities, COD/Prepaid, total amount,
              order type, the customer's assigned employee, and tracking ID/courier.
            </p>

            {reportError && (
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
                ⚠ {reportError}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button
                type="button"
                onClick={setReportRangeThisMonth}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-main)",
                }}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={setReportRangeLastMonth}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-main)",
                }}
              >
                Last Month
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <F label="From">
                <input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} style={inp} />
              </F>
              <F label="To">
                <input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} style={inp} />
              </F>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
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
                type="button"
                onClick={downloadSalesReport}
                disabled={reportDownloading}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  background: reportDownloading ? "var(--bg-hover)" : "var(--teal)",
                  border: "none",
                  color: "#fff",
                  fontFamily: "var(--font-main)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: reportDownloading ? "not-allowed" : "pointer",
                }}
              >
                {reportDownloading ? "Downloading..." : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
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
              maxWidth: 400,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--danger-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                marginBottom: 14,
              }}
            >
              ⚠️
            </div>
            <h2
              style={{
                fontFamily: "var(--font-main)",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              Delete customer?
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 22 }}>
              This will permanently delete <strong>{confirmDelete.name}</strong> and all their
              payment records, orders, and history. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-main)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => del(confirmDelete.id)}
                disabled={deleting === confirmDelete.id}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  background: "var(--danger)",
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: deleting === confirmDelete.id ? "not-allowed" : "pointer",
                  opacity: deleting === confirmDelete.id ? 0.6 : 1,
                  fontFamily: "var(--font-main)",
                }}
              >
                {deleting === confirmDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmBulkDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmBulkDelete(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
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
              maxWidth: 400,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--danger-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                marginBottom: 14,
              }}
            >
              ⚠️
            </div>
            <h2
              style={{
                fontFamily: "var(--font-main)",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              Delete {selectedIds.size} customer{selectedIds.size !== 1 ? "s" : ""}?
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 22 }}>
              This will permanently delete all {selectedIds.size} selected customer{selectedIds.size !== 1 ? "s" : ""}{" "}
              and their payment records, orders, and history. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setConfirmBulkDelete(false)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-main)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={bulkDelete}
                disabled={bulkDeleting}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  background: "var(--danger)",
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: bulkDeleting ? "not-allowed" : "pointer",
                  opacity: bulkDeleting ? 0.6 : 1,
                  fontFamily: "var(--font-main)",
                }}
              >
                {bulkDeleting ? "Deleting..." : "Delete All"}
              </button>
            </div>
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
const dateInputStyle = {
  padding: "10px 2px",
  background: "transparent",
  border: "none",
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
  cursor: "pointer",
  fontFamily: "var(--font-main)",
  width: 118,
};
