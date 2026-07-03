"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api, { formatCurrency } from "../../lib/api";
import LeadModal from "../../components/LeadModal";
import { STAGE_COLORS } from "../../lib/stages";
import { isOwnerUser, hasPerm } from "../../lib/permissions";
import { Users, Zap, TrendingUp, AlertTriangle, Bell, DollarSign, CreditCard, CheckCircle2, ChevronRight, Plus } from "lucide-react";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isOverdue(d) {
  return d && d.split("T")[0] < today();
}
function isToday(d) {
  return d && d.split("T")[0] === today();
}
function fmtDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("T")[0].split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day} ${months[parseInt(m) - 1]} ${y}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [todayLeads, setToday] = useState([]);
  const [duePay, setDuePay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editLead, setEditLead] = useState(null);
  const [modalOpen, setModal] = useState(false);
  const [user, setUser] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    const u = localStorage.getItem("crm_user");
    if (u) setUser(JSON.parse(u));
    api
      .get("/settings")
      .then((r) => localStorage.setItem("crm_settings", JSON.stringify(r.data)))
      .catch(() => {});
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, l, dp] = await Promise.all([
        api.get("/leads/stats"),
        api.get("/leads"),
        api.get("/customers/due/upcoming").catch(() => ({ data: [] })),
      ]);
      setStats(s.data);
      const leads = l.data;
      setOverdue(
        leads.filter(
          (x) =>
            isOverdue(x.follow_up_date) &&
            x.stage !== "Closed" &&
            x.stage !== "Converted",
        ),
      );
      setToday(leads.filter((x) => isToday(x.follow_up_date)));
      setDuePay(
        dp.data.filter((p) => {
          const d = (p.due_date || p.payment_date || "").split("T")[0];
          return d <= today();
        }),
      );
    } catch (err) {
      if (err?.response?.status === 401) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const openEdit = (lead) => {
    setEditLead(lead);
    setModal(true);
  };
  const closeModal = () => {
    setModal(false);
    setEditLead(null);
  };
  const saveLead = async (form) => {
    if (editLead?.id) await api.put(`/leads/${editLead.id}`, form);
    else await api.post("/leads", form);
    closeModal();
    loadAll();
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
          fontFamily: "var(--font-main)",
        }}
      >
        Loading dashboard...
      </div>
    );

  const totalNotif = overdue.length + todayLeads.length + duePay.length;

  const statCards = [
    {
      label: "Total Leads",
      value: stats?.total ?? 0,
      color: "var(--teal)",
      dim: "var(--teal-dim)",
      icon: <Users size={18} />,
    },
    {
      label: "Active",
      value: stats?.active ?? 0,
      color: "var(--teal-light)",
      dim: "var(--teal-dim)",
      icon: <Zap size={18} />,
    },
    {
      label: "Converted",
      value: stats?.customers ?? 0,
      color: "var(--success)",
      dim: "var(--success-dim)",
      icon: <TrendingUp size={18} />,
    },
    {
      label: "Overdue",
      value: stats?.overdue ?? 0,
      color: "var(--danger)",
      dim: "var(--danger-dim)",
      icon: <AlertTriangle size={18} />,
    },
    {
      label: "Follow-up Today",
      value: stats?.followup_today ?? 0,
      color: "var(--warn)",
      dim: "var(--warn-dim)",
      icon: <Bell size={18} />,
    },
  ];

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
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
            Dashboard
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Notification bell with dropdown */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              style={{
                background: notifOpen ? "var(--teal-dim)" : "var(--bg-card)",
                border: `1px solid ${notifOpen ? "var(--teal)" : "var(--border)"}`,
                borderRadius: 8,
                padding: "8px 10px",
                cursor: "pointer",
                color: notifOpen ? "var(--teal)" : "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                transition: "all 0.15s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {totalNotif > 0 && (
                <span style={{ background: "var(--danger)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 6px", fontFamily: "var(--font-main)" }}>
                  {totalNotif}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {notifOpen && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 340,
                background: "var(--bg-card)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                zIndex: 300,
                overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                    Notifications
                  </span>
                  {totalNotif > 0 && (
                    <span style={{ background: "var(--danger)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 8px" }}>
                      {totalNotif}
                    </span>
                  )}
                </div>

                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {totalNotif === 0 ? (
                    <div style={{ padding: "28px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>All clear! No pending alerts.</div>
                    </div>
                  ) : (
                    <>
                      {/* Overdue leads */}
                      {overdue.length > 0 && (
                        <>
                          <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: "var(--danger)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                            Overdue Follow-ups
                          </div>
                          {overdue.map((lead) => (
                            <div
                              key={`o-${lead.id}`}
                              onClick={() => { setNotifOpen(false); router.push(`/notifications?lead=${lead.id}`); }}
                              style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "background 0.12s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--danger-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)", flexShrink: 0 }}><AlertTriangle size={16} /></div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name}</div>
                                <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 1 }}>
                                  Follow-up: {fmtDate(lead.follow_up_date)}
                                </div>
                              </div>
                              <span style={{ color: "var(--text-muted)", flexShrink: 0, display: "flex" }}><ChevronRight size={14} /></span>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Today's follow-ups */}
                      {todayLeads.length > 0 && (
                        <>
                          <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: "var(--warn)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                            Follow-up Today
                          </div>
                          {todayLeads.map((lead) => (
                            <div
                              key={`t-${lead.id}`}
                              onClick={() => { setNotifOpen(false); router.push(`/notifications?lead=${lead.id}`); }}
                              style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "background 0.12s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--warn-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--warn)", flexShrink: 0 }}><Bell size={16} /></div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name}</div>
                                <div style={{ fontSize: 11, color: "var(--warn)", marginTop: 1 }}>Today</div>
                              </div>
                              <span style={{ color: "var(--text-muted)", flexShrink: 0, display: "flex" }}><ChevronRight size={14} /></span>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Due payments */}
                      {duePay.length > 0 && (
                        <>
                          <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: "var(--blue)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                            Payments Due
                          </div>
                          {duePay.slice(0, 3).map((p) => (
                            <div
                              key={`p-${p.id}`}
                              onClick={() => { setNotifOpen(false); router.push(`/customers/${p.customer_id}`); }}
                              style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "background 0.12s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--blue-dim, rgba(91,163,217,0.12))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", flexShrink: 0 }}><DollarSign size={16} /></div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.customer_name}</div>
                                <div style={{ fontSize: 11, color: "var(--blue)", marginTop: 1 }}>Payment due</div>
                              </div>
                              <span style={{ color: "var(--text-muted)", flexShrink: 0, display: "flex" }}><ChevronRight size={14} /></span>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                {totalNotif > 0 && (
                  <div
                    onClick={() => { setNotifOpen(false); router.push("/notifications"); }}
                    style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--teal-light)", fontFamily: "var(--font-main)", transition: "background 0.12s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    View All Notifications →
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setEditLead(null);
              setModal(true);
            }}
            style={{
              background: "var(--gradient-accent)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "9px 18px",
              fontFamily: "var(--font-main)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 32,
        }}
      >
        {statCards.map((sc) => (
          <div
            key={sc.label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "18px 20px",
              boxShadow: "var(--shadow-sm)",
              transition: "transform 0.18s ease, box-shadow 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "var(--radius-sm)",
                background: sc.dim,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: sc.color,
                marginBottom: 12,
              }}
            >
              {sc.icon}
            </div>
            <div
              style={{
                fontSize: 28,
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
                marginTop: 6,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {sc.label}
            </div>
          </div>
        ))}
      </div>

      {/* Due payments banner */}
      {duePay.length > 0 && (
        <div
          style={{
            background: "rgba(91,163,217,0.08)",
            border: "1px solid rgba(91,163,217,0.3)",
            borderRadius: 10,
            padding: "12px 18px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--blue)", display: "flex" }}><DollarSign size={20} /></span>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-main)",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--blue)",
                }}
              >
                {duePay.length} payment{duePay.length > 1 ? "s" : ""} due /
                overdue
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {duePay
                  .slice(0, 3)
                  .map((p) => p.customer_name)
                  .join(", ")}
                {duePay.length > 3 ? ` +${duePay.length - 3} more` : ""}
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push("/customers")}
            style={{
              background: "var(--blue)",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              padding: "6px 14px",
              fontFamily: "var(--font-main)",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            View Customers
          </button>
        </div>
      )}

      {/* Today follow-up banner */}
      {todayLeads.length > 0 && (
        <div
          style={{
            background: "rgba(224,160,80,0.08)",
            border: "1px solid rgba(224,160,80,0.3)",
            borderRadius: 10,
            padding: "12px 18px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--warn)", display: "flex" }}><Bell size={20} /></span>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-main)",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--warn)",
                }}
              >
                {todayLeads.length} lead{todayLeads.length > 1 ? "s" : ""} need
                follow-up today
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {todayLeads.map((l) => l.name).join(", ")}
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push("/notifications")}
            style={{
              background: "var(--warn)",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              padding: "6px 14px",
              fontFamily: "var(--font-main)",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            View All
          </button>
        </div>
      )}

      {/* Overdue leads */}
      {overdue.length > 0 && (
        <Section
          title={`${isOwnerUser(user) || hasPerm(user, "view_all_leads") ? "Team" : "My"} Overdue Follow-ups`}
          icon={<AlertTriangle size={16} />}
          iconColor="var(--danger)"
          count={overdue.length}
          accent="var(--danger)"
          accentDim="var(--danger-dim)"
        >
          <LeadTable leads={overdue} onEdit={openEdit} />
        </Section>
      )}

      {/* Due payments table */}
      {duePay.length > 0 && (
        <Section
          title="Overdue / Due Payments"
          icon={<CreditCard size={16} />}
          iconColor="var(--blue)"
          count={duePay.length}
          accent="var(--blue)"
          accentDim="var(--blue-dim)"
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 500,
              }}
            >
              <thead>
                <tr style={{ background: "var(--bg-surface)" }}>
                  {["Student", "Amount Due", "Due Date", "Action"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
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
                {duePay.slice(0, 5).map((p) => {
                  const overp = isOverdue(p.due_date || p.payment_date);
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                      onClick={() => router.push(`/customers/${p.customer_id}`)}
                    >
                      <td
                        style={{
                          padding: "11px 14px",
                          fontFamily: "var(--font-main)",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "var(--text-primary)",
                        }}
                      >
                        {p.customer_name}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--blue)",
                          fontFamily: "var(--font-main)",
                        }}
                      >
                        {formatCurrency(p.amount)}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          fontSize: 12,
                          color: overp ? "var(--danger)" : "var(--warn)",
                          fontWeight: 700,
                        }}
                      >
                        {overp ? "⚠ " : ""}
                        {fmtDate(p.due_date || p.payment_date)}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/customers/${p.customer_id}`);
                          }}
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
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Follow-up Today */}
      <Section
        title={`${isOwnerUser(user) || hasPerm(user, "view_all_leads") ? "Team" : "My"} Follow-up Today`}
        icon={<Bell size={16} />}
        iconColor="var(--warn)"
        count={todayLeads.length}
        accent="var(--warn)"
        accentDim="var(--warn-dim)"
      >
        {todayLeads.length === 0 ? (
          <div style={{ padding: "36px", textAlign: "center" }}>
            <div style={{ marginBottom: 10, color: "var(--success)", display: "flex", justifyContent: "center" }}><CheckCircle2 size={32} /></div>
            <div
              style={{
                fontFamily: "var(--font-main)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              No follow-ups scheduled for today
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              All caught up! Check the Leads page to manage your pipeline.
            </div>
          </div>
        ) : (
          <LeadTable leads={todayLeads} onEdit={openEdit} />
        )}
      </Section>

      {modalOpen && (
        <LeadModal lead={editLead} onClose={closeModal} onSave={saveLead} />
      )}
    </div>
  );
}

function Section({ title, count, accent, accentDim, icon, iconColor, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {icon && (
          <span style={{ color: iconColor || accent, display: "flex" }}>{icon}</span>
        )}
        <h2
          style={{
            fontFamily: "var(--font-main)",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h2>
        <span
          style={{
            background: accentDim,
            color: accent,
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 20,
            padding: "2px 9px",
            fontFamily: "var(--font-main)",
          }}
        >
          {count}
        </span>
      </div>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function LeadTable({ leads, onEdit }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}
      >
        <thead>
          <tr style={{ background: "var(--bg-surface)" }}>
            {[
              "#",
              "Name & Link",
              "Platform",
              "Stage",
              "Last Message",
              "Follow-up Date",
              "Action",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px",
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
          {leads.map((lead, i) => {
            const over =
              isOverdue(lead.follow_up_date) && lead.stage !== "Closed";
            const tod = isToday(lead.follow_up_date);
            const sc = STAGE_COLORS[lead.stage] || STAGE_COLORS["New"];
            return (
              <tr
                key={lead.id}
                style={{
                  background: over ? "rgba(224,82,82,0.04)" : "transparent",
                  borderBottom: "1px solid var(--border)",
                  transition: "background 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = over
                    ? "rgba(224,82,82,0.04)"
                    : "transparent")
                }
                onClick={() => onEdit(lead)}
              >
                <td
                  style={{
                    padding: "11px 14px",
                    color: "var(--text-muted)",
                    fontSize: 12,
                  }}
                >
                  {i + 1}
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-main)",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--text-primary)",
                    }}
                  >
                    {lead.name}
                  </div>
                  {lead.platform_link && (
                    <a
                      href={lead.platform_link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: 11,
                        color: "var(--teal)",
                        display: "block",
                        marginTop: 2,
                      }}
                    >
                      {lead.platform_link
                        .replace("https://", "")
                        .substring(0, 28)}
                      …
                    </a>
                  )}
                </td>
                <td style={{ padding: "11px 14px" }}>
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
                    {lead.platform}
                  </span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span
                    style={{
                      background: sc.bg,
                      color: sc.color,
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "var(--font-main)",
                    }}
                  >
                    {lead.stage}
                  </span>
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    maxWidth: 180,
                  }}
                >
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={lead.last_message}
                  >
                    {lead.last_message || (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </div>
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    whiteSpace: "nowrap",
                    fontSize: 12,
                  }}
                >
                  {lead.follow_up_date ? (
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
                      {fmtDate(lead.follow_up_date)}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
                <td
                  style={{ padding: "11px 14px" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onEdit(lead)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "5px 10px",
                      color: "var(--teal)",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "var(--font-main)",
                      fontWeight: 600,
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
