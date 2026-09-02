"use client";
import { teal, ink, sub, border } from "../lib/marketing-theme";
import MarketingNav from "./MarketingNav";
import MarketingFooter from "./MarketingFooter";

// Shared prose shell for the legal pages (Terms, Privacy, Refund Policy) —
// same heading/paragraph rhythm so they read as one document set instead of
// three independently-styled pages.
export default function LegalPageLayout({ title, updated, children }) {
  return (
    <div style={{ background: "#fff", color: ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <MarketingNav />
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "64px 32px 96px" }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 13, color: sub, marginBottom: 40 }}>Last updated: {updated}</p>
        <div style={{ fontSize: 14.5, lineHeight: 1.75, color: "#2c3033" }}>{children}</div>
      </div>
      <MarketingFooter />
    </div>
  );
}

export function H2({ children }) {
  return <h2 style={{ fontSize: 19, fontWeight: 700, color: ink, marginTop: 34, marginBottom: 10 }}>{children}</h2>;
}

export function P({ children }) {
  return <p style={{ marginBottom: 14 }}>{children}</p>;
}

export function UL({ children }) {
  return <ul style={{ marginBottom: 14, paddingLeft: 22 }}>{children}</ul>;
}

export function A({ href, children }) {
  return (
    <a href={href} style={{ color: teal, fontWeight: 600 }}>
      {children}
    </a>
  );
}

export const legalBorder = border;
