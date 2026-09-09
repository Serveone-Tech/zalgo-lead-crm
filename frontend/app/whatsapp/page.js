"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import WhatsAppChat from "../../components/WhatsAppChat";

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function fmtTime(d) {
  if (!d) return "";
  const dt = new Date(d);
  const now = new Date();
  if (dt.toDateString() === now.toDateString()) {
    return dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (dt.toDateString() === yest.toDateString()) return "Yesterday";
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const AVATAR_COLORS = ["#00868a", "#0891b2", "#7c3aed", "#c026d3", "#dc2626", "#d97706", "#059669", "#2563eb"];
function avatarColor(seed) {
  let h = 0;
  for (let i = 0; i < (seed || "").length; i++) h = (h * 31 + seed.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

// A dedicated full-page WhatsApp-style inbox — every lead with a phone
// number in one scrollable list on the left (sorted by most recent
// activity, like a real WhatsApp chat list), click one to open its full
// thread on the right using the same WhatsAppChat component the per-lead
// modal already uses.
export default function WhatsAppInboxPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    load(false);
    const iv = setInterval(() => load(true), 4000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (silent) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get("/leads");
      setLeads(data.filter((l) => l.phone));
    } catch {
      // next poll retries
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const sorted = useMemo(
    () => [...leads].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)),
    [leads],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (l) => (l.name || "").toLowerCase().includes(q) || (l.phone || "").includes(q),
    );
  }, [sorted, search]);

  // Keep the currently-open chat's header in sync when a poll brings back
  // a fresher last_message/stage for it.
  useEffect(() => {
    if (!selected) return;
    const fresh = leads.find((l) => l.id === selected.id);
    if (fresh && fresh.updated_at !== selected.updated_at) setSelected(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-base)" }}>
      {/* ── Conversation list ─────────────────────────────────── */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border)",
          background: "var(--bg-card)",
        }}
      >
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--border)" }}>
          <h1
            style={{
              fontFamily: "var(--font-main)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🟢 WhatsApp
          </h1>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or number"
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 12.5, color: "var(--text-muted)" }}>
              Loading chats...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 12.5, color: "var(--text-muted)" }}>
              {search ? "No matches" : "No leads with a phone number yet"}
            </div>
          ) : (
            filtered.map((l) => {
              const active = selected?.id === l.id;
              return (
                <div
                  key={l.id}
                  onClick={() => setSelected(l)}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: "12px 16px",
                    cursor: "pointer",
                    background: active ? "var(--bg-hover)" : "transparent",
                    borderLeft: active ? "3px solid var(--teal)" : "3px solid transparent",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: avatarColor(l.name || l.phone),
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0,
                      fontFamily: "var(--font-main)",
                    }}
                  >
                    {initials(l.name || l.phone)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-main)",
                          fontWeight: 600,
                          fontSize: 13.5,
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {l.name || l.phone}
                      </span>
                      <span style={{ fontSize: 10.5, color: "var(--text-muted)", flexShrink: 0 }}>
                        {fmtTime(l.updated_at)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginTop: 2,
                      }}
                    >
                      {l.last_message || l.phone}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Open chat ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {selected ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 20px",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-card)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: avatarColor(selected.name || selected.phone),
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                  fontFamily: "var(--font-main)",
                }}
              >
                {initials(selected.name || selected.phone)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                  {selected.name || "Unknown"}
                </div>
                <a href={`tel:${selected.phone}`} style={{ fontSize: 12, color: "var(--teal-light)", textDecoration: "none" }}>
                  {selected.phone}
                </a>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <WhatsAppChat leadId={selected.id} fullHeight />
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: 46 }}>💬</div>
            <div style={{ fontFamily: "var(--font-main)", fontSize: 14 }}>Select a chat to start messaging</div>
          </div>
        )}
      </div>
    </div>
  );
}
