"use client";
import { useRef, useState } from "react";
import { Image as ImageIcon, Video, FileText, Upload, X, Loader2 } from "lucide-react";
import api, { API_ORIGIN } from "../../lib/api";

const HINTS = {
  IMAGE: { accept: "image/jpeg,image/png", hint: "JPEG or PNG, up to 5MB", Icon: ImageIcon },
  VIDEO: { accept: "video/mp4,video/3gpp", hint: "MP4 or 3GPP, up to 16MB", Icon: Video },
  DOCUMENT: { accept: "application/pdf", hint: "PDF, up to 100MB", Icon: FileText },
};

// Shared by TemplateHeaderBuilder (main template header) and
// TemplateCardBuilder (each carousel card's header, image/video only) —
// uploads through the same /whatsapp-templates/media/upload endpoint
// (Meta's Resumable Upload API under the hood) and shows the resulting
// media inline once it's ready for submission.
export default function MediaUploadField({ format, value, onChange, compact = false }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const meta = HINTS[format];
  const Icon = meta?.Icon || FileText;
  const hasMedia = !!value?.media_handle;

  const uploadFile = async (file) => {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post(`/whatsapp-templates/media/upload?format=${format}`, form);
      onChange({ media_url: data.media_url, media_handle: data.media_handle, mime_type: data.mime_type, file_name: data.file_name });
    } catch (e) {
      setError(e?.response?.data?.error || "Could not upload media");
    } finally {
      setUploading(false);
    }
  };

  const remove = () => onChange({ media_url: undefined, media_handle: undefined, mime_type: undefined, file_name: undefined });

  if (!meta) return null;

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={meta.accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = "";
        }}
      />

      {!hasMedia && !uploading && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            width: "100%", padding: compact ? "16px 10px" : "24px 12px", borderRadius: 8,
            border: "1px dashed var(--border-strong)", background: "var(--bg-input)",
            color: "var(--teal)", cursor: "pointer", fontFamily: "var(--font-main)",
          }}
        >
          <Upload size={compact ? 15 : 18} />
          <span style={{ fontSize: compact ? 11.5 : 12.5, fontWeight: 600 }}>Upload {format.toLowerCase()}</span>
          {!compact && <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{meta.hint}</span>}
        </button>
      )}

      {uploading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px", justifyContent: "center", color: "var(--text-muted)", fontSize: 12 }}>
          <Loader2 size={14} className="spin" /> Uploading to Meta…
        </div>
      )}

      {hasMedia && !uploading && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 10, background: "var(--bg-input)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {format === "IMAGE" ? (
              <img src={`${API_ORIGIN}${value.media_url}`} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 6, background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color="var(--teal)" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {value.file_name || "Uploaded"}
              </div>
              <div style={{ fontSize: 10, color: "var(--success)", marginTop: 2 }}>✓ Ready</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={smallBtn}>Replace</button>
              <button type="button" onClick={remove} style={{ ...smallBtn, color: "var(--danger)" }}><X size={11} /></button>
            </div>
          </div>
        </div>
      )}

      {error && <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 6 }}>{error}</div>}
    </div>
  );
}

const smallBtn = {
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "4px 9px", borderRadius: 6, border: "1px solid var(--border)",
  background: "transparent", color: "var(--text-secondary)", fontSize: 10.5,
  fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-main)",
};
