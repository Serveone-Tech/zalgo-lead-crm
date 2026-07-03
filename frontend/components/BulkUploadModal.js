"use client";
import { useState, useRef, useCallback } from "react";
import api from "../lib/api";
import { Upload, CheckCircle2, FileSpreadsheet } from "lucide-react";

const FIELD_ALIASES = {
  name:            ["name", "full name", "lead name", "lead", "student name", "contact name"],
  phone:           ["phone", "phone number", "mobile", "mobile number", "contact", "contact number", "whatsapp"],
  email:           ["email", "email address", "mail", "e-mail"],
  platform:        ["platform", "source", "channel", "lead source"],
  platform_link:   ["platform link", "profile link", "link", "url", "platform_link", "profile url", "profile"],
  stage:           ["stage", "status", "lead stage", "lead status"],
  last_message:    ["last message", "message", "last_message", "last note", "last contact"],
  follow_up_date:  ["follow up date", "follow-up date", "followup date", "next call", "next followup",
                    "follow_up_date", "next follow up", "followup", "callback date", "next contact"],
  notes:           ["notes", "note", "remarks", "comments", "description", "remark"],
};

const VALID_STAGES   = ["New", "Active", "Follow-up", "Booked", "Converted", "Closed"];
const VALID_PLATFORMS = ["LinkedIn", "Instagram", "WhatsApp", "Email", "Referral", "Other"];

const TEMPLATE_HEADERS = ["Name", "Phone", "Email", "Platform", "Platform Link", "Stage", "Last Message", "Follow Up Date", "Notes"];
const TEMPLATE_SAMPLE  = ["Ravi Kumar", "9876543210", "ravi@email.com", "LinkedIn", "https://linkedin.com/in/ravi", "New", "Interested in course", "2026-07-15", "Referred by Amit"];

function normalise(h) {
  return String(h).trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
}

function mapHeader(h) {
  const n = normalise(h);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(n)) return field;
  }
  return null;
}

function parseExcelDate(val) {
  if (!val) return "";
  const s = String(val).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  // MM/DD/YYYY
  const m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m2) return `${m2[3]}-${m2[1].padStart(2,"0")}-${m2[2].padStart(2,"0")}`;
  return "";
}

function matchStage(val) {
  if (!val) return "New";
  const v = String(val).trim();
  const found = VALID_STAGES.find((s) => s.toLowerCase() === v.toLowerCase());
  return found || "New";
}

