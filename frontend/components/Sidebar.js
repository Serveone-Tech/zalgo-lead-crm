"use client";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import api from "../lib/api";

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

  useEffect(() => {
    const u = localStorage.getItem("crm_user");
    if (u) setUser(JSON.parse(u));
    else {
      router.push("/login");
      return;
    }
    loadNotifCount();
    // refresh count every 60 seconds
    const interval = setInterval(loadNotifCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifCount = async () => {
    try {
      const { data } = await api.get("/leads");
      const count = data.filter(
        (l) =>
          (isOverdue(l.follow_up_date) && l.stage !== "Closed") ||
          isToday(l.follow_up_date),
      ).length;
      setCount(count);
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    router.push("/login");
  };

  const NAV = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg
          width="17"
          height="17"
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
      href: "/leads",
      label: "Leads",
      icon: (
        <svg
          width="17"
          height="17"
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
    {
      href: "/notifications",
      label: "Notifications",
      badge: notifCount,
      icon: (
        <svg
          width="17"
          height="17"
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
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 18px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Image
          src="/logo.png"
          alt="Zalgo Infotech"
          width={150}
          height={45}
          style={{ objectFit: "contain", objectPosition: "left" }}
          priority
        />
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            color: "var(--teal)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "var(--font-main)",
            fontWeight: 500,
          }}
        >
          Coach CRM
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {NAV.map((item) => {
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
                borderRadius: 8,
                marginBottom: 4,
                color: active ? "var(--teal-light)" : "var(--text-secondary)",
                background: active ? "var(--teal-dim)" : "transparent",
                fontFamily: "var(--font-main)",
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                transition: "all 0.15s",
                borderLeft: active
                  ? "2px solid var(--teal)"
                  : "2px solid transparent",
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {item.icon}
                {item.label}
              </div>
              {item.badge > 0 && (
                <span
                  style={{
                    background: "var(--danger)",
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
      </nav>

      {/* User + logout */}
      <div style={{ padding: "14px", borderTop: "1px solid var(--border)" }}>
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--teal)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
                fontFamily: "var(--font-main)",
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-main)",
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginTop: 1,
                }}
              >
                {user.email}
              </div>
            </div>
          </div>
        )}
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            transition: "all 0.15s",
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
