"use client";
import { border, muted } from "../lib/marketing-theme";

export default function MarketingFooter() {
  return (
    <div style={{ borderTop: `1px solid ${border}`, padding: "24px 48px", textAlign: "center", fontSize: 12.5, color: muted }}>
      © {new Date().getFullYear()} Zalgo Infotech. All rights reserved.
    </div>
  );
}