function matchPlatform(val) {
  if (!val) return "Other";
  const v = String(val).trim();
  const found = VALID_PLATFORMS.find((p) => p.toLowerCase() === v.toLowerCase());
  return found || "Other";
}

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS.join(","), TEMPLATE_SAMPLE.map((v) => `"${v}"`).join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkUploadModal({ onClose, onSuccess }) {
  const [step, setStep] = useState("upload"); // upload | preview | done
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const parseFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setParseError("Only .xlsx, .xls or .csv files are supported.");
      return;
    }
    setParsing(true);
    setParseError("");
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: "yyyy-mm-dd" });

      if (!rawRows || rawRows.length < 2) {
        setParseError("No data found in the file. The first row must contain column headers.");
        return;
      }

      const headers = rawRows[0].map(String);
      const headerMap = {}; // colIndex → fieldName
      headers.forEach((h, i) => {
        const field = mapHeader(h);
        if (field) headerMap[i] = field;
      });

      const parsed = [];
      for (let r = 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.every((c) => !c)) continue; // skip blank rows
        const lead = { name: "", phone: "", email: "", platform: "Other", platform_link: "", stage: "New", last_message: "", follow_up_date: "", notes: "" };
        Object.entries(headerMap).forEach(([colIdx, field]) => {
          const val = row[colIdx] ?? "";
          if (field === "stage") lead.stage = matchStage(val);
          else if (field === "platform") lead.platform = matchPlatform(val);
          else if (field === "follow_up_date") lead.follow_up_date = parseExcelDate(val);
          else lead[field] = String(val).trim();
        });
        parsed.push(lead);
      }

      if (parsed.length === 0) {
        setParseError("No valid rows found in the file.");
        return;
      }

      setRows(parsed);
      setStep("preview");
    } catch (e) {
      setParseError("Failed to parse the file. Please check the format (Excel or CSV) and try again.");
    } finally {
      setParsing(false);
    }
  }, []);

  const handleFile = (e) => parseFile(e.target.files?.[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    parseFile(e.dataTransfer.files?.[0]);
  };

  const upload = async () => {
    setUploading(true);
    try {
      const { data } = await api.post("/leads/bulk", { leads: rows });
      setResult(data);
      setStep("done");
    } catch {
      setParseError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const validRows   = rows.filter((r) => r.name.trim());
  const invalidRows = rows.filter((r) => !r.name.trim());

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}
    >
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-lg)", padding: "26px 24px", width: "100%", maxWidth: step === "preview" ? 740 : 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-main)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              {step === "upload" ? "Bulk Upload Leads" : step === "preview" ? "Preview Leads" : "Upload Complete"}
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
              {step === "upload" ? "Add multiple leads at once from an Excel or CSV file" :
               step === "preview" ? `${validRows.length} leads ready to upload${invalidRows.length ? `, ${invalidRows.length} skipped (no name)` : ""}` :
               "Leads uploaded successfully"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 20, cursor: "pointer", padding: "2px 6px" }}>✕</button>
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <>
            {/* Template download */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 3 }}>Download Template</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Name, Phone, Email, Platform, Stage, Follow Up Date, Notes column hain
                </div>
              </div>
              <button onClick={downloadTemplate} style={{ padding: "7px 14px", borderRadius: 8, background: "var(--teal-dim)", border: "1px solid var(--teal)", color: "var(--teal-light)", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--font-main)" }}>
                ↓ Template
              </button>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? "var(--teal)" : "var(--border)"}`,
                borderRadius: "var(--radius-md)",
                background: dragOver ? "var(--teal-dim)" : "var(--bg-input)",
                padding: "40px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ marginBottom: 10, color: "var(--teal-light)", display: "flex", justifyContent: "center" }}>
                {parsing ? <Upload size={36} /> : <FileSpreadsheet size={36} />}
              </div>
              <div style={{ fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>
                {parsing ? "Parsing file..." : "Drop your file here or click to browse"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                .xlsx, .xls, .csv supported
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: "none" }} />
            </div>

            {parseError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: 8, color: "var(--danger)", fontSize: 13 }}>
                {parseError}
              </div>
            )}

            {/* Column hints */}
            <div style={{ marginTop: 18, background: "var(--bg-surface)", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                Supported Column Names
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Name *", "Phone", "Email", "Platform", "Platform Link", "Stage", "Last Message", "Follow Up Date", "Notes"].map((col) => (
                  <span key={col} style={{ fontSize: 11, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 9px", color: col.endsWith("*") ? "var(--teal-light)" : "var(--text-secondary)", fontFamily: "var(--font-main)", fontWeight: col.endsWith("*") ? 700 : 400 }}>
                    {col}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                * Name column is required. All other fields are optional — missing fields will be left blank.
              </div>
            </div>
          </>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <>
            {invalidRows.length > 0 && (
              <div style={{ padding: "10px 14px", background: "var(--warn-dim)", border: "1px solid var(--warn)", borderRadius: 8, marginBottom: 14, fontSize: 12, color: "var(--warn)" }}>
                ⚠ {invalidRows.length} row{invalidRows.length > 1 ? "s" : ""} will be skipped because the Name field is blank.
              </div>
            )}

            <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 18, maxHeight: 380, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620, fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface)", position: "sticky", top: 0 }}>
                    {["#", "Name", "Phone", "Email", "Platform", "Stage", "Follow Up Date", "Notes"].map((h) => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", fontFamily: "var(--font-main)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validRows.map((lead, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "9px 12px", color: "var(--text-muted)", fontFamily: "var(--font-main)" }}>{i + 1}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-main)", whiteSpace: "nowrap" }}>{lead.name}</td>
                      <td style={{ padding: "9px 12px", color: "var(--text-secondary)" }}>{lead.phone || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td style={{ padding: "9px 12px", color: "var(--text-secondary)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.email || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td style={{ padding: "9px 12px" }}>
                        <span style={{ background: "rgba(91,163,217,0.13)", color: "var(--blue)", borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 600 }}>{lead.platform}</span>
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        <span style={{ background: "var(--teal-dim)", color: "var(--teal-light)", borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 600 }}>{lead.stage}</span>
                      </td>
                      <td style={{ padding: "9px 12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{lead.follow_up_date || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td style={{ padding: "9px 12px", color: "var(--text-secondary)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.notes || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parseError && (
              <div style={{ padding: "10px 14px", background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: 8, marginBottom: 14, color: "var(--danger)", fontSize: 13 }}>
                {parseError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setStep("upload"); setRows([]); setParseError(""); }} style={{ padding: "9px 18px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>
                ← Back
              </button>
              <button
                onClick={upload}
                disabled={uploading || validRows.length === 0}
                style={{ padding: "9px 22px", borderRadius: "var(--radius-sm)", background: uploading ? "var(--bg-hover)" : "var(--gradient-accent)", border: "none", color: "#fff", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, cursor: uploading ? "not-allowed" : "pointer", boxShadow: uploading ? "none" : "var(--shadow-glow)" }}
              >
                {uploading ? "Uploading..." : `Upload ${validRows.length} Lead${validRows.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        )}

        {/* Step: Done */}
        {step === "done" && result && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ marginBottom: 16, color: "var(--success)", display: "flex", justifyContent: "center" }}><CheckCircle2 size={52} /></div>
            <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 18, color: "var(--text-primary)", marginBottom: 8 }}>
              Upload Complete!
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: 10, padding: "14px 24px", minWidth: 100 }}>
                <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 28, color: "var(--success)" }}>{result.success}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Leads Added</div>
              </div>
              {result.failed > 0 && (
                <div style={{ background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: 10, padding: "14px 24px", minWidth: 100 }}>
                  <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 28, color: "var(--danger)" }}>{result.failed}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Skipped</div>
                </div>
              )}
            </div>
            <button
              onClick={() => { onSuccess(); onClose(); }}
              style={{ padding: "10px 28px", borderRadius: "var(--radius-sm)", background: "var(--gradient-accent)", border: "none", color: "#fff", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 14, cursor: "pointer", boxShadow: "var(--shadow-glow)" }}
            >
              View Leads
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
