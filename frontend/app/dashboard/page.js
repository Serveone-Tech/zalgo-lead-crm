"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import LeadModal from "../../components/LeadModal";

const STAGE_COLORS = {
  New: { bg: "rgba(82,184,138,0.12)", color: "#52b88a" },
  Active: { bg: "rgba(0,168,173,0.13)", color: "#00a8ad" },
  "Follow-up": { bg: "rgba(224,160,80,0.13)", color: "#e0a050" },
  Booked: { bg: "rgba(91,163,217,0.13)", color: "#5ba3d9" },
  Closed: { bg: "rgba(100,100,100,0.13)", color: "#888" },
};

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
  const [loading, setLoading] = useState(true);
  const [editLead, setEditLead] = useState(null);
  const [modalOpen, setModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        api.get("/leads/stats"),
        api.get("/leads"),
      ]);
      setStats(s.data);
      const leads = l.data;
      setOverdue(
        leads.filter(
          (x) => isOverdue(x.follow_up_date) && x.stage !== "Closed",
        ),
      );
      setToday(leads.filter((x) => isToday(x.follow_up_date)));
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

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

  const totalNotif = overdue.length + todayLeads.length;

  const statCards = [
    {
      label: "Total Leads",
      value: stats?.total ?? 0,
      color: "var(--teal)",
      icon: "👥",
    },
    {
      label: "Active",
      value: stats?.active ?? 0,
      color: "var(--teal-light)",
      icon: "⚡",
    },
    {
      label: "Booked",
      value: stats?.booked ?? 0,
      color: "var(--blue)",
      icon: "📅",
    },
    {
      label: "Overdue",
      value: stats?.overdue ?? 0,
      color: "var(--danger)",
      icon: "⚠️",
    },
    {
      label: "Follow-up Today",
      value: stats?.followup_today ?? 0,
      color: "var(--warn)",
      icon: "🔔",
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
          {/* Notification bell */}
          <button
            onClick={() => router.push("/notifications")}
            style={{
              position: "relative",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 10px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--teal)";
              e.currentTarget.style.color = "var(--teal)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {totalNotif > 0 && (
              <span
                style={{
                  background: "var(--danger)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 20,
                  padding: "1px 6px",
                  fontFamily: "var(--font-main)",
                }}
              >
                {totalNotif}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setEditLead(null);
              setModal(true);
            }}
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
            <span style={{ fontSize: 16 }}>+</span> Add Lead
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
              borderRadius: 12,
              padding: "16px 18px",
              borderTop: `3px solid ${sc.color}`,
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{sc.icon}</div>
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

      {/* Today's notification banner */}
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
            <span style={{ fontSize: 18 }}>🔔</span>
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

      {/* Overdue */}
      {overdue.length > 0 && (
        <Section
          title="⚠ Overdue Follow-ups"
          count={overdue.length}
          accent="var(--danger)"
          accentDim="var(--danger-dim)"
        >
          <LeadTable leads={overdue} onEdit={openEdit} />
        </Section>
      )}

      {/* Today's follow-ups */}
      <Section
        title="🔔 Follow-up Today"
        count={todayLeads.length}
        accent="var(--warn)"
        accentDim="var(--warn-dim)"
      >
        {todayLeads.length === 0 ? (
          <div style={{ padding: "36px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>✅</div>
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

function Section({ title, count, accent, accentDim, children }) {
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
          borderRadius: 12,
          overflow: "hidden",
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
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}
      >
        <thead>
          <tr style={{ background: "var(--bg-surface)" }}>
            {[
              "#",
              "Name",
              "Platform",
              "Stage",
              "Last Message",
              "Follow-up Date",
              "Notes",
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
                  style={{
                    padding: "11px 14px",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    maxWidth: 160,
                  }}
                >
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={lead.notes}
                  >
                    {lead.notes || (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </div>
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
