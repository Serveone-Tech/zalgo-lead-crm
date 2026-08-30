"use client";
import { ink } from "../lib/marketing-theme";

export default function SectionHeading({ children }) {
  return (
    <h2
      style={{
        textAlign: "center",
        fontSize: 30,
        fontWeight: 700,
        color: ink,
        marginBottom: 44,
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </h2>
  );
}
