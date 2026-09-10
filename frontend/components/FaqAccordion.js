"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { teal, ink, sub, border } from "../lib/marketing-theme";

const FAQS = [
  {
    q: "Can all my agents use one WhatsApp number?",
    a: "Yes. Your team can work through one connected business number. Agents see only their assigned contacts and messages, while managers can track team activity.",
  },
  {
    q: "What can I try during the 15-day free trial?",
    a: "Everything — lead capture from Meta, WhatsApp and calls, follow-up automation, order confirmation, inventory and delivery tracking. No feature is held back during the trial.",
  },
  {
    q: "How much does it cost after the trial?",
    a: "Plans are priced by team size and features you need. See the Pricing page for current plans, or talk to us for a recommendation based on your workflow.",
  },
  {
    q: "Are WhatsApp and courier charges included?",
    a: "WhatsApp messaging is billed by Meta based on conversation volume, and courier charges are billed by your own delivery provider — Zalgo CRM connects to both but doesn't mark up either.",
  },
  {
    q: "Will Meta leads and missed calls enter the CRM automatically?",
    a: "Yes. Once you connect your Meta Lead Forms and phone system, new enquiries and missed calls are captured automatically — no manual entry needed.",
  },
  {
    q: "Can I bring my existing leads from Google Sheets?",
    a: "Yes, bulk import from a spreadsheet is supported, and you can also keep a live Google Sheet synced in for ongoing capture.",
  },
  {
    q: "Can I manage orders, inventory and delivery tracking?",
    a: "Yes — confirmed orders deduct from inventory automatically, and connecting a courier through our delivery API keeps shipment status visible against each order.",
  },
  {
    q: "What setup is needed, and will my team get help?",
    a: "Most teams are up and running within a day. We help you connect WhatsApp, Meta and your courier, and your team gets onboarding support throughout the trial.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={f.q}
            style={{
              background: isOpen ? "#eef8f7" : "#fff",
              border: `1px solid ${isOpen ? "rgba(0,134,138,0.25)" : border}`,
              borderRadius: 12,
              overflow: "hidden",
              transition: "background 0.2s",
            }}
          >
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "18px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 700, color: ink }}>{f.q}</span>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: teal,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isOpen ? <Minus size={13} /> : <Plus size={13} />}
              </span>
            </button>
            <div
              style={{
                maxHeight: isOpen ? 200 : 0,
                opacity: isOpen ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.3s ease, opacity 0.25s ease",
              }}
            >
              <p style={{ fontSize: 13.5, color: sub, lineHeight: 1.6, margin: "0 20px 18px" }}>{f.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
