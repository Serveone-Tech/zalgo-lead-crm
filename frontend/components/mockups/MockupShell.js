"use client";
import { teal, border } from "../../lib/marketing-theme";

const NAV_GROUPS = [
  { label: "OVERVIEW", items: ["Dashboard", "Notifications"] },
  { label: "PEOPLE", items: ["Leads", "Unverified Leads", "Customers", "Inventory", "Team", "Reports"] },
  { label: "SETTINGS", items: ["Automation", "Settings"] },
];

// Recreates the app's own sidebar chrome (logo, grouped nav) at a fixed
// mock scale — used as the shell for every product mockup on the
// marketing site so they all look like genuine screenshots of the same
// app, without using any real customer's data.
export default function MockupShell({ active, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${border}`,
        boxShadow: "0 24px 60px rgba(20,30,35,0.14)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex" }}>
        <div style={{ width: 118, background: "#14181b", padding: "16px 10px", flexShrink: 0 }}>
          <div style={{ color: "#fff", fontSize: 11.5, fontWeight: 800, letterSpacing: "0.03em", marginBottom: 4, paddingLeft: 4 }}>
            ZALGO
          </div>
          <div style={{ color: teal, fontSize: 6, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 16, paddingLeft: 4 }}>
            INFOTECH
          </div>
          {NAV_GROUPS.map((g) => (
            <div key={g.label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 6, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", padding: "0 8px 3px" }}>{g.label}</div>
              {g.items.map((item) => (
                <div
                  key={item}
                  style={{
                    fontSize: 8.5,
                    color: item === active ? "#fff" : "rgba(255,255,255,0.55)",
                    background: item === active ? teal : "transparent",
                    borderRadius: 5,
                    padding: "5px 8px",
                    marginBottom: 2,
                    fontWeight: item === active ? 700 : 500,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: "14px 16px", minWidth: 0, background: "#fafbfb" }}>{children}</div>
      </div>
    </div>
  );
}
