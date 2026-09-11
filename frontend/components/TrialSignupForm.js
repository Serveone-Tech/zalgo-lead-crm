"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import axios from "axios";
import { teal, ink, sub, muted, border } from "../lib/marketing-theme";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  border: `1px solid ${border}`,
  borderRadius: 8,
  fontSize: 13.5,
  color: ink,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 700,
  color: ink,
  marginBottom: 6,
};

export default function TrialSignupForm() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setStatus("sending");
    try {
      await axios.post(`${BASE}/contact`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        message: "Requested a 15-day free trial from the homepage.",
        source: "trial_form",
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div style={{ textAlign: "center", padding: "40px 10px" }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>✅</div>
        <div
          style={{ fontSize: 17, fontWeight: 700, color: ink, marginBottom: 6 }}
        >
          Request received!
        </div>
        <div style={{ fontSize: 13.5, color: sub }}>
          Our team will reach out shortly to get your trial set up.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div>
          <label style={labelStyle}>Full name</label>
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="Your name"
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Business name</label>
          <input
            value={form.company}
            onChange={set("company")}
            placeholder="Company or brand"
            style={inputStyle}
          />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Work email</label>
        <input
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="you@company.com"
          required
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: 6 }}>
        <label style={labelStyle}>Phone / WhatsApp</label>
        <input
          value={form.phone}
          onChange={set("phone")}
          placeholder="Include country code"
          style={inputStyle}
        />
      </div>
      <div style={{ fontSize: 11.5, color: muted, marginBottom: 18 }}>
        We will contact you about your trial request.
      </div>

      {status === "error" && (
        <div style={{ fontSize: 12.5, color: "#c8372f", marginBottom: 12 }}>
          Something went wrong — please try again.
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: teal,
          color: "#fff",
          border: "none",
          borderRadius: 9,
          padding: "13px 20px",
          fontSize: 14,
          fontWeight: 700,
          cursor: status === "sending" ? "not-allowed" : "pointer",
          opacity: status === "sending" ? 0.7 : 1,
        }}
      >
        {status === "sending" ? "Sending..." : "Get My 15-Day Free Trial"}{" "}
        <ArrowRight size={15} />
      </button>

      <div
        style={{
          textAlign: "center",
          fontSize: 11.5,
          color: muted,
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px solid ${border}`,
        }}
      >
        Our team will help you get started.
      </div>
      {/* <div
        style={{ textAlign: "center", fontSize: 12, color: sub, marginTop: 10 }}
      >
        Have questions?{" "}
        <a
          href="mailto:sales@zalgoinfotech.com"
          style={{ color: teal, fontWeight: 600 }}
        >
          sales@zalgoinfotech.com
        </a>
      </div> */}
    </form>
  );
}
