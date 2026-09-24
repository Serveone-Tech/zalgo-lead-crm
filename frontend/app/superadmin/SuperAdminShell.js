"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// Section groups shown in the sidebar. Only entries with a real, built page
// get a real href — the rest of Phase 3 adds entries here as each section
// actually ships, so this list never links to a 404.
const NAV_GROUPS = [
  {
    section: "OVERVIEW",
    items: [{ label: "Tenants", icon: "🏢", href: "/superadmin" }],
  },
  {
    section: "PLANS",
    items: [{ label: "Plans", icon: "📋", href: "/superadmin/plans" }],
  },
  {
    section: "SYSTEM",
    items: [{ label: "Contact Requests", icon: "📩", href: "/superadmin/contact-requests" }],
  },
];

export default function SuperAdminShell({ children, headerRight }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState("dark");
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("crm_theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;

    const raw = localStorage.getItem("crm_user");
    if (raw) {
      try {
        setAdminName(JSON.parse(raw).name || "");
      } catch {}
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("crm_theme", next);
  };

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex" }}>
      <aside
        style={{
          width: 230,
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 10,
        }}
      >
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--border)" }}>
          <Image
            src={theme === "light" ? "/logo_light.png" : "/logo_dark.png"}
            alt="LeadLo"
            width={130}
            height={36}
            style={{ height: 30, width: "auto", objectFit: "contain", display: "block", marginBottom: 8 }}
          />
          <div style={{ fontSize: 10.5, color: "var(--teal)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
            Super Admin
          </div>
        </div>

        <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.section} style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  padding: "0 12px 6px",
                }}
              >
                {group.section}
              </div>
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: 8,
                      marginBottom: 3,
                      color: active ? "var(--teal-light)" : "var(--text-secondary)",
                      background: active ? "var(--teal-dim)" : "transparent",
                      fontFamily: "var(--font-main)",
                      fontWeight: active ? 600 : 400,
                      fontSize: 13,
                      textDecoration: "none",
                      borderLeft: active ? "2px solid var(--teal)" : "2px solid transparent",
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: "12px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={toggleTheme}
            style={{
              width: "100%",
              padding: "9px",
              borderRadius: 7,
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: 12,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              cursor: "pointer",
              marginBottom: 8,
              fontFamily: "var(--font-main)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--teal)"; e.currentTarget.style.color = "var(--teal-light)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            {theme === "dark" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: 7,
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "var(--font-main)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--danger)"; e.currentTarget.style.color = "var(--danger)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: 230, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 28px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-surface)",
          }}
        >
          <div style={{ flex: 1 }}>{headerRight}</div>
          <Link
            href="/superadmin/account"
            title="Account Settings"
            style={{
              fontSize: 13,
              color: pathname === "/superadmin/account" ? "var(--teal-light)" : "var(--text-secondary)",
              fontFamily: "var(--font-main)",
              fontWeight: 600,
              whiteSpace: "nowrap",
              marginLeft: 16,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ⚙ {adminName || "Admin"}
          </Link>
        </header>
        <main style={{ flex: 1, padding: "28px 32px" }}>{children}</main>
      </div>
    </div>
  );
}
