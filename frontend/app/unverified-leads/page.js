"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import LeadModal from "../../components/LeadModal";
import { isOwnerUser, hasPerm } from "../../lib/permissions";

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}, ${dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function UnverifiedLeadsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [stages, setStages] = useState([]);
  const [modalRow, setModalRow] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    const u = localStorage.getItem("crm_user");
    if (u) setUser(JSON.parse(u));
    load();
    api.get("/employees/list").then((r) => setEmployees(r.data)).catch(() => {});
    api.get("/stages").then((r) => setStages(r.data)).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/pending-leads");
      setRows(data);
    } catch (err) {
      if (err?.response?.status === 403) router.push("/dashboard");
    }
    setLoading(false);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const discard = async (row) => {
    if (!confirm(`Discard "${row.name}"? This cannot be undone.`)) return;
    setDeleting(row.id);
    try {
      await api.delete(`/pending-leads/${row.id}`);
      setRows((r) => r.filter((x) => x.id !== row.id));
      setSelected((s) => {
        const next = new Set(s);
        next.delete(row.id);
        return next;
      });
    } catch {
      showToast("Failed to discard", "error");
    }
    setDeleting(null);
  };

  const openPromote = (row) => setModalRow(row);
  const closeModal = () => setModalRow(null);

  const promote = async (form) => {
    await api.post("/leads", form);
    await api.delete(`/pending-leads/${modalRow.id}`);
    setRows((r) => r.filter((x) => x.id !== modalRow.id));
    closeModal();
    showToast(`✓ "${form.name}" added to Leads.`);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const bulkDiscard = async () => {
    if (selected.size === 0) return;
    if (
      !confirm(
        `Discard ${selected.size} selected lead${selected.size !== 1 ? "s" : ""}? This cannot be undone.`,
      )
    )
      return;
    setBulkDeleting(true);
    try {
      const { data } = await api.delete("/pending-leads/bulk", {
        data: { ids: Array.from(selected) },
      });
      setRows((r) => r.filter((x) => !selected.has(x.id)));
      setSelected(new Set());
      showToast(`✓ ${data.deleted} lead${data.deleted !== 1 ? "s" : ""} discarded.`);
    } catch {
      showToast("Failed to discard selected leads", "error");
    }
    setBulkDeleting(false);
  };

  if (loading)
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
        Loading...
      </div>
    );

  return (
    <div style={{ padding: "28px 32px" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === "error" ? "var(--danger)" : "var(--success)",
            color: "#fff",
            borderRadius: 10,
            padding: "12px 20px",
            fontFamily: "var(--font-main)",
            fontWeight: 600,
            fontSize: 13,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {selected.size > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            background: "var(--bg-surface)",
            border: "1px solid var(--teal)",
            borderRadius: 12,
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            fontFamily: "var(--font-main)",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 13, color: "var(--teal-light)" }}>
            {selected.size} selected
          </span>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <button
            onClick={bulkDiscard}
            disabled={bulkDeleting}
            style={{
              background: "transparent",
              border: "1px solid var(--danger)",
              borderRadius: 7,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--danger)",
              cursor: bulkDeleting ? "not-allowed" : "pointer",
              opacity: bulkDeleting ? 0.7 : 1,
              fontFamily: "var(--font-main)",
            }}
          >
            {bulkDeleting ? "Discarding…" : "Discard Selected"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 7,
              padding: "8px 14px",
              fontSize: 13,
              color: "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-main)",
            }}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-main)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
          Unverified Leads
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Rows auto-captured from a lead source with no usable phone number land here instead of Leads.
          Review each one — add it if it's worth following up, or discard it.
        </p>
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
        {rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div style={{ color: "var(--text-secondary)", fontFamily: "var(--font-main)", fontWeight: 600, marginBottom: 6 }}>
              Nothing to review
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Phone-less rows from your connected lead sources will show up here.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "var(--bg-surface)" }}>
                  <th style={thStyle}>
                    <input
                      type="checkbox"
                      checked={selected.size === rows.length && rows.length > 0}
                      onChange={toggleSelectAll}
                      style={{ cursor: "pointer", accentColor: "var(--teal)" }}
                    />
                  </th>
                  {["#", "Name", "Email", "Platform", "Notes", "Received", "Actions"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: selected.has(row.id) ? "var(--teal-dim)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        style={{ cursor: "pointer", accentColor: "var(--teal)" }}
                      />
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                      {row.name}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>
                      {row.email || <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: "rgba(91,163,217,0.13)", color: "var(--blue)", borderRadius: 5, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
                        {row.platform || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.notes}>
                      {row.notes || <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {fmtDate(row.created_at)}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openPromote(row)} style={actionBtn("var(--teal)")}>
                          Add to Leads
                        </button>
                        <button
                          onClick={() => discard(row)}
                          disabled={deleting === row.id}
                          style={{ ...actionBtn("var(--danger)"), opacity: deleting === row.id ? 0.5 : 1 }}
                        >
                          {deleting === row.id ? "…" : "Discard"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalRow && (
        <LeadModal
          lead={{
            name: modalRow.name,
            email: modalRow.email,
            platform: modalRow.platform,
            notes: modalRow.notes,
          }}
          employees={employees}
          stages={stages}
          onClose={closeModal}
          onSave={promote}
        />
      )}
    </div>
  );
}

const thStyle = {
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
};

const actionBtn = (color) => ({
  background: "transparent",
  border: `1px solid ${color}`,
  borderRadius: 6,
  padding: "5px 10px",
  color,
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "var(--font-main)",
  fontWeight: 600,
  whiteSpace: "nowrap",
});
