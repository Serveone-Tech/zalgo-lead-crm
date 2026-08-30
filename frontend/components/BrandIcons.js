"use client";
import { Infinity as InfinityIcon, PhoneCall, Phone } from "lucide-react";

// Google Ads' product mark — a rounded blue triangle with a yellow accent dot.
export function GoogleAdsGlyph({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 2.2a2.6 2.6 0 0 1 2.26 1.32l7.2 12.9A2.6 2.6 0 0 1 19.2 20H4.8a2.6 2.6 0 0 1-2.26-3.58l7.2-12.9A2.6 2.6 0 0 1 12 2.2z"
        fill="#4285F4"
      />
      <circle cx="12" cy="16.6" r="2.3" fill="#FBBC04" />
    </svg>
  );
}

export function MetaGlyph({ size = 22 }) {
  return (
    <div style={{ color: "#0064E0" }}>
      <InfinityIcon size={size} strokeWidth={3} />
    </div>
  );
}

export function PhoneCallGlyph({ size = 22, color = "#00868a" }) {
  return <PhoneCall size={size} color={color} strokeWidth={2} />;
}

export function WhatsAppGlyph({ size = 22 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Phone size={size * 0.52} color="#fff" fill="#fff" strokeWidth={0} style={{ transform: "rotate(15deg)" }} />
    </div>
  );
}
