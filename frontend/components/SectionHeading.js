"use client";
import { ink, sub } from "../lib/marketing-theme";
import Reveal from "./Reveal";

export default function SectionHeading({ children, subtitle, align = "center", eyebrow }) {
  return (
    <Reveal style={{ textAlign: align, marginBottom: subtitle ? 14 : 44 }}>
      {eyebrow && (
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "#00868a",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          {eyebrow}
        </div>
      )}
      <h2
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: ink,
          letterSpacing: "-0.01em",
          marginBottom: subtitle ? 12 : 0,
        }}
      >
        {children}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: 15,
            color: sub,
            lineHeight: 1.6,
            maxWidth: 560,
            margin: align === "center" ? "0 auto 44px" : "0 0 44px",
          }}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
