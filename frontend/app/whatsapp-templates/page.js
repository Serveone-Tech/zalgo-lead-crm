"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Trash2, RefreshCw, Send, Pencil, MessageSquareText } from "lucide-react";
import api from "../../lib/api";
import Pagination from "../../components/Pagination";
import TemplateStatusBadge from "../../components/whatsapp-templates/TemplateStatusBadge";
import { useToast } from "../../components/ToastProvider";
import { useConfirmDialog } from "../../components/ConfirmDialogProvider";

const STATUS_FILTERS = ["all", "draft", "pending", "approved", "rejected"];
const CATEGORY_FILTERS = ["all", "MARKETING", "UTILITY", "AUTHENTICATION"];
const EDITABLE_STATUSES = ["draft", "rejected", "error"];

export default function WhatsAppTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const showToast = useToast();
  const confirmDialog = useConfirmDialog();

  const load = () => {
    setLoading(true);
    api
      .get("/whatsapp-templates")
      .then(({ data }) => setTemplates(data))
      .catch((err) => {
        if (err?.response?.status === 403) router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch = !search.trim() || t.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchCategory = categoryFilter === "all" || t.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [templates, search, statusFilter, categoryFilter]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => setPage(1), [search, statusFilter, categoryFilter]);
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const duplicate = async (t) => {
    setBusyId(t.id);
    try {
      const { data } = await api.post(`/whatsapp-templates/${t.id}/duplicate`);
      showToast(`Duplicated as "${data.name}"`);
      load();
    } catch (e) {
      showToast(e?.response?.data?.error || "Could not duplicate template", "error");
    }
    setBusyId(null);
  };

  const syncStatus = async (t) => {
    setBusyId(t.id);
    try {
      const { data } = await api.post(`/whatsapp-templates/${t.id}/sync-status`);
      showToast(`Status: ${data.status}`);
      load();
    } catch (e) {
      showToast(e?.response?.data?.error || "Could not refresh status", "error");
    }
    setBusyId(null);
  };

  const submitNow = async (t) => {
    setBusyId(t.id);
    try {
      await api.post(`/whatsapp-templates/${t.id}/submit`);
      showToast("Submitted to Meta for review");
      load();
    } catch (e) {
      showToast(e?.response?.data?.error || "Meta rejected this template", "error");
      load();
    }
    setBusyId(null);
  };

  const remove = async (t) => {
    setBusyId(t.id);
    await confirmDialog({
      title: "Delete Template",
      message: `Delete "${t.name}"? This can't be undone.`,
      confirmLabel: "Delete Template",
      danger: true,
      onConfirm: async () => {
        await api.delete(`/whatsapp-templates/${t.id}`);
        showToast("Template deleted");
        load();
      },
    });
    setBusyId(null);
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-main)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <MessageSquareText size={22} /> WhatsApp Templates
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Build, validate, and submit Meta WhatsApp Business templates for review.
          </p>
        </div>
        <button
          onClick={() => router.push("/whatsapp-templates/builder")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--gradient-accent)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "var(--shadow-glow)" }}
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by name..."
          style={{ flex: 1, minWidth: 220, padding: "9px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none" }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
          {CATEGORY_FILTERS.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ marginBottom: 12, color: "var(--teal)", display: "flex", justifyContent: "center" }}><MessageSquareText size={36} /></div>
            <div style={{ color: "var(--text-secondary)", fontFamily: "var(--font-main)", fontWeight: 600, marginBottom: 6 }}>
              {templates.length === 0 ? "No templates yet" : "No matching templates"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {templates.length === 0 ? 'Click "+ New Template" to build your first one' : "Try adjusting your filters"}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ background: "var(--bg-surface)" }}>
                  {["Name", "Category", "Language", "Header", "Status", "Updated", "Actions"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((t) => {
                  const busy = busyId === t.id;
                  const editable = EDITABLE_STATUSES.includes(t.status);
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ ...td, fontFamily: "var(--font-main)", fontWeight: 600, color: "var(--text-primary)" }}>{t.name}</td>
                      <td style={td}>{t.category}</td>
                      <td style={td}>{t.language}</td>
                      <td style={td}>{t.header_format === "TEXT" ? "Text" : t.header_format === "NONE" ? "—" : t.header_format}</td>
                      <td style={td}>
                        <TemplateStatusBadge status={t.status} size="sm" />
                        {t.rejection_reason && (
                          <div style={{ fontSize: 10.5, color: "var(--danger)", marginTop: 4, maxWidth: 180 }}>{t.rejection_reason}</div>
                        )}
                      </td>
                      <td style={{ ...td, fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {new Date(t.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {editable && (
                            <ActionBtn title="Edit" onClick={() => router.push(`/whatsapp-templates/builder?id=${t.id}`)} icon={<Pencil size={12} />} />
                          )}
                          {editable && (
                            <ActionBtn title="Submit for review" onClick={() => submitNow(t)} disabled={busy} icon={<Send size={12} />} color="var(--teal)" />
                          )}
                          {t.meta_template_id && (
                            <ActionBtn title="Refresh status from Meta" onClick={() => syncStatus(t)} disabled={busy} icon={<RefreshCw size={12} />} />
                          )}
                          <ActionBtn title="Duplicate as new template" onClick={() => duplicate(t)} disabled={busy} icon={<Copy size={12} />} />
                          <ActionBtn title="Delete" onClick={() => remove(t)} disabled={busy} icon={<Trash2 size={12} />} color="var(--danger)" />
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
        <Pagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} total={filtered.length} />
      )}
    </div>
  );
}

function ActionBtn({ title, onClick, disabled, icon, color = "var(--text-secondary)" }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 26, height: 26, borderRadius: 6,
        background: "transparent", border: "1px solid var(--border)",
        color, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}
    </button>
  );
}

const th = {
  padding: "11px 14px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600,
  letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--border)",
  fontFamily: "var(--font-main)", whiteSpace: "nowrap",
};
const td = { padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" };
const selectStyle = {
  padding: "9px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
  color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer",
};
