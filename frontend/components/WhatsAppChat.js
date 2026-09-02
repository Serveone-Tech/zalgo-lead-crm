"use client";
import { useState, useEffect, useRef } from "react";
import api, { API_ORIGIN } from "../lib/api";

function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// A real two-way WhatsApp thread for a lead — inbound customer messages
// (including images/files Meta hands us) and outbound replies sent live
// through the tenant's own connected WhatsApp number, in one scrolling
// view instead of a flat note log.
export default function WhatsAppChat({ leadId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const bottomRef = useRef(null);

  const load = async (silent) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get(`/leads/${leadId}/messages`);
      // Backend returns newest-first (for the generic note log) — a chat
      // reads oldest-first, newest at the bottom.
      setMessages([...data].reverse());
    } catch {
      // no-op — next poll retries
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
    const iv = setInterval(() => load(true), 10000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setError("");
    setSending(true);
    try {
      await api.post(`/leads/${leadId}/whatsapp-send`, { message: text.trim() });
      setText("");
      load(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div
        style={{
          maxHeight: 320,
          minHeight: 160,
          overflowY: "auto",
          border: "1px solid var(--border)",
          borderRadius: 8,
          marginBottom: 10,
          padding: "10px 10px 4px",
          background: "var(--bg-surface)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {loading ? (
          <div style={{ padding: 14, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>Loading chat...</div>
        ) : messages.length === 0 ? (
          <div style={{ padding: 14, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            No messages yet on this number
          </div>
        ) : (
          messages.map((m) => {
            const out = m.direction === "out";
            const isImage = m.media_type === "image";
            const hasMedia = !!m.media_url;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: out ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "78%",
                    background: out ? "var(--teal)" : "var(--bg-card)",
                    color: out ? "#fff" : "var(--text-primary)",
                    border: out ? "none" : "1px solid var(--border)",
                    borderRadius: out ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                    padding: "8px 10px",
                  }}
                >
                  {hasMedia && isImage && (
                    <img
                      src={`${API_ORIGIN}${m.media_url}`}
                      alt={m.media_name || "image"}
                      onClick={() => setPreview(m)}
                      style={{ maxWidth: 220, maxHeight: 220, borderRadius: 6, cursor: "pointer", display: "block", marginBottom: 4 }}
                    />
                  )}
                  {hasMedia && !isImage && (
                    <a
                      href={`${API_ORIGIN}${m.media_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: out ? "#fff" : "var(--teal)",
                        textDecoration: "underline",
                        marginBottom: 4,
                      }}
                    >
                      📎 {m.media_name || `${m.media_type || "file"}`}
                    </a>
                  )}
                  {m.message && !(hasMedia && `[${m.media_type}]` === m.message) && (
                    <div style={{ fontSize: 13, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{m.message}</div>
                  )}
                  <div style={{ fontSize: 9.5, opacity: 0.75, marginTop: 3, textAlign: "right" }}>{fmtTime(m.message_date)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div style={{ fontSize: 11, color: "var(--danger)", marginBottom: 8 }}>⚠ {error}</div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a WhatsApp reply..."
          style={{
            flex: 1,
            padding: "9px 11px",
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text-primary)",
            fontSize: 13,
            outline: "none",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !text.trim()}
          style={{
            padding: "9px 16px",
            borderRadius: "var(--radius-sm)",
            background: sending ? "var(--bg-hover)" : "var(--gradient-accent)",
            border: "none",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "var(--font-main)",
            cursor: sending || !text.trim() ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>

      {preview && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreview(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 400,
            padding: 20,
          }}
        >
          <img
            src={`${API_ORIGIN}${preview.media_url}`}
            alt={preview.media_name || "image"}
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, objectFit: "contain" }}
          />
        </div>
      )}
    </div>
  );
}
