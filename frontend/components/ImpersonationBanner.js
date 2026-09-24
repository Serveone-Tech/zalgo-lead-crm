"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Rendered unconditionally from the root layout (works on every
// authenticated page, sidebar or not) — self-checks localStorage and
// renders nothing unless a Super Admin is actively impersonating a tenant.
// See app/superadmin/page.js's startImpersonation() for how the session
// gets swapped in, and returnToAdmin() below for how it's restored.
export default function ImpersonationBanner() {
  const router = useRouter();
  const [impersonating, setImpersonating] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("crm_impersonating");
    if (raw) {
      try {
        setImpersonating(JSON.parse(raw));
      } catch {
        localStorage.removeItem("crm_impersonating");
      }
    }
  }, []);

  if (!impersonating) return null;

  const returnToAdmin = () => {
    localStorage.setItem("crm_token", impersonating.adminToken);
    localStorage.setItem("crm_user", impersonating.adminUser);
    localStorage.removeItem("crm_impersonating");
    router.push("/superadmin");
    // Full reload so every already-mounted page picks up the restored
    // admin session instead of holding onto stale tenant-scoped state.
    setTimeout(() => window.location.reload(), 50);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "#e6a817",
        color: "#1a1200",
        padding: "8px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "var(--font-main)",
      }}
    >
      <span>🔍 Viewing as <strong>{impersonating.tenantName}</strong> — actions here affect their real account</span>
      <button
        onClick={returnToAdmin}
        style={{
          padding: "4px 12px",
          borderRadius: 6,
          background: "#1a1200",
          color: "#fff",
          border: "none",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "var(--font-main)",
        }}
      >
        Return to Admin
      </button>
    </div>
  );
}
