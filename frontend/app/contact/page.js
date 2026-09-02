"use client";
import { useState } from "react";
import axios from "axios";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { teal, ink, sub, muted, border } from "../../lib/marketing-theme";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import Reveal from "../../components/Reveal";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const inp = {
  width: "100%",
  padding: "11px 14px",
  border: `1px solid ${border}`,
  borderRadius: 9,
  fontSize: 14,
  color: ink,
  outline: "none",
  fontFamily: "inherit",
};

const lbl = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: sub,
  marginBottom: 6,
};

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Name, email, and message are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await axios.post(`${BASE}/contact`, { ...form, source: "contact-page" });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again in a moment.");
    }
    setSaving(false);
  };

  return (
    <div style={{ background: "#fff", color: ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <MarketingNav />

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "72px 48px 96px" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 14 }}>
            Get in <span style={{ color: teal }}>Touch</span>
          </h1>
          <p style={{ fontSize: 16, color: sub, maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
            Questions about pricing, a custom plan, or just want a walkthrough? We&apos;ll get back to you shortly.
          </p>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 48 }}>
          <Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                { icon: <Mail size={18} color={teal} />, label: "Email", value: "zalgoinfotec@gmail.com" },
              ].map((c) => (
                <div key={c.label} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(0,134,138,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal
            delay={0.15}
            style={{
              border: `1px solid ${border}`,
              borderRadius: 16,
              padding: 32,
              boxShadow: "0 16px 40px rgba(20,30,35,0.06)",
            }}
          >
            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <CheckCircle2 size={44} color={teal} style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Message sent!</div>
                <div style={{ fontSize: 14, color: sub }}>We&apos;ll get back to you within 24 hours.</div>
              </div>
            ) : (
              <form onSubmit={submit}>
                {error && (
                  <div
                    style={{
                      background: "#fdecea",
                      border: "1px solid #f4c7c3",
                      color: "#c8372f",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 13,
                      marginBottom: 18,
                    }}
                  >
                    {error}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={lbl}>Full Name *</label>
                    <input style={inp} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                  </div>
                  <div>
                    <label style={lbl}>Email *</label>
                    <input style={inp} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@company.com" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={lbl}>Phone</label>
                    <input style={inp} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label style={lbl}>Company</label>
                    <input style={inp} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Your business name" />
                  </div>
                </div>
                <div style={{ marginBottom: 22 }}>
                  <label style={lbl}>Message *</label>
                  <textarea
                    style={{ ...inp, resize: "vertical" }}
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us what you're looking for..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    background: saving ? muted : teal,
                    color: "#fff",
                    border: "none",
                    borderRadius: 9,
                    padding: "13px 20px",
                    fontSize: 14.5,
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Sending..." : "Send Message"} <Send size={15} />
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
