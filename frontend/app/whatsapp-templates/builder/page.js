"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Send, Code2, Eye } from "lucide-react";
import api from "../../../lib/api";
import { validateTemplate } from "../../../lib/template-validator";
import TemplateBasicSettings from "../../../components/whatsapp-templates/TemplateBasicSettings";
import TemplateHeaderBuilder from "../../../components/whatsapp-templates/TemplateHeaderBuilder";
import TemplateBodyBuilder from "../../../components/whatsapp-templates/TemplateBodyBuilder";
import TemplateFooterBuilder from "../../../components/whatsapp-templates/TemplateFooterBuilder";
import TemplateButtonBuilder from "../../../components/whatsapp-templates/TemplateButtonBuilder";
import TemplateCarouselBuilder from "../../../components/whatsapp-templates/TemplateCarouselBuilder";
import WhatsAppTemplatePreview from "../../../components/whatsapp-templates/WhatsAppTemplatePreview";
import MetaTemplateValidationPanel from "../../../components/whatsapp-templates/MetaTemplateValidationPanel";
import MetaPayloadDebugView from "../../../components/whatsapp-templates/MetaPayloadDebugView";
import MetaSubmissionDialog from "../../../components/whatsapp-templates/MetaSubmissionDialog";
import TemplateStatusBadge from "../../../components/whatsapp-templates/TemplateStatusBadge";

const BLANK_TEMPLATE = {
  name: "",
  category: "MARKETING",
  language: "en_US",
  header: { format: "NONE" },
  body: { text: "", variables: [] },
  footer: { text: "" },
  buttons: [],
  carousel: { cards: [] },
};

const EDITABLE_STATUSES = ["draft", "rejected", "error"];

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isNew = !id;

  const [template, setTemplate] = useState(BLANK_TEMPLATE);
  const [status, setStatus] = useState("draft");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rightTab, setRightTab] = useState("validate"); // validate | payload
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api
      .get(`/whatsapp-templates/${id}`)
      .then(({ data }) => {
        setTemplate(data.components);
        setStatus(data.status);
        setRejectionReason(data.rejection_reason || "");
      })
      .catch(() => setError("Could not load this template"))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const editable = isNew || EDITABLE_STATUSES.includes(status);
  const validation = validateTemplate(template);

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      if (isNew) {
        const { data } = await api.post("/whatsapp-templates", template);
        router.replace(`/whatsapp-templates/builder?id=${data.id}`);
        setStatus(data.status);
        return data;
      } else {
        const { data } = await api.put(`/whatsapp-templates/${id}`, template);
        setTemplate(data.components);
        setStatus(data.status);
        return data;
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Could not save template");
      throw e;
    } finally {
      setSaving(false);
    }
  }, [isNew, id, template, router]);

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      let currentId = id;
      if (isNew) {
        const created = await save();
        currentId = created.id;
      } else {
        await save();
      }
      const { data } = await api.post(`/whatsapp-templates/${currentId}/submit`);
      setStatus(data.status);
      setRejectionReason(data.rejection_reason || "");
      setShowSubmitDialog(false);
      router.push("/whatsapp-templates");
    } catch (e) {
      setError(e?.response?.data?.error || "Meta rejected this template");
      setStatus("error");
      setShowSubmitDialog(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>;
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 }}>
        <div>
          <button
            onClick={() => router.push("/whatsapp-templates")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 12.5, cursor: "pointer", padding: 0, marginBottom: 10 }}
          >
            <ArrowLeft size={14} /> Back to templates
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontFamily: "var(--font-main)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
              {isNew ? "New WhatsApp Template" : template.name || "Edit Template"}
            </h1>
            <TemplateStatusBadge status={status} />
          </div>
          {!editable && (
            <div style={{ fontSize: 12, color: "var(--warn)", marginTop: 6 }}>
              This template is {status} on Meta and can't be edited directly — duplicate it from the list page to create an editable copy.
            </div>
          )}
          {rejectionReason && (
            <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>Meta's reason: {rejectionReason}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={save}
            disabled={saving || !editable}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12.5, fontWeight: 600, cursor: saving || !editable ? "not-allowed" : "pointer", opacity: !editable ? 0.5 : 1 }}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={() => setShowSubmitDialog(true)}
            disabled={!editable || !validation.valid}
            title={!validation.valid ? "Fix validation errors before submitting" : undefined}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8,
              background: !editable || !validation.valid ? "var(--bg-hover)" : "var(--gradient-accent)",
              border: "none", color: !editable || !validation.valid ? "var(--text-muted)" : "#fff",
              fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13,
              cursor: !editable || !validation.valid ? "not-allowed" : "pointer",
              boxShadow: !editable || !validation.valid ? "none" : "var(--shadow-glow)",
            }}
          >
            <Send size={14} /> Submit to Meta for Review
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "var(--danger)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px 340px", gap: 18, alignItems: "start" }}>
        <div style={{ opacity: editable ? 1 : 0.6, pointerEvents: editable ? "auto" : "none" }}>
          <TemplateBasicSettings template={template} onChange={setTemplate} nameLocked={!isNew} />
          <TemplateHeaderBuilder header={template.header} onChange={(header) => setTemplate((t) => ({ ...t, header }))} />
          <TemplateBodyBuilder body={template.body} onChange={(body) => setTemplate((t) => ({ ...t, body }))} />
          <TemplateFooterBuilder footer={template.footer} onChange={(footer) => setTemplate((t) => ({ ...t, footer }))} />
          <TemplateButtonBuilder buttons={template.buttons} onChange={(buttons) => setTemplate((t) => ({ ...t, buttons }))} />
          <TemplateCarouselBuilder category={template.category} carousel={template.carousel} onChange={(carousel) => setTemplate((t) => ({ ...t, carousel }))} />
        </div>

        <div style={{ position: "sticky", top: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: "var(--text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-main)" }}>
            <Eye size={13} /> Live Preview
          </div>
          <WhatsAppTemplatePreview template={template} />
        </div>

        <div style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <TabBtn active={rightTab === "validate"} onClick={() => setRightTab("validate")} label="Validation" />
            <TabBtn active={rightTab === "payload"} onClick={() => setRightTab("payload")} label={<><Code2 size={12} /> Meta Payload</>} />
          </div>
          {rightTab === "validate" ? (
            <MetaTemplateValidationPanel validation={validation} />
          ) : (
            <MetaPayloadDebugView template={template} />
          )}
        </div>
      </div>

      {showSubmitDialog && (
        <MetaSubmissionDialog
          template={template}
          submitting={submitting}
          onCancel={() => setShowSubmitDialog(false)}
          onConfirm={submit}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "7px 12px", borderRadius: 7,
        border: `1px solid ${active ? "var(--teal)" : "var(--border)"}`,
        background: active ? "var(--teal-dim)" : "var(--bg-card)",
        color: active ? "var(--teal-light)" : "var(--text-secondary)",
        fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-main)",
      }}
    >
      {label}
    </button>
  );
}

export default function TemplateBuilderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>}>
      <BuilderContent />
    </Suspense>
  );
}
