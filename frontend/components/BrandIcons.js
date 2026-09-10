"use client";
import { PhoneCall } from "lucide-react";

// Google Ads' real mark — a rounded triangle with a yellow accent circle
// at its base, echoing the actual product icon's silhouette.
export function GoogleAdsGlyph({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M17.4 3.4a3.2 3.2 0 0 1 5.55 0l10.2 17.7a3.2 3.2 0 0 1-2.77 4.8H10a3.2 3.2 0 0 1-2.78-4.8Z" fill="#4285F4" />
      <circle cx="9" cy="27.5" r="5.5" fill="#FBBC04" />
      <circle cx="26.5" cy="27.5" r="3.6" fill="#34A853" />
    </svg>
  );
}

// Meta's real brand mark — the infinity loop rendered in Meta's signature
// blue-to-violet gradient, not a flat monochrome icon.
export function MetaGlyph({ size = 22 }) {
  const uid = "metaGrad" + size;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={uid} x1="0" y1="8" x2="24" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0064E0" />
          <stop offset="45%" stopColor="#0081FB" />
          <stop offset="75%" stopColor="#7C4DFF" />
          <stop offset="100%" stopColor="#C13584" />
        </linearGradient>
      </defs>
      <path
        d="M18.178 8c5.096 0 5.096 8 0 8c-5.095 0-6.687-8-11.357-8c-5.096 0-5.096 8 0 8c5.67 0 7.262-8 11.357-8z"
        stroke={`url(#${uid})`}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PhoneCallGlyph({ size = 22, color = "#00868a" }) {
  return <PhoneCall size={size} color={color} strokeWidth={2} />;
}

// WhatsApp's real mark — the rounded speech-bubble-with-tail shape (not a
// plain circle) in WhatsApp green, with the recognizable handset glyph.
export function WhatsAppGlyph({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16.03 3C9.1 3 3.46 8.6 3.46 15.5c0 2.3.62 4.45 1.7 6.3L3 29l7.4-2.1a12.7 12.7 0 0 0 5.63 1.32h.01c6.93 0 12.57-5.6 12.57-12.5S22.96 3 16.03 3Z"
        fill="#25D366"
      />
      <path
        d="M12.1 9.9c-.28-.62-.5-.63-.78-.64h-.66c-.23 0-.6.08-.92.42-.31.35-1.2 1.16-1.2 2.84 0 1.68 1.23 3.3 1.4 3.53.17.23 2.38 3.78 5.88 5.15 2.9 1.14 3.5.91 4.13.85.63-.06 2.03-.82 2.32-1.62.28-.8.28-1.48.2-1.62-.09-.14-.32-.23-.66-.4-.35-.17-2.04-1-2.36-1.12-.32-.11-.55-.17-.78.17-.23.35-.9 1.12-1.1 1.35-.2.23-.4.26-.75.09-.35-.17-1.47-.54-2.8-1.72-1.03-.92-1.73-2.05-1.93-2.4-.2-.35-.02-.53.15-.7.16-.16.35-.4.52-.6.17-.2.23-.35.35-.58.11-.23.06-.43-.03-.6-.09-.17-.75-1.9-1.09-2.6Z"
        fill="#fff"
      />
    </svg>
  );
}
