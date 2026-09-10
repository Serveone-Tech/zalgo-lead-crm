"use client";
import { useState } from "react";
import { UserPlus, MessageCircle, FileText, Truck, Check, ArrowRight, Bell, Package, Clock } from "lucide-react";
import { teal, ink, sub, muted, border } from "../lib/marketing-theme";
import { WhatsAppGlyph, MetaGlyph, PhoneCallGlyph } from "./BrandIcons";
import Reveal from "./Reveal";

const TABS = [
  {
    key: "capture",
    icon: <UserPlus size={15} />,
    label: "Capture",
    step: "STEP 01 / CAPTURE",
    headline: (
      <>
        New enquiry?
        <br />
        Already in your <span style={{ color: teal }}>CRM.</span>
      </>
    ),
    desc: "Bring Meta forms, WhatsApp messages, calls and missed calls into one place, ready for your team.",
    bullets: ["Keep the lead source visible", "Assign an owner and the next action"],
    sources: [
      { icon: <MetaGlyph size={20} />, title: "Meta form", sub: "Facebook & Instagram" },
      { icon: <WhatsAppGlyph size={20} />, title: "WhatsApp", sub: "Messages from customers" },
      { icon: <PhoneCallGlyph size={18} />, title: "Calls & missed calls", sub: "Inquiries and missed calls" },
    ],
    result: {
      tag: "NEW LEAD CAPTURED",
      name: "Priya Sharma",
      badge: "Product enquiry",
      rows: [
        ["Source", "Meta lead form"],
        ["Assigned to", "Anjali Singh"],
        ["Next action", "Respond to enquiry"],
      ],
      footer: "Ready for your team",
    },
    next: "Follow up",
  },
  {
    key: "followup",
    icon: <MessageCircle size={15} />,
    label: "Follow up",
    step: "STEP 02 / FOLLOW UP",
    headline: (
      <>
        The right follow-up.
        <br />
        At the <span style={{ color: teal }}>right time.</span>
      </>
    ),
    desc: "Record the conversation, assign the next action and keep your team on track with reminders and automated messages.",
    bullets: ["Keep notes and lead status together", "Remind the agent. Update the customer."],
    lead: { name: "Priya Sharma", badge: "Hot lead", note: "Interested. Call tomorrow.", owner: "Anjali Singh" },
    cards: [
      { tag: "AGENT REMINDER", icon: <Bell size={16} color={teal} />, title: "Tomorrow · 3:30 PM", body: "Anjali: follow up with Priya", chip: "Reminder set" },
      { tag: "CUSTOMER FOLLOW-UP", icon: <WhatsAppGlyph size={18} />, title: "", body: "Hi Priya, would you like more details about the product?", chip: "Automated message" },
    ],
    next: "Confirm order",
  },
  {
    key: "confirm",
    icon: <FileText size={15} />,
    label: "Confirm order",
    step: "STEP 03 / CONFIRM ORDER",
    headline: (
      <>
        Conversation to order.
        <br />
        Without the <span style={{ color: teal }}>confusion.</span>
      </>
    ),
    desc: "Record the order, check stock and automatically send a confirmation to your customer.",
    bullets: ["Order details and inventory in one place", "Keep your customer updated automatically"],
    order: { id: "ZG1024", name: "Priya Sharma", badge: "Confirmed", rows: [["Product", "Wellness Pack"], ["Quantity", "1"], ["Owner", "Anjali Singh"]] },
    cards: [
      { tag: "INVENTORY CHECK", icon: <Package size={16} color={teal} />, title: "Stock available", body: "Ready for fulfilment", chip: null },
      { tag: "AUTOMATIC CONFIRMATION", icon: <WhatsAppGlyph size={18} />, title: "", body: "Hi Priya, your order #ZG1024 is confirmed. Thank you!", chip: "Confirmation sent" },
    ],
    next: "Deliver & track",
  },
  {
    key: "deliver",
    icon: <Truck size={15} />,
    label: "Deliver & track",
    step: "STEP 04 / DELIVER & TRACK",
    headline: (
      <>
        Order dispatched.
        <br />
        Every update in <span style={{ color: teal }}>view.</span>
      </>
    ),
    desc: "Connect your courier through a delivery API and keep shipment updates alongside each customer's order.",
    bullets: ["Manage courier shipments in one place", "Find tracking details without chasing updates"],
    order: { id: "ZG1024", name: "Priya Sharma", badge: "Confirmed order", rows: [] },
    tracking: [
      { label: "Shipment created", sub: "Order handed over to courier", done: true },
      { label: "Picked up", sub: "Package collected", done: true },
      { label: "In transit", sub: "On the way to destination", active: true },
      { label: "Delivered", sub: "Pending", done: false },
    ],
    next: null,
  },
];

