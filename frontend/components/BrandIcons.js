"use client";
// Real brand glyphs — sourced from react-icons (Font Awesome + Simple Icons).
//   npm i react-icons
// Each glyph is drawn inside its brand-coloured tile so it matches the reference
// design (green WhatsApp bubble, blue Meta loop, Google Ads mark, teal phone).
//
// Want the exact multi-colour Google Ads mark? Download the official SVG from
// Google's brand resource centre, save it as /public/brands/google-ads.svg and
// pass `official` to <GoogleAdsGlyph official />.

import { FaWhatsapp } from "react-icons/fa";
import { SiMeta, SiGoogleads } from "react-icons/si";
import { PhoneCall } from "lucide-react";

/** Green circular bubble with the WhatsApp phone glyph. */
export function WhatsAppGlyph({ size = 28 }) {
  return (
    <span
      aria-label="WhatsApp"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#25D366",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <FaWhatsapp size={size * 0.68} />
    </span>
  );
}

/** Meta infinity loop in Meta blue. */
export function MetaGlyph({ size = 28 }) {
  return (
    <span
      aria-label="Meta"
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0866FF",
        flexShrink: 0,
      }}
    >
      <SiMeta size={size} />
    </span>
  );
}

/** Google Ads mark. Monochrome from Simple Icons, or the official SVG if present. */
export function GoogleAdsGlyph({ size = 28, official = false }) {
  if (official) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brands/google-ads.svg"
        alt="Google Ads"
        width={size}
        height={size}
        style={{ display: "inline-block", flexShrink: 0 }}
      />
    );
  }
  return (
    <span
      aria-label="Google Ads"
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#4285F4",
        flexShrink: 0,
      }}
    >
      <SiGoogleads size={size} />
    </span>
  );
}

/** Teal phone-call glyph used for "Calls & Missed Calls". */
export function PhoneCallGlyph({ size = 28 }) {
  return (
    <span
      aria-label="Calls"
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#00868a",
        flexShrink: 0,
      }}
    >
      <PhoneCall size={size * 0.82} strokeWidth={2.4} />
    </span>
  );
}
