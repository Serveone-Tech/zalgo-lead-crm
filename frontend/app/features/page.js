"use client";
import { useRouter } from "next/navigation";
import {
  Download,
  BellRing,
  MessagesSquare,
  TrendingUp,
  Users,
  Package,
  Truck,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { teal, ink, sub, muted, border } from "../../lib/marketing-theme";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import DashboardMockup from "../../components/mockups/DashboardMockup";

const FEATURES = [
  {
    icon: <Download size={22} color={teal} />,
    title: "Automatic Lead Capture",
    desc: "Every lead from Meta Ads, Google Ads, Google Sheets, WhatsApp, and missed calls lands in one inbox automatically — nobody has to copy-paste anything between tools ever again.",
  },
  {
    icon: <BellRing size={22} color={teal} />,
    title: "Smart Follow-up Reminders",
    desc: "Set a follow-up once and the system nudges your team at the right time, every time. No lead sits forgotten in a spreadsheet or a sticky note.",
  },
  {
    icon: <MessagesSquare size={22} color={teal} />,
    title: "WhatsApp, SMS & Email Automation",
    desc: "Trigger a personalized WhatsApp, SMS, or email the moment a lead comes in, converts, or has a payment due — sent from your own numbers, fully automated.",
  },
  {
    icon: <TrendingUp size={22} color={teal} />,
    title: "Lead Status & Sales Pipeline",
    desc: "Track every lead through your own custom pipeline stages, see exactly where deals are stuck, and act on it before it goes cold.",
  },
  {
    icon: <Users size={22} color={teal} />,
    title: "Team & Role Management",
    desc: "Assign leads to specific reps, control exactly what each teammate can see and do with granular Read/Write/Delete permissions, and keep every conversation accountable.",
  },
  {
    icon: <Package size={22} color={teal} />,
    title: "Inventory Management",
    desc: "Track stock levels as orders are fulfilled, get low-stock alerts before you run out, and never overcommit to a customer again.",
  },
  {
    icon: <Truck size={22} color={teal} />,
    title: "Order & Delivery Tracking",
    desc: "Fulfil orders, auto-create the shipment with your courier of choice, and track delivery status right inside the CRM — no switching tabs to a courier portal.",
  },
  {
    icon: <BarChart3 size={22} color={teal} />,
    title: "Sales Reports & Insights",
    desc: "Download a ready-made sales report — delivered orders, revenue, and who closed what — filtered to any date range, whenever you need it.",
  },
];

const STATS = [
  { v: "8+", l: "Core Modules" },
  { v: "4", l: "Lead Channels" },
  { v: "3", l: "Automation Channels" },
  { v: "14 days", l: "Free Trial" },
];

export default function FeaturesPage() {
  const router = useRouter();
  return (
    <div style={{ background: "#fff", color: ink, fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}>
      <MarketingNav />

      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: -100,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,168,173,0.12) 0%, rgba(0,168,173,0) 70%)",
            pointerEvents: "none",
          }}
        />
        <Reveal style={{ maxWidth: 900, margin: "0 auto", padding: "72px 48px 24px", textAlign: "center", position: "relative" }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
            Everything You Need to <span style={{ color: teal }}>Never Miss a Lead</span>
          </h1>
          <p style={{ fontSize: 16, color: sub, maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
            One CRM that captures, organizes, and automates every step of your sales process — from the first
            enquiry on WhatsApp to a delivered order sitting in the customer&apos;s hands. No spreadsheets,
            no juggling five different apps.
          </p>
        </Reveal>

        <Reveal delay={0.15} style={{ maxWidth: 940, margin: "36px auto 0", padding: "0 48px" }}>
          <DashboardMockup />
        </Reveal>

        <Reveal delay={0.25} style={{ maxWidth: 780, margin: "48px auto 0", padding: "0 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, textAlign: "center" }}>
            {STATS.map((s) => (
              <div key={s.l}>
                <div style={{ fontSize: 26, fontWeight: 800, color: teal }}>{s.v}</div>
                <div style={{ fontSize: 11.5, color: muted, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 48px 96px" }}>
        <SectionHeading subtitle="Eight modules that cover the whole journey — capturing a lead, working it, fulfilling the order, and reporting on how the business is doing.">
          Built for the <span style={{ color: teal }}>Whole Sales Process</span>
        </SectionHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 0.08}>
              <div className="feature-card" style={{ border: `1px solid ${border}`, borderRadius: 14, padding: "24px 20px" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(0,134,138,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  {f.icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: sub, lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <style>{`
        .feature-card {
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(20,30,35,0.1);
        }
      `}</style>

      <Reveal as="div" style={{ padding: "0 48px 80px" }}>
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            background: `linear-gradient(120deg, ${teal} 0%, #045d60 100%)`,
            borderRadius: 20,
            padding: "40px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>See it all in action</div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.8)" }}>Book a free demo and we&apos;ll walk you through it.</div>
          </div>
          <button
            onClick={() => router.push("/register")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              color: teal,
              border: "none",
              borderRadius: 9,
              padding: "13px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Book a Free Demo <ArrowRight size={15} />
          </button>
        </div>
      </Reveal>

      <MarketingFooter />
    </div>
  );
}
