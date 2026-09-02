"use client";
import {
  Rocket,
  Users,
  ShoppingBag,
  Boxes,
  Zap,
  UserCog,
  BarChart3,
  Settings,
} from "lucide-react";
import { teal, ink, sub, border } from "../../lib/marketing-theme";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";

const SECTIONS = [
  {
    icon: <Rocket size={20} color={teal} />,
    title: "Getting Started",
    body: "Sign up and pick a plan — every plan starts with a free trial, no card required. Once you're in, connect a lead source (Meta Lead Forms, Google Sheets, WhatsApp, or missed-call capture) from Automation → Lead Sources, or start by adding leads yourself under Leads.",
  },
  {
    icon: <Users size={20} color={teal} />,
    title: "Leads & Unverified Leads",
    body: "Every captured lead lands in Leads with a stage you fully control (rename/reorder stages in Settings). Leads that come in without a confirmed phone number go to Unverified Leads first, so bad data doesn't clutter your main pipeline until it's confirmed.",
  },
  {
    icon: <ShoppingBag size={20} color={teal} />,
    title: "Customers & Order Fulfillment",
    body: "Convert a lead into a customer with the Fulfill Order form — set items, payment type (prepaid/COD), delivery address, and an order stage. You can attach a file (a payment screenshot, a report) to any order for record-keeping. Order stages can be configured to automatically deduct inventory and trigger a courier shipment once confirmed.",
  },
  {
    icon: <Boxes size={20} color={teal} />,
    title: "Inventory",
    body: "Track stock per item, link items to orders so stock draws down automatically on confirmation, and get a low-stock warning based on a threshold you set in Settings.",
  },
  {
    icon: <Zap size={20} color={teal} />,
    title: "Automation",
    body: "On Pro and above, connect lead sources under Automation → Lead Sources. On Pro Max, also set up outbound WhatsApp/Email/SMS — trigger a message automatically on events like a new lead, a stage change, or a payment due date, or send manually to any lead/customer.",
  },
  {
    icon: <UserCog size={20} color={teal} />,
    title: "Team & Permissions",
    body: "Add employee logins under Team (seat limits depend on your plan) and grant exactly the Read/Write/Delete access each module needs — an employee always sees leads assigned to them regardless of permissions.",
  },
  {
    icon: <BarChart3 size={20} color={teal} />,
    title: "Reports",
    body: "See sales, delivered orders, and employee performance over any date range — filtered automatically to what a logged-in employee is allowed to see.",
  },
  {
    icon: <Settings size={20} color={teal} />,
    title: "Settings",
    body: "Configure your order stages (and which ones deduct stock, restore stock, or count as 'delivered'), default item weight for shipping, low-stock threshold, currency symbol, and delivery courier credentials.",
  },
];

export default function DocsPage() {
  return (
    <div style={{ background: "#fff", color: ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <MarketingNav />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 32px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 14 }}>
          Documentation
        </h1>
        <p style={{ fontSize: 16, color: sub, maxWidth: 560, margin: "0 auto" }}>
          A quick tour of how Zalgo CRM's modules fit together.
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px 96px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {SECTIONS.map((s) => (
            <div
              key={s.title}
              style={{
                border: `1px solid ${border}`,
                borderRadius: 14,
                padding: "22px 24px",
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(0,134,138,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13.5, color: sub, lineHeight: 1.65 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 32,
            border: `1px dashed ${border}`,
            borderRadius: 14,
            padding: "24px 26px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 14, color: sub, marginBottom: 14 }}>
            Stuck on something specific? We're happy to walk you through it.
          </div>
          <a
            href="/contact"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: teal,
              color: "#fff",
              border: "none",
              borderRadius: 9,
              padding: "11px 22px",
              fontSize: 13.5,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Contact Us
          </a>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
