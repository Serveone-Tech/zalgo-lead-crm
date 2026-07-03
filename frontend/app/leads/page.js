"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import LeadModal from "../../components/LeadModal";
import KanbanBoard from "../../components/KanbanBoard";
import BulkUploadModal from "../../components/BulkUploadModal";
import { Upload, Plus } from "lucide-react";
import { STAGE_COLORS, STAGES as FALLBACK_STAGES, stageStyle } from "../../lib/stages";
import { isOwnerUser, hasPerm } from "../../lib/permissions";

function today() {
  return new Date().toISOString().split("T")[0];
}
function isOverdue(d) {
  return d && d.split("T")[0] < today();
}
function isToday(d) {
  return d && d.split("T")[0] === today();
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageF, setStageF] = useState("");
  const [dateF, setDateF] = useState("");
  const [modalOpen, setModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("table");
  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [dynamicStages, setDynamicStages] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    const u = localStorage.getItem("crm_user");
    if (u) setUser(JSON.parse(u));
    load();
    api.get("/employees/list").then((r) => setEmployees(r.data)).catch(() => {});
    api.get("/stages").then((r) => setDynamicStages(r.data)).catch(() => {});
  }, []);

  const canAssign = isOwnerUser(user) || hasPerm(user, "assign_leads");

  const employeeNames = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.name])),
    [employees],
  );

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/leads");
      setLeads(data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        const q = search.toLowerCase();
        if (
          q &&
          !l.name.toLowerCase().includes(q) &&
          !l.last_message?.toLowerCase().includes(q) &&
          !l.notes?.toLowerCase().includes(q) &&
          !l.platform?.toLowerCase().includes(q)
        )
          return false;
        if (stageF && l.stage !== stageF) return false;
        if (dateF === "overdue" && !isOverdue(l.follow_up_date)) return false;
        if (dateF === "today" && !isToday(l.follow_up_date)) return false;
        return true;
      }),
    [leads, search, stageF, dateF],
  );

  const openAdd = () => {
    setEditLead(null);
    setModal(true);
  };
  const openEdit = (l) => {
    setEditLead(l);
    setModal(true);
  };
  const closeModal = () => {
    setModal(false);
    setEditLead(null);
  };

  const saveLead = async (form) => {
    const wasConverted =
      editLead?.stage !== "Converted" && form.stage === "Converted";
    if (editLead?.id) await api.put(`/leads/${editLead.id}`, form);
    else await api.post("/leads", form);
    closeModal();
    load();
    if (wasConverted) showToast("✓ Lead converted! Added to Customers.");
  };

  const deleteLead = async (id) => {
    if (!confirm("Delete this lead permanently?")) return;
    setDeleting(id);
    await api.delete(`/leads/${id}`);
    setDeleting(null);
    load();
  };

  const changeStage = async (lead, stage) => {
    const wasConverted = lead.stage !== "Converted" && stage === "Converted";
    await api.put(`/leads/${lead.id}`, { ...lead, stage });
    load();
    if (wasConverted) showToast("✓ Lead converted! Added to Customers.");
  };

  const changeAssignee = async (lead, assigned_to) => {
    await api.put(`/leads/${lead.id}`, {
      ...lead,
      assigned_to: assigned_to || null,
    });
    load();
  };

  const terminalStages = dynamicStages.length
    ? dynamicStages.slice(-2).map(s => s.name)
    : ["Converted", "Closed"];
  const overdueCount = leads.filter(
    (l) => isOverdue(l.follow_up_date) && !terminalStages.includes(l.stage),
  ).length;

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background: "var(--success)",
            color: "#fff",
            borderRadius: 10,
            padding: "12px 20px",
            fontFamily: "var(--font-main)",
            fontWeight: 600,
            fontSize: 13,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
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
            Leads
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            {leads.length} total lead{leads.length !== 1 ? "s" : ""}
            {overdueCount > 0 && (
              <span style={{ color: "var(--danger)", marginLeft: 10 }}>
                • {overdueCount} overdue
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 3,
            }}
          >
            {["table", "kanban"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: view === v ? "var(--gradient-accent)" : "transparent",
                  color: view === v ? "#fff" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "var(--font-main)",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setBulkOpen(true)}
            style={{
              background: "var(--bg-card)",
              color: "var(--teal-light)",
              border: "1px solid var(--teal)",
              borderRadius: "var(--radius-sm)",
              padding: "9px 16px",
              fontFamily: "var(--font-main)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Upload size={15} /> Bulk Upload
          </button>
          <button
            onClick={openAdd}
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

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "14px 18px",
          alignItems: "stretch",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search by name, message, notes..."
          style={{
            flex: 1,
            minWidth: 220,
            padding: "10px 14px",
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text-primary)",
            fontSize: 14,
            outline: "none",
            fontFamily: "var(--font-main)",
          }}
        />
        <select
          value={stageF}
          onChange={(e) => setStageF(e.target.value)}
          style={selStyle}
        >
          <option value="">All Stages</option>
          {(dynamicStages.length ? dynamicStages : FALLBACK_STAGES.map(n => ({ name: n }))).map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
        <select
          value={dateF}
          onChange={(e) => setDateF(e.target.value)}
          style={selStyle}
        >
          <option value="">All Dates</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
        </select>
        {(search || stageF || dateF) && (
          <button
            onClick={() => {
              setSearch("");
              setStageF("");
              setDateF("");
            }}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-muted)",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "var(--font-main)",
              fontWeight: 500,
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table or Kanban */}
      {view === "kanban" ? (
        loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            Loading leads...
          </div>
        ) : (
          <KanbanBoard
            leads={filtered}
            stages={dynamicStages}
            onStageChange={(lead, stage) => changeStage(lead, stage)}
            onEdit={openEdit}
            employeeNames={employeeNames}
            currentUserId={user?.id}
          />
        )
      ) : (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
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
            Loading leads...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-main)",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {leads.length === 0 ? "No leads yet" : "No matching leads"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {leads.length === 0
                ? 'Click "+ Add Lead" to get started'
                : "Try adjusting your filters"}
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
                  {/* Same columns as the form fields */}
                  {[
                    "#",
                    "Name & Link",
                    "Phone",
                    "Platform",
                    "Stage",
                    "Assigned",
                    "Last Message",
                    "Follow-up",
                    "Notes",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
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
                {filtered.map((lead, i) => {
                  const over =
                    isOverdue(lead.follow_up_date) &&
                    lead.stage !== "Closed" &&
                    lead.stage !== "Converted";
                  const tod = isToday(lead.follow_up_date);
                  const sc = stageStyle(lead.stage, dynamicStages);
                  return (
                    <tr
                      key={lead.id}
                      style={{
                        background: over
                          ? "rgba(224,82,82,0.04)"
                          : "transparent",
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = over
                          ? "rgba(224,82,82,0.04)"
                          : "transparent")
                      }
                    >
                      {/* # */}
                      <td
                        style={{
                          padding: "12px 14px",
                          color: "var(--text-muted)",
                          fontSize: 12,
                        }}
                      >
                        {i + 1}
                      </td>

                      {/* Name & Link */}
                      <td style={{ padding: "12px 14px" }}>
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
                        {lead.platform_link ? (
                          <a
                            href={lead.platform_link}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 11,
                              color: "var(--teal)",
                              display: "block",
                              marginTop: 2,
                            }}
                          >
                            {lead.platform_link
                              .replace("https://", "")
                              .substring(0, 30)}
                            {lead.platform_link.length > 33 ? "…" : ""}
                          </a>
                        ) : (
                          <span
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            No link
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            style={{ fontSize: 12, color: "var(--teal-light)", fontFamily: "var(--font-main)", textDecoration: "none" }}
                          >
                            {lead.phone}
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>

                      {/* Platform */}
                      <td style={{ padding: "12px 14px" }}>
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

                      {/* Stage dropdown */}
                      <td
                        style={{ padding: "12px 14px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={lead.stage}
                          onChange={(e) => changeStage(lead, e.target.value)}
                          style={{
                            background: sc.bg,
                            color: sc.color,
                            border: `1px solid ${sc.color}44`,
                            borderRadius: 20,
                            padding: "3px 10px",
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "var(--font-main)",
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          {(dynamicStages.length ? dynamicStages : FALLBACK_STAGES.map(n => ({ name: n }))).map((s) => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Assigned employee */}
                      <td
                        style={{ padding: "12px 14px", fontSize: 12 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canAssign ? (
                          <select
                            value={lead.assigned_to || ""}
                            onChange={(e) => changeAssignee(lead, e.target.value)}
                            style={{
                              background: lead.assigned_to ? "var(--teal-dim)" : "var(--bg-input)",
                              color: lead.assigned_to ? "var(--teal-light)" : "var(--text-muted)",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              fontFamily: "var(--font-main)",
                              cursor: "pointer",
                              outline: "none",
                              maxWidth: 150,
                            }}
                          >
                            <option value="">Unassigned</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name}
                              </option>
                            ))}
                          </select>
                        ) : lead.assigned_to ? (
                          <span
                            style={{
                              color: "var(--teal-light)",
                              background: "var(--teal-dim)",
                              borderRadius: 6,
                              padding: "2px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {employeeNames[lead.assigned_to] ||
                              (lead.assigned_to === user?.id ? "You" : "Assigned")}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>Unassigned</span>
                        )}
                      </td>

                      {/* Last Message */}
                      <td
                        style={{
                          padding: "12px 14px",
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
                            <span style={{ color: "var(--text-muted)" }}>
                              —
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Follow-up Date */}
                      <td
                        style={{
                          padding: "12px 14px",
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

                      {/* Notes */}
                      <td
                        style={{
                          padding: "12px 14px",
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
                            <span style={{ color: "var(--text-muted)" }}>
                              —
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => openEdit(lead)}
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
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.borderColor =
                                "var(--teal)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.borderColor =
                                "var(--border)")
                            }
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            disabled={deleting === lead.id}
                            style={{
                              background: "transparent",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              padding: "5px 10px",
                              color: "var(--danger)",
                              fontSize: 11,
                              cursor: "pointer",
                              fontFamily: "var(--font-main)",
                              fontWeight: 600,
                              opacity: deleting === lead.id ? 0.5 : 1,
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
                            {deleting === lead.id ? "…" : "Del"}
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
      )}

      {!loading && filtered.length > 0 && view === "table" && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--text-muted)",
            textAlign: "right",
          }}
        >
          Showing {filtered.length} of {leads.length} leads
        </div>
      )}

      {modalOpen && (
        <LeadModal
          lead={editLead}
          employees={employees}
          stages={dynamicStages}
          onClose={closeModal}
          onSave={saveLead}
        />
      )}
      {bulkOpen && (
        <BulkUploadModal
          onClose={() => setBulkOpen(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

const selStyle = {
  padding: "10px 14px",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  cursor: "pointer",
  fontFamily: "var(--font-main)",
  minWidth: 140,
};
