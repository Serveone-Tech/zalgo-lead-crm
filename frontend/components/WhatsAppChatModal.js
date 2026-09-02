"use client";
import WhatsAppChat from "./WhatsAppChat";

// A dedicated chat window, separate from the Edit Lead form — opening a
// lead's WhatsApp thread shouldn't require wading through name/stage/notes
// fields first, and a live chat doesn't belong buried at the bottom of an
// edit form anyway.
export default function WhatsAppChatModal({ lead, onClose }) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 250,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 20px 18px",
          width: "100%",
          maxWidth: 460,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--font-main)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              💬 {lead.name || "WhatsApp Chat"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{lead.phone}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 20, cursor: "pointer", padding: "2px 6px", borderRadius: 6 }}
          >
            ✕
          </button>
        </div>

        <WhatsAppChat leadId={lead.id} />
      </div>
    </div>
  );
}
