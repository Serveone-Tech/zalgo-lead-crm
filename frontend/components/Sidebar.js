"use client";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { hasPerm, isOwnerUser } from "../lib/permissions";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isOverdue(d) {
  return d && d.split("T")[0] < today();
}
function isToday(d) {
  return d && d.split("T")[0] === today();
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifCount, setCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [theme, setTheme] = useState("dark");
  const [sub, setSub] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("crm_user");
    if (!raw) {
      router.push("/login");
      return;
    }
    const u = JSON.parse(raw);
    setUser(u);

    const savedTheme = localStorage.getItem("crm_theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;

    // For owner accounts: check subscription
    if (u.role !== "superadmin" && !u.parent_id) {
      api.get("/auth/subscription").then(({ data: s }) => {
        if (!s) { window.location.href = "/plans"; return; }
        setSub(s);
      }).catch(() => {});
    }

    loadCounts();
    const interval = setInterval(loadCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("crm_theme", next);
  };

  const loadCounts = async () => {
    try {
      const [leadsRes, dueRes] = await Promise.all([
        api.get("/leads"),
        api.get("/customers/due/upcoming").catch(() => ({ data: [] })),
      ]);
      const leads = leadsRes.data;
      const overdueDue = dueRes.data.filter((p) => {
        const d = p.due_date ? p.due_date.split("T")[0] : null;
        return d && d <= today();
      });
      setCount(
        leads.filter(
          (l) =>
            (isOverdue(l.follow_up_date) && l.stage !== "Closed") ||
            isToday(l.follow_up_date),
        ).length,
      );
      setDueCount(overdueDue.length);
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    localStorage.removeItem("crm_settings");
    router.push("/login");
  };

  // Parse plan feature keys from subscription
  const planFeatures = sub?.features
    ? (typeof sub.features === "string" ? JSON.parse(sub.features) : sub.features)
    : null; // null = no subscription loaded yet (employee or loading)

  // For owners: check plan features; for employees: always show (backend guards anyway)
  const hasPlanFeature = (feat) => {
    if (!user || user.parent_id) return true; // employees — defer to backend
    if (!planFeatures) return true;            // owner but sub not loaded yet
    return planFeatures.includes(feat);
  };

  const NAV = [
    {
      section: "OVERVIEW",
      items: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          ),
        },
        {
          href: "/notifications",
          label: "Notifications",
          badge: notifCount,
          icon: (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          ),
        },
      ],
    },
    {
      section: "PEOPLE",
      items: [
        {
          href: "/leads",
          label: "Leads",
          icon: (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        ...(hasPlanFeature("customers")
          ? [
              {
                href: "/customers",
                label: "Customers",
                badge: dueCount,
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                    <polyline points="16 11 18 13 22 9" />
                  </svg>
                ),
              },
            ]
          : []),
        ...(hasPlanFeature("employees") && hasPerm(user, "manage_employees")
          ? [
              {
                href: "/employees",
                label: "Team",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                ),
              },
            ]
          : []),
        ...(hasPlanFeature("employees") && (isOwnerUser(user) || hasPerm(user, "view_all_leads"))
          ? [
              {
                href: "/reports",
                label: "Reports",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                ),
              },
            ]
          : []),
      ],
    },
    {
      section: "SETTINGS",
      items: [
        ...(hasPlanFeature("automation")
          ? [
              {
                href: "/automation",
                label: "Automation",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07" />
                  </svg>
                ),
              },
            ]
          : []),
        {
          href: "/settings",
          label: "Settings",
          icon: (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "var(--sidebar-w)",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "22px 20px 18px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Image
          src={theme === "light" ? "/logo_light.png" : "/logo_dark.png"}
          alt="Zalgo Infotech"
          width={150}
          height={45}
          style={{ objectFit: "contain", objectPosition: "left" }}
          priority
        />
        <div
          style={{
            marginTop: 9,
            fontSize: 10,
            background: "var(--gradient-accent)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontFamily: "var(--font-main)",
            fontWeight: 700,
          }}
        >
          Coach CRM
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        {NAV.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--text-muted)",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontFamily: "var(--font-main)",
                padding: "4px 10px 8px",
              }}
            >
              {section}
            </div>
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: 3,
                    color: active ? "#fff" : "var(--text-secondary)",
                    background: active
                      ? "var(--gradient-accent)"
                      : "transparent",
                    boxShadow: active ? "var(--shadow-glow)" : "none",
                    fontFamily: "var(--font-main)",
                    fontWeight: active ? 600 : 500,
                    fontSize: 13,
                    transition: "all 0.18s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "var(--bg-hover)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                  {item.badge > 0 && (
                    <span
                      style={{
                        background: active ? "rgba(255,255,255,0.25)" : "var(--danger)",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 20,
                        padding: "1px 7px",
                        fontFamily: "var(--font-main)",
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Subscription info — owners only */}
      {sub && (
        <PlanChip sub={sub} />
      )}

      {/* User + logout */}
      <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
              padding: "8px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-hover)",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--gradient-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
                fontFamily: "var(--font-main)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-main)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginTop: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.email}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={toggleTheme}
          style={{
            width: "100%",
            padding: "9px",
            borderRadius: "var(--radius-sm)",
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
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--teal)";
            e.currentTarget.style.color = "var(--teal-light)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
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
            padding: "9px",
            borderRadius: "var(--radius-sm)",
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
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--danger)";
            e.currentTarget.style.color = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function PlanChip({ sub }) {
  const now = new Date();
  const expiryRaw = sub.status === "trial" ? sub.trial_ends_at : sub.ends_at;
  const expiry = expiryRaw ? new Date(expiryRaw) : null;
  const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;

  const isUrgent = daysLeft !== null && daysLeft <= 3;
  const isWarning = daysLeft !== null && daysLeft <= 7;
  const color = isUrgent ? "var(--danger)" : isWarning ? "var(--warn)" : "var(--teal)";
  const dimColor = isUrgent ? "var(--danger-dim)" : isWarning ? "var(--warn-dim)" : "var(--teal-dim)";

  const fmtExpiry = expiry
    ? expiry.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const billing = sub.billing_cycle === "yearly" ? "Yearly" : sub.billing_cycle === "trial" ? "Trial" : "Monthly";

  return (
    <div style={{
      margin: "0 10px 6px",
      padding: "10px 12px",
      background: dimColor,
      border: `1px solid ${color}44`,
      borderRadius: 10,
      cursor: "default",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{
          fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 12,
          color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {sub.plan_name || "Plan"}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, color, background: color + "22",
          borderRadius: 20, padding: "2px 6px", fontFamily: "var(--font-main)",
          textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, marginLeft: 6,
        }}>
          {sub.status === "trial" ? "Trial" : billing}
        </span>
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{fmtExpiry ? `Expires ${fmtExpiry}` : "No expiry"}</span>
        {daysLeft !== null && (
          <span style={{ fontWeight: 700, color, fontSize: 10 }}>
            {daysLeft <= 0 ? "Today" : `${daysLeft}d left`}
          </span>
        )}
      </div>
    </div>
  );
}
