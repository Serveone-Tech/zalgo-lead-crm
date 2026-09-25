"use client";

function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Single-lead view — full detail (name, phone, the note/reason, last
// message) with the three Quick actions inline.
function SingleLead({ lead, onView, onSnooze, onDone }) {
  const reason = lead.notes?.trim();
  return (
    <div style={{ fontFamily: "var(--font-main)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        ⏰ Follow-up Due
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{lead.name}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{lead.phone} · {fmtTime(lead.follow_up_date)}</div>
      {reason && (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.4 }}>
          <span style={{ color: "var(--text-muted)" }}>Note: </span>{reason}
        </div>
      )}
      {lead.last_message && (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4, maxHeight: 40, overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ color: "var(--text-muted)" }}>Last: </span>{lead.last_message}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <ActionBtn onClick={() => onView(lead)}>View Lead</ActionBtn>
        <ActionBtn onClick={() => onSnooze(lead)}>Snooze 1hr</ActionBtn>
        <ActionBtn onClick={() => onDone(lead)} accent="var(--success)">Mark Done</ActionBtn>
      </div>
    </div>
  );
}

// Multiple leads due in the same poll cycle — a compact stacked list
// instead of N separate popups, each row still carrying its own Quick
// actions so acting on one doesn't force dealing with the rest first.
function GroupedLeads({ leads, onView, onSnooze, onDone }) {
  return (
    <div style={{ fontFamily: "var(--font-main)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        ⏰ {leads.length} Follow-ups Due
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
        {leads.map((lead) => (
          <div key={lead.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.name}</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{lead.phone}</div>
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <IconBtn title="View Lead" onClick={() => onView(lead)}>👁</IconBtn>
              <IconBtn title="Snooze 1hr" onClick={() => onSnooze(lead)}>⏰</IconBtn>
              <IconBtn title="Mark Done" onClick={() => onDone(lead)} accent="var(--success)">✓</IconBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, accent = "var(--teal-light)" }) {
  return (
    <button
      onClick={onClick}
      style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "transparent", border: `1px solid ${accent}`, color: accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-main)" }}
    >
      {children}
    </button>
  );
}

function IconBtn({ children, title, onClick, accent = "var(--text-secondary)" }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{ width: 24, height: 24, borderRadius: 5, background: "transparent", border: "1px solid var(--border)", color: accent, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {children}
    </button>
  );
}

export default function FollowUpToastContent({ leads, onView, onSnooze, onDone }) {
  if (leads.length === 1) {
    return <SingleLead lead={leads[0]} onView={onView} onSnooze={onSnooze} onDone={onDone} />;
  }
  return <GroupedLeads leads={leads} onView={onView} onSnooze={onSnooze} onDone={onDone} />;
}