function ArrowConnector() {
  return (
    <svg width="34" height="2" viewBox="0 0 34 2" style={{ flexShrink: 0 }}>
      <line x1="0" y1="1" x2="34" y2="1" stroke={teal} strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  );
}

export default function CustomerJourney() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 48px 96px" }}>
      {/* Tab bar — a sliding capsule glides behind whichever tab is active
          instead of the fill just appearing/disappearing, and the panel
          below fades+slides in fresh on every switch. */}
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          background: "#fff",
          border: `1px solid ${border}`,
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 0,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${active * 25}%`,
            width: "25%",
            background: teal,
            borderRadius: 0,
            transition: "left 0.38s cubic-bezier(0.65,0,0.35,1)",
            zIndex: 0,
          }}
        />
        {TABS.map((t, i) => {
          const isActive = i === active;
          return (
            <button
              key={t.key}
              onClick={() => setActive(i)}
              className="journey-tab-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "16px 10px",
                border: "none",
                borderRight: i < 3 ? `1px solid ${border}` : "none",
                background: "transparent",
                color: isActive ? "#fff" : ink,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                position: "relative",
                zIndex: 1,
                transition: "color 0.25s ease",
              }}
            >
              <span style={{ fontSize: 11, opacity: 0.7 }}>0{i + 1}</span>
              {t.icon} {t.label}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    bottom: -7,
                    left: "50%",
                    transform: "translateX(-50%) rotate(45deg)",
                    width: 14,
                    height: 14,
                    background: teal,
                    transition: "left 0.38s cubic-bezier(0.65,0,0.35,1)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      <style>{`
        .journey-tab-btn:hover { color: #00868a; }
        @keyframes journeyPanelIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .journey-panel { animation: journeyPanelIn 0.45s cubic-bezier(0.16,1,0.3,1); }
      `}</style>

      {/* Panel */}
      <div
        style={{
          background: "#eef8f7",
          borderRadius: 16,
          padding: "44px 44px",
          marginTop: 26,
          overflow: "hidden",
        }}
      >
        <div key={tab.key} className="journey-panel" style={{ display: "grid", gridTemplateColumns: "0.95fr 1.15fr", gap: 48, alignItems: "start" }}>
          <Reveal>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: teal, letterSpacing: "0.12em", marginBottom: 14 }}>{tab.step}</div>
            <h3 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.22, marginBottom: 16, color: ink }}>{tab.headline}</h3>
            <p style={{ fontSize: 14, color: sub, lineHeight: 1.65, marginBottom: 20, maxWidth: 380 }}>{tab.desc}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
              {tab.bullets.map((b) => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 600, color: ink }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {b}
                </div>
              ))}
            </div>
            <a
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: teal,
                color: "#fff",
                borderRadius: 9,
                padding: "12px 22px",
                fontSize: 13.5,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Explore a 15-day free demo <ArrowRight size={15} />
            </a>
          </Reveal>

          <Reveal delay={0.1}>
            {/* Capture tab: source cards -> result card */}
            {tab.sources && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {tab.sources.map((s) => (
                    <div key={s.title} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: "12px 16px" }}>
                      {s.icon}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: ink }}>{s.title}</div>
                        <div style={{ fontSize: 11.5, color: muted }}>{s.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <ArrowConnector />
                <ResultCard {...tab.result} />
              </div>
            )}

            {/* Follow up / Confirm order tabs: lead/order card -> 2 cards */}
            {tab.cards && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {tab.lead && <LeadCard {...tab.lead} />}
                {tab.order && <OrderCard {...tab.order} />}
                <ArrowConnector />
                <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  {tab.cards.map((c) => (
                    <InfoCard key={c.tag} {...c} />
                  ))}
                </div>
              </div>
            )}

            {/* Deliver & track tab: order card -> Delivery API -> tracking stepper */}
            {tab.tracking && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <OrderCard {...tab.order} />
                <div
                  style={{
                    background: teal,
                    color: "#fff",
                    fontSize: 10.5,
                    fontWeight: 700,
                    borderRadius: 8,
                    padding: "6px 10px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Delivery API →
                </div>
                <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: 18, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: muted, letterSpacing: "0.06em" }}>SHIPMENT TRACKING</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: teal, background: "rgba(0,134,138,0.1)", borderRadius: 20, padding: "3px 10px" }}>In transit</span>
                  </div>
                  {tab.tracking.map((s, i) => (
                    <div key={s.label} style={{ display: "flex", gap: 10, marginBottom: i < tab.tracking.length - 1 ? 10 : 0 }}>
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: s.done ? "#1f8a5c" : s.active ? teal : "#eceff0",
                          color: s.done || s.active ? "#fff" : muted,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {s.done ? <Check size={11} strokeWidth={3} /> : s.active ? <Truck size={11} /> : <Clock size={10} />}
                      </span>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: ink }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: muted }}>{s.sub}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, background: "rgba(0,134,138,0.08)", borderRadius: 8, padding: "7px 10px", fontSize: 11, fontWeight: 600, color: teal, display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={12} /> Tracking linked to this order
                  </div>
                </div>
              </div>
            )}
          </Reveal>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          <span style={{ fontSize: 11, color: muted }}>Illustrative example</span>
          {tab.next ? (
            <button
              onClick={() => setActive(active + 1)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: teal, display: "flex", alignItems: "center", gap: 6 }}
            >
              Next: {tab.next} <ArrowRight size={14} />
            </button>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 700, color: teal }}>From first enquiry to final delivery.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ tag, name, badge, rows, footer }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: 16, flex: 1.1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: muted, letterSpacing: "0.06em" }}>{tag}</span>
        <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(31,138,92,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={12} color="#1f8a5c" strokeWidth={3} />
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(0,134,138,0.12)", color: teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
          {name.split(" ").map((w) => w[0]).join("")}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: ink }}>{name}</div>
          <div style={{ fontSize: 11.5, color: muted }}>{badge}</div>
        </div>
      </div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, padding: "5px 0", borderTop: `1px solid ${border}` }}>
          <span style={{ color: muted }}>{k}</span>
          <span style={{ fontWeight: 600, color: ink }}>{v}</span>
        </div>
      ))}
      <div style={{ marginTop: 12, background: "rgba(31,138,92,0.1)", color: "#1f8a5c", borderRadius: 8, padding: "7px 10px", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
        <Check size={12} strokeWidth={3} /> {footer}
      </div>
    </div>
  );
}

function LeadCard({ name, badge, note, owner }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: 16, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,134,138,0.12)", color: teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
          {name.split(" ").map((w) => w[0]).join("")}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: ink }}>{name}</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#b06a00", background: "rgba(176,106,0,0.12)", borderRadius: 20, padding: "1px 8px" }}>{badge}</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: sub, marginBottom: 10 }}>{note}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, paddingTop: 8, borderTop: `1px solid ${border}` }}>
        <span style={{ color: muted }}>Assigned to</span>
        <span style={{ fontWeight: 600, color: ink }}>{owner}</span>
      </div>
    </div>
  );
}

function OrderCard({ id, name, badge, rows }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: 16, flex: 1 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, letterSpacing: "0.06em", marginBottom: 8 }}>ORDER #{id}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: rows.length ? 10 : 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(0,134,138,0.12)", color: teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
          {name.split(" ").map((w) => w[0]).join("")}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: ink }}>{name}</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#1f8a5c", background: "rgba(31,138,92,0.12)", borderRadius: 20, padding: "1px 8px" }}>{badge}</span>
        </div>
      </div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, padding: "5px 0", borderTop: `1px solid ${border}` }}>
          <span style={{ color: muted }}>{k}</span>
          <span style={{ fontWeight: 600, color: ink }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function InfoCard({ tag, icon, title, body, chip }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 700, color: muted, letterSpacing: "0.06em" }}>{tag}</span>
      </div>
      {title && <div style={{ fontSize: 13, fontWeight: 700, color: ink, marginBottom: 2 }}>{title}</div>}
      <div style={{ fontSize: 12, color: sub, lineHeight: 1.5 }}>{body}</div>
      {chip && (
        <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(31,138,92,0.1)", color: "#1f8a5c", borderRadius: 20, padding: "3px 9px", fontSize: 10.5, fontWeight: 700 }}>
          <Check size={10} strokeWidth={3} /> {chip}
        </div>
      )}
    </div>
  );
}
