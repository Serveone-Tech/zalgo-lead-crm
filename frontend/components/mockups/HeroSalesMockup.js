"use client";
import {
  Search,
  Bell,
  ChevronDown,
  Home,
  Users2,
  MessageCircle,
  Zap,
  ClipboardList,
  Boxes,
  Truck,
  Settings,
  HelpCircle,
  Users,
  PhoneCall,
  Package,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

/* ─── tokens (self-contained so the mockup never depends on theme drift) ─── */
const blue = "#1a5cff";
const navy = "#0b1f4a";
const navyDeep = "#07163a";
const ink = "#0f1b33";
const sub = "#4a5670";
const muted = "#8a94a8";
const border = "#e3e9f5";
const green = "#1f8a5c";

const navItems = [
  { icon: Home, label: "Dashboard" },
  { icon: Users2, label: "Leads", active: true },
  { icon: MessageCircle, label: "WhatsApp" },
  { icon: Zap, label: "Automation" },
  { icon: ClipboardList, label: "Orders" },
  { icon: Boxes, label: "Inventory" },
  { icon: Truck, label: "Delivery" },
];

const stats = [
  {
    icon: Users,
    label: "New leads",
    value: "24",
    delta: "+20%",
    tint: "#e4ecff",
    color: blue,
  },
  {
    icon: PhoneCall,
    label: "Follow-ups",
    value: "08",
    delta: "+14%",
    tint: "#e4ecff",
    color: blue,
  },
  {
    icon: Package,
    label: "Orders",
    value: "12",
    delta: "+33%",
    tint: "#e4f5ec",
    color: green,
  },
];

const leads = [
  ["Rahul Sharma", "Meta Ads", "+91 98765 43210", "New", "9 Sep 2024"],
  [
    "Priya Verma",
    "Facebook Form",
    "+91 91234 56789",
    "Follow-up",
    "9 Sep 2024",
  ],
  [
    "Vivek Singh",
    "WhatsApp",
    "+91 99876 54321",
    "Order confirmed",
    "8 Sep 2024",
  ],
  [
    "Anjali Mehta",
    "Instagram Form",
    "+91 97654 32109",
    "Follow-up",
    "8 Sep 2024",
  ],
  ["Suresh Patel", "Meta Ads", "+91 90987 65432", "New", "7 Sep 2024"],
];

const statusStyle = {
  New: { bg: "#e4ecff", fg: blue },
  "Follow-up": { bg: "#fff1d6", fg: "#b86a00" },
  "Order confirmed": { bg: "#e4f5ec", fg: green },
};

/** Tiny sparkline so each stat card gets a trend curve. */
function Spark({ color }) {
  return (
    <svg width="54" height="22" viewBox="0 0 54 22" aria-hidden>
      <path
        d="M1 17 C 9 15, 12 8, 19 11 S 30 18, 36 9 S 48 4, 53 6"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Hero dashboard mockup.
 * @param {{ logoSrc?: string }} props  logoSrc — path of the LeadLo logo used in the nav (default /logo_light.png)
 */
export default function HeroSalesMockup({ logoSrc = "/logo_light.png" }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "176px 1fr",
        width: "100%",
        maxWidth: 760,
        margin: "0 auto",
        borderRadius: 18,
        overflow: "hidden",
        background: "#f7f9fe",
        boxShadow:
          "0 40px 90px rgba(11,31,74,0.22), 0 0 0 1px rgba(11,31,74,0.06)",
        fontFamily: "inherit",
        transform: "perspective(1600px) rotateY(-4deg) rotateX(2deg)",
        transformOrigin: "center",
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          background: `linear-gradient(180deg, ${navy} 0%, ${navyDeep} 100%)`,
          color: "#fff",
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ padding: "0 6px 4px" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: "6px 10px",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="LeadLo"
              style={{ height: 22, width: "auto", display: "block" }}
            />
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              marginTop: 8,
              opacity: 0.9,
            }}
          >
            CRM
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 10.5,
              color: "rgba(255,255,255,0.65)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Sample workspace <ChevronDown size={11} />
          </div>
        </div>
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.1)",
            margin: "6px 0 8px",
          }}
        />

        {navItems.map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 11.5,
              fontWeight: active ? 700 : 500,
              padding: "8px 10px",
              borderRadius: 9,
              background: active ? blue : "transparent",
              color: active ? "#fff" : "rgba(255,255,255,0.78)",
              boxShadow: active ? "0 8px 18px rgba(26,92,255,0.45)" : "none",
            }}
          >
            <Icon size={14} /> {label}
          </div>
        ))}

        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.1)",
            margin: "8px 0",
          }}
        />
        {[
          { icon: Settings, label: "Settings" },
          { icon: HelpCircle, label: "Help" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 11,
              padding: "6px 10px",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <Icon size={13} /> {label}
          </div>
        ))}
      </aside>

      {/* ── Main ── */}
      <main style={{ padding: "16px 18px 18px", minWidth: 0 }}>
        {/* top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: `1px solid ${border}`,
              borderRadius: 999,
              padding: "7px 12px",
              fontSize: 10.5,
              color: muted,
            }}
          >
            <Search size={12} /> Search leads, orders, customers…
          </div>
          <div style={{ position: "relative", color: sub }}>
            <Bell size={15} />
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#ff4d4f",
              }}
            />
          </div>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: blue,
              color: "#fff",
              fontSize: 9.5,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            AS
          </div>
        </div>

        {/* heading */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: ink,
                letterSpacing: "-0.01em",
              }}
            >
              Sales overview
            </div>
            <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>
              Track your leads, follow-ups and deliveries in real time.
            </div>
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: sub,
              background: "#fff",
              border: `1px solid ${border}`,
              borderRadius: 7,
              padding: "5px 9px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Last 30 days <ChevronDown size={10} />
          </div>
        </div>

        {/* stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 10,
            marginBottom: 12,
          }}
        >
          {stats.map(({ icon: Icon, label, value, delta, tint, color }) => (
            <div
              key={label}
              style={{
                background: "#fff",
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: "10px 12px",
                display: "flex",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: tint,
                  color,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9.5, color: muted }}>{label}</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: ink,
                    lineHeight: 1.1,
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: green,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <TrendingUp size={9} /> {delta}
                  </span>
                  <Spark color={green} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* recent leads */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: "10px 12px 6px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: ink }}>
              Recent Leads
            </div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: blue,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              View all <ArrowRight size={10} />
            </div>
          </div>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5 }}
          >
            <thead>
              <tr style={{ color: muted, textAlign: "left" }}>
                {["Name", "Source", "Phone", "Status", "Created"].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontWeight: 600,
                      padding: "6px 4px",
                      borderBottom: `1px solid ${border}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(([name, source, phone, status, date]) => {
                const s = statusStyle[status];
                return (
                  <tr
                    key={name}
                    style={{ borderBottom: `1px solid ${border}` }}
                  >
                    <td
                      style={{
                        padding: "6px 4px",
                        fontWeight: 600,
                        color: ink,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </td>
                    <td
                      style={{
                        padding: "6px 4px",
                        color: sub,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {source}
                    </td>
                    <td
                      style={{
                        padding: "6px 4px",
                        color: sub,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {phone}
                    </td>
                    <td style={{ padding: "6px 4px" }}>
                      <span
                        style={{
                          fontSize: 8.5,
                          fontWeight: 700,
                          color: s.fg,
                          background: s.bg,
                          borderRadius: 999,
                          padding: "2px 8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "6px 4px",
                        color: muted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
