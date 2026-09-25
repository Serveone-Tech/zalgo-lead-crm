"use client";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import api, { refreshUser } from "../lib/api";
import { hasPerm, isOwnerUser } from "../lib/permissions";
import { parsePlanFeatures, makeHasPlanFeature } from "../lib/plan-features";
import { WhatsAppGlyph } from "./BrandIcons";
import FollowUpModal from "./FollowUpModal";

// Per-lead-id dismiss tracking so a rescheduled follow-up (new
// follow_up_date) fires again, but re-polling the same due state within
// the 60s cycle doesn't re-show a popup the user already saw.
const DISMISS_KEY = "dismissed_followups";
function getDismissedFollowups() {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || "{}");
  } catch {
    return {};
  }
}
function setDismissedFollowups(map) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
  } catch {}
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifCount, setCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [theme, setTheme] = useState("dark");
  const [sub, setSub] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Due follow-ups queue one at a time — a fresh lead only ever joins the
  // back of the queue (see handleDueLeads), the modal always renders
  // whichever one is at the front, and resolving it (either button) just
  // shifts the queue so the next one appears immediately if there is one.
  const [followUpQueue, setFollowUpQueue] = useState([]);

  const SIDEBAR_W = { open: "232px", collapsed: "68px" };

  const applySidebarWidth = (isCollapsed) => {
    document.documentElement.style.setProperty("--sidebar-w", isCollapsed ? SIDEBAR_W.collapsed : SIDEBAR_W.open);
  };

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("crm_sidebar_collapsed", next ? "1" : "0");
      applySidebarWidth(next);
      return next;
    });
  };

  useEffect(() => {
    const raw = localStorage.getItem("crm_user");
    if (!raw) {
      router.push("/login");
      return;
    }
    const u = JSON.parse(raw);
    setUser(u);

    const savedCollapsed = localStorage.getItem("crm_sidebar_collapsed") === "1";
    setCollapsed(savedCollapsed);
    applySidebarWidth(savedCollapsed);

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

    // An admin can change this user's permissions from another session at
    // any time — refresh from the server (not just the localStorage copy
    // set at login) so nav items appear/disappear without needing a logout.
    refreshUser().then((fresh) => {
      if (fresh) setUser(fresh);
    });

    loadCounts();
    const interval = setInterval(() => {
      loadCounts();
      refreshUser().then((fresh) => {
        if (fresh) setUser(fresh);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close the mobile drawer whenever navigation happens.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("crm_theme", next);
  };

  // A single lightweight COUNT-based endpoint instead of fetching the
  // entire leads/inventory tables just to count a handful of matches —
  // this runs on every page load and every 60s for the life of the
  // session, so on a tenant with a few thousand leads the old
  // full-table-fetch version was measurably the single biggest recurring
  // performance cost in the app (~2-3s per poll vs ~0.6s now).
  const loadCounts = async () => {
    try {
      const { data } = await api.get("/leads/sidebar-counts");
      setCount(data.followup_count || 0);
      setDueCount(data.due_count || 0);
      setPendingCount(data.pending_count || 0);
      setLowStockCount(data.low_stock_count || 0);
      handleDueLeads(data.due_leads || []);
    } catch {}
  };

  // Queues whichever due leads haven't already been surfaced for their
  // current follow_up_date — a lead rescheduled to a new time clears its
  // old dismiss entry automatically (the stored date no longer matches),
  // but re-polling the same still-due lead every 60s does not re-queue it.
  // Marked dismissed immediately (not on resolve) so a failed/slow action
  // can't cause the same lead to be queued twice by the next poll tick.
  const handleDueLeads = (dueLeads) => {
    const dismissed = getDismissedFollowups();
    const newlyDue = dueLeads.filter((l) => dismissed[l.id] !== l.follow_up_date);
    if (newlyDue.length === 0) return;

    const next = { ...dismissed };
    newlyDue.forEach((l) => { next[l.id] = l.follow_up_date; });
    setDismissedFollowups(next);

    setFollowUpQueue((q) => [...q, ...newlyDue]);
  };

  const resolveFollowUp = () => setFollowUpQueue((q) => q.slice(1));

  const handleFollowUpNow = (lead) => {
    resolveFollowUp();
    router.push(`/leads?openLead=${lead.id}`);
  };

  const handleIgnoreFollowUp = async (lead, reason) => {
    await api.post(`/leads/${lead.id}/ignore-followup`, { reason });
    resolveFollowUp();
  };

  const logout = () => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    localStorage.removeItem("crm_settings");
    router.push("/login");
  };

  // Parse plan feature keys from subscription
  const planFeatures = parsePlanFeatures(sub); // null = no subscription loaded yet (employee or loading)
  const hasPlanFeature = makeHasPlanFeature(user, planFeatures);

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
          badge: notifCount + lowStockCount,
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
        ...(hasPlanFeature("automation") && (isOwnerUser(user) || hasPerm(user, "view_whatsapp"))
          ? [
              {
                href: "/whatsapp",
                label: "WhatsApp",
                icon: <WhatsAppGlyph size={16} />,
              },
            ]
          : []),
        ...(isOwnerUser(user) || hasPerm(user, "view_all_leads")
          ? [
              {
                href: "/unverified-leads",
                label: "Unverified Leads",
                badge: pendingCount,
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    <path d="M17 9l2 2 4-4" stroke="var(--warn)" />
                  </svg>
                ),
              },
            ]
          : []),
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
        ...(hasPlanFeature("customers") && (isOwnerUser(user) || hasPerm(user, "view_inventory"))
          ? [
              {
                href: "/inventory",
                label: "Inventory",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="M3.3 7 12 12l8.7-5" />
                    <path d="M12 22V12" />
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
        // Owner only — deliberately not gated by view_all_leads like
        // Reports above. An employee can still trigger an ignore (they're
        // the one acting on the popup), but only the owner gets to see the
        // audit trail of who ignored what and why.
        ...(isOwnerUser(user)
          ? [
              {
                href: "/ignored-followups",
                label: "Ignored Follow-ups",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
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
        ...(hasPlanFeature("automation") || hasPlanFeature("lead_sources")
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
        ...(hasPlanFeature("automation") && (isOwnerUser(user) || hasPerm(user, "manage_automation"))
          ? [
              {
                href: "/whatsapp-templates",
                label: "WA Templates",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <line x1="8" y1="9" x2="16" y2="9" />
                    <line x1="8" y1="13" x2="13" y2="13" />
                  </svg>
                ),
              },
            ]
          : []),
        ...(hasPerm(user, "manage_settings")
          ? [
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
            ]
          : []),
      ],
    },
  ];

  return (
    <>
      {followUpQueue.length > 0 && (
        <FollowUpModal
          lead={followUpQueue[0]}
          onFollowUpNow={handleFollowUpNow}
          onIgnore={handleIgnoreFollowUp}
        />
      )}

      {/* Mobile hamburger — hidden on desktop via CSS, fixed above everything */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        className="sidebar-mobile-toggle"
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 70,
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-strong)",
          color: "var(--text-primary)",
          boxShadow: "var(--shadow-md)",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {mobileOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Backdrop — only relevant on mobile, closes the drawer on tap */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="sidebar-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 45,
          }}
        />
      )}

      <aside
        className={`app-sidebar${mobileOpen ? " mobile-open" : ""}`}
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
          transition: "width 0.18s ease, transform 0.22s ease",
          overflow: "visible",
        }}
      >
      {/* Collapse/expand toggle — a small handle centered on the sidebar's
          right edge, like VSCode/Notion's panel collapse control. */}
      <button
        onClick={toggleCollapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          position: "absolute",
          top: "50%",
          right: -13,
          transform: "translateY(-50%)",
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-strong)",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 60,
          padding: 0,
          boxShadow: "var(--shadow-md)",
          transition: "background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--teal)";
          e.currentTarget.style.borderColor = "var(--teal)";
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--bg-surface)";
          e.currentTarget.style.borderColor = "var(--border-strong)";
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.transform = "translateY(-50%) scale(1)";
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "22px 0 18px" : "22px 20px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: collapsed ? "center" : "flex-start",
        }}
      >
        {collapsed ? (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "var(--gradient-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontFamily: "var(--font-main)",
              fontSize: 15,
            }}
            title="LeadLo"
          >
            L
          </div>
        ) : (
          <>
            <Image
              src={theme === "light" ? "/logo_light.png" : "/logo_dark.png"}
              alt="LeadLo"
              width={150}
              height={60}
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
              Lead Management System
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? "16px 8px" : "16px 12px", overflowY: "auto" }}>
        {NAV.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 14 }}>
            {!collapsed && (
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
            )}
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "space-between",
                    padding: collapsed ? "10px 0" : "10px 12px",
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
                    {!collapsed && item.label}
                  </div>
                  {item.badge > 0 && (collapsed ? (
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--danger)",
                        border: "1.5px solid var(--bg-surface)",
                      }}
                    />
                  ) : (
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
                  ))}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Subscription info — owners only */}
      {sub && !collapsed && (
        <PlanChip sub={sub} />
      )}

      {/* User + logout */}
      <div style={{ padding: collapsed ? "16px 8px" : "16px", borderTop: "1px solid var(--border)" }}>
        {user && (
          <div
            title={collapsed ? `${user.name} — ${user.email}` : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
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
                background: "var(--gradient-brand)",
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
            {!collapsed && (
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
            )}
          </div>
        )}
        <button
          onClick={toggleTheme}
          title={collapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
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
          {!collapsed && (theme === "dark" ? "Light Mode" : "Dark Mode")}
        </button>
        <button
          onClick={logout}
          title={collapsed ? "Sign Out" : undefined}
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
          {!collapsed && "Sign Out"}
        </button>
      </div>
      </aside>
    </>
  );
}

function PlanChip({ sub }) {
  const now = new Date();
  const expiryRaw = sub.status === "trialing" ? sub.trial_ends_at : sub.ends_at;
  const expiry = expiryRaw ? new Date(expiryRaw) : null;
  const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;

  const isPastDue = sub.status === "past_due";
  const isUrgent = isPastDue || (daysLeft !== null && daysLeft <= 3);
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
          {sub.status === "trialing" ? "Trial" : isPastDue ? "Payment issue" : billing}
        </span>
      </div>
      {isPastDue ? (
        <a href="/settings?tab=billing" style={{ fontSize: 10, color, fontWeight: 700, textDecoration: "underline" }}>
          Your last payment failed — update your card
        </a>
      ) : (
        <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{fmtExpiry ? `Expires ${fmtExpiry}` : "No expiry"}</span>
          {daysLeft !== null && (
            <span style={{ fontWeight: 700, color, fontSize: 10 }}>
              {daysLeft <= 0 ? "Today" : `${daysLeft}d left`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
