"use client";
import { useState, useMemo } from "react";
import {
  Rocket,
  Users,
  MessageCircle,
  Zap,
  ShoppingBag,
  Truck,
  Boxes,
  UserCog,
  BarChart3,
  Settings,
  CreditCard,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { teal, tealDeep, ink, sub, muted, border, mint } from "../../lib/marketing-theme";
import { poppins } from "../../lib/marketing-font";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import MarketingStyles from "../../components/MarketingStyles";

/* ────────────────────────────────────────────────────────────────
 * Content — every section/article a new tenant needs to go from
 * "just registered" to "fully running their sales flow" on LeadLo.
 * Each article's `blocks` is a small schema: plain strings render as
 * paragraphs, {steps:[...]} renders a numbered list, {note:"..."}
 * renders a callout.
 * ──────────────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    blurb: "Create your account, pick a plan, and set up your workspace.",
    articles: [
      {
        slug: "create-account-and-log-in",
        title: "Create your account & log in",
        blocks: [
          "LeadLo doesn't require a credit card to get started — you can be inside your workspace in under a minute.",
          {
            steps: [
              "Go to the Register page and enter your name, email, phone, and a password.",
              "Submit the form — this creates your account as the workspace Owner (every teammate you add later is created under this account).",
              "You're taken straight into a short onboarding flow to name your company before landing on the Dashboard.",
              "From then on, use Log in with the same email and password. Forgot your password? Use \"Forgot password\" on the login page — a reset OTP is emailed to you.",
            ],
          },
          { note: "The account you register with becomes the Owner — the only role that can manage billing, add employees, and see every lead regardless of assignment." },
        ],
      },
      {
        slug: "choose-a-plan",
        title: "Choose a plan & start your free trial",
        blocks: [
          "Every new account starts on a free trial automatically — no plan needs to be picked on day one.",
          {
            steps: [
              "Open Plans from the sidebar to see the tiers: Basic, Pro, Pro Max, and Custom.",
              "Each plan lists what it unlocks — Basic covers core lead/customer management, Pro adds connected lead sources (Meta Ads, Google Sheets), Pro Max adds outbound WhatsApp/Email/SMS automation and more team seats.",
              "When you're ready, pick a plan and complete checkout (monthly or yearly billing) — your trial data carries over, nothing is reset.",
              "Need more employee seats later? Add them any time from Plans without changing your base plan.",
            ],
          },
          { note: "If your trial or subscription lapses, you'll be redirected to Plans automatically the next time you try to use a gated feature — your data stays safe, it's just locked until you renew." },
        ],
      },
      {
        slug: "set-up-your-company",
        title: "Set up your company (onboarding & first steps)",
        blocks: [
          "A few quick settings make everything downstream — reports, order forms, WhatsApp messages — reflect your actual business.",
          {
            steps: [
              "In Settings, set your currency symbol and default item weight (used for shipping calculations).",
              "Under Settings → Order Stages, review or rename the pipeline stages orders move through (e.g. Confirmed → Shipped → Delivered) — mark which stage(s) deduct inventory, which restore it, and which count as \"delivered\" for reporting.",
              "Set your low-stock threshold so Inventory warns you before you run out of an item.",
              "If you plan to ship orders, add your courier account credentials under Settings → Delivery.",
              "Head to Leads and add your first lead, or connect a lead source under Automation → Lead Sources to start capturing them automatically.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "leads",
    title: "Leads Management",
    icon: Users,
    blurb: "Capture, organize, and follow up on every enquiry.",
    articles: [
      {
        slug: "add-and-import-leads",
        title: "Add leads manually or import in bulk",
        blocks: [
          {
            steps: [
              "Go to Leads and click + Add Lead — fill in name, phone, platform, and an optional follow-up date.",
              "To import many at once, use Bulk Upload on the Leads page and upload a CSV with your existing leads.",
              "Leads captured through a connected source (Meta Lead Ads, WhatsApp, Google Sheets) appear here automatically — no manual entry needed once Lead Sources are connected.",
            ],
          },
          { note: "A lead with an unconfirmed phone number is routed to Unverified Leads first, keeping your main Leads pipeline clean until it's confirmed." },
        ],
      },
      {
        slug: "stages-kanban-and-unverified",
        title: "Lead stages, Kanban view & Unverified Leads",
        blocks: [
          "Every lead sits in a stage you fully control — the default pipeline is New → Follow-up → Converted/Lost, but you can rename or reorder stages to match how your team actually sells.",
          {
            steps: [
              "Switch the Leads page between Table and Kanban view using the toggle at the top — Kanban groups every lead by stage so you can drag-review your pipeline at a glance.",
              "Use the search bar and the stage / platform / date / assignee filters to narrow down the list — search and filters query your whole pipeline, not just what's currently loaded on screen.",
              "Review Unverified Leads periodically — confirm a phone number to promote a lead into the main pipeline, or discard it if it's spam/invalid.",
            ],
          },
        ],
      },
      {
        slug: "assign-and-follow-up",
        title: "Assign leads & manage follow-ups",
        blocks: [
          {
            steps: [
              "Open a lead and set Assigned To to hand it to a specific team member — they'll see it in their own filtered Leads view.",
              "Set a Follow-up date on a lead to have it surface under Notifications and on the Dashboard's Overdue/Today follow-up lists.",
              "Use Select All + bulk actions on the Leads page to reassign or change the stage of many leads at once — bulk select respects whatever filters are currently applied.",
            ],
          },
          { note: "Without the \"View all leads\" permission, an employee only ever sees leads assigned to them — this is enforced on every page and every report, not just the Leads list." },
        ],
      },
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp & Messaging",
    icon: MessageCircle,
    blurb: "Connect your number and chat with leads from one shared inbox.",
    articles: [
      {
        slug: "connect-whatsapp-number",
        title: "Connect your WhatsApp Business number",
        blocks: [
          "LeadLo talks to WhatsApp through Meta's official Cloud API — you connect your own WhatsApp Business number, and every message sent/received goes through your own account (LeadLo never sends from a shared number).",
          {
            steps: [
              "Go to Automation → Channel Setup and start the WhatsApp connection flow.",
              "You'll be taken through Meta's Embedded Signup — log in with the Facebook account tied to your business, then pick or create the WhatsApp Business Account and phone number you want to connect.",
              "Once connected, LeadLo shows your number's status (connected, message templates available, etc.) right on the Channel Setup screen.",
            ],
          },
          { note: "This step requires a Meta Business Account and, for anything beyond testing, an app that's completed Meta's App Review for WhatsApp permissions — this is a one-time setup." },
        ],
      },
      {
        slug: "whatsapp-inbox-and-templates",
        title: "Chat with leads from the WhatsApp inbox",
        blocks: [
          {
            steps: [
              "Open WhatsApp from the sidebar — every lead with a phone number appears as a conversation, sorted by most recent activity, just like a normal WhatsApp chat list.",
              "Click a conversation to see the full two-way thread and reply directly — replies send live through your connected number.",
              "For the first message to a new contact (or after a 24-hour window closes), WhatsApp requires an approved message template rather than free-form text — manage your templates under Automation → Channel Setup.",
            ],
          },
        ],
      },
      {
        slug: "lead-sources",
        title: "Capture leads automatically (Lead Sources)",
        blocks: [
          "Lead Sources connect an external channel so new enquiries land in your Leads pipeline without anyone typing them in.",
          {
            steps: [
              "Go to Automation → Lead Sources (Pro plan and above).",
              "Connect Meta Lead Ads to pull in leads the moment someone submits a Facebook/Instagram lead form.",
              "Connect a Google Sheet if you're already collecting enquiries there — new rows sync in as leads.",
              "Each source can be reviewed or disconnected from the same screen at any time.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "automation",
    title: "Automation",
    icon: Zap,
    blurb: "Let LeadLo message leads and customers automatically.",
    articles: [
      {
        slug: "automated-triggers",
        title: "Set up automated triggers",
        blocks: [
          "On Pro Max, LeadLo can send a WhatsApp/Email/SMS message automatically the moment something happens — no one has to remember to follow up manually.",
          {
            steps: [
              "Go to Automation → Triggers and choose an event: a new lead comes in, a lead's stage changes, or a customer's payment becomes due.",
              "Pick the channel (WhatsApp/Email/SMS) and the message template or content to send.",
              "Save the trigger — it now runs automatically in the background for every matching lead or customer going forward.",
            ],
          },
          { note: "Triggers only run for events happening from the moment you save them onward — they don't retroactively message your existing pipeline." },
        ],
      },
      {
        slug: "manual-and-bulk-sends",
        title: "Manual & bulk WhatsApp sends",
        blocks: [
          {
            steps: [
              "From any lead or customer, use the message icon to send a one-off WhatsApp message without setting up a trigger.",
              "On the Customers page, select multiple customers with the checkboxes, then use Message Selected to send one message to the whole group at once (e.g. an offer or an update).",
              "Sent bulk campaigns show a delivered/failed count so you know exactly how many actually went through.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "customers-orders",
    title: "Customers & Orders",
    icon: ShoppingBag,
    blurb: "Turn leads into paying customers and fulfill their orders.",
    articles: [
      {
        slug: "convert-lead-to-customer",
        title: "Convert a lead into a customer",
        blocks: [
          {
            steps: [
              "Open a lead that's ready to buy and move its stage to Converted (or your equivalent \"won\" stage).",
              "This creates a matching entry under Customers, carrying over their name, phone, and contact details.",
              "From there, use Fulfill Order on the customer to record what they're actually buying.",
            ],
          },
        ],
      },
      {
        slug: "fulfill-an-order",
        title: "Fulfill an order & track payments",
        blocks: [
          {
            steps: [
              "On a customer, click Fulfill Order and add the items, quantity, and price — items you've added under Inventory can be picked directly so stock tracking stays linked.",
              "Choose the payment type: Prepaid (collected in full up front) or COD (Cash on Delivery, with an optional advance and a remaining balance tracked automatically).",
              "Set the delivery address and pick an order stage (e.g. Processing) to start it moving through your pipeline.",
              "Optionally attach a file — a payment screenshot or any document worth keeping on record for this order.",
            ],
          },
        ],
      },
      {
        slug: "order-stages-and-reports",
        title: "Order stages, attachments & sales reports",
        blocks: [
          "Order stages aren't just labels — they can automatically deduct stock, restore it, or mark an order as delivered, depending on how you've configured them in Settings.",
          {
            steps: [
              "Move an order into a stage flagged \"deduct stock\" (e.g. Confirmed) and LeadLo draws down inventory and, if a courier is connected, creates the shipment automatically.",
              "Move it into a \"restore stock\" stage (e.g. Cancelled) and any deducted stock is given back.",
              "From the Customers page, use Sales Report to download an Excel export of orders in a date range or a specific stage — useful for accounting or a quick sales review.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery & Tracking",
    icon: Truck,
    blurb: "Ship orders and keep customers updated automatically.",
    articles: [
      {
        slug: "connect-a-courier",
        title: "Connect a courier & auto-ship orders",
        blocks: [
          {
            steps: [
              "Go to Settings → Delivery and add the API credentials for your courier account (whichever provider your business already ships with).",
              "Once connected, moving an order into a \"deduct stock\"/confirmed stage automatically creates a shipment with that courier and stores the resulting tracking ID on the order.",
              "If a shipment attempt fails (bad address, courier API error), the order shows the error inline so you can fix and retry from the same screen.",
            ],
          },
        ],
      },
      {
        slug: "track-and-returns",
        title: "Track deliveries & handle returns",
        blocks: [
          {
            steps: [
              "Open any order to see its current tracking ID and courier — shareable with the customer directly.",
              "If an order is returned or cancelled after shipping, move it to your Cancelled/RTO stage — this restores deducted stock automatically if that stage is configured to do so.",
              "Deleted orders aren't destroyed immediately — they move to Trash, where an Owner can restore or permanently remove them.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: Boxes,
    blurb: "Keep stock counts accurate as orders come in.",
    articles: [
      {
        slug: "add-and-link-stock",
        title: "Add stock & link items to orders",
        blocks: [
          {
            steps: [
              "Go to Inventory and add each item with a name, SKU/HSN code (optional), and current stock quantity.",
              "When fulfilling an order, pick items straight from your inventory list instead of typing them freehand — this is what lets stock draw down automatically.",
              "Stock only moves when an order's stage is configured to deduct or restore it (see Order Stages in Settings) — simply creating an order doesn't touch stock on its own.",
            ],
          },
        ],
      },
      {
        slug: "low-stock-alerts",
        title: "Low-stock alerts",
        blocks: [
          {
            steps: [
              "Set your low-stock threshold once under Settings — it applies to every item unless you override it per item.",
              "Any item at or below that threshold is flagged on the Inventory page and counted in the sidebar's low-stock badge, so it's visible from anywhere in the app.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "team",
    title: "Team & Permissions",
    icon: UserCog,
    blurb: "Bring your team in with exactly the access each role needs.",
    articles: [
      {
        slug: "add-employees",
        title: "Add employees & assign roles",
        blocks: [
          {
            steps: [
              "Go to Team and click + Add Employee — set their name, login email, and password (seat count depends on your plan; add more seats from Plans if needed).",
              "For each module (Leads, Customers, Inventory, Automation, etc.) choose Read / Write / Delete access individually — nothing is granted by default beyond what you tick.",
              "Toggle \"View all leads\" on for anyone who should see the whole pipeline instead of only leads assigned to them.",
            ],
          },
        ],
      },
      {
        slug: "what-employees-see",
        title: "What an employee can see",
        blocks: [
          "Permissions are enforced consistently everywhere in the app — not just on the page an employee opens, but in every report, count, and bulk action too.",
          {
            steps: [
              "Without \"View all leads\", an employee's Leads page, Dashboard counts, and Reports all automatically filter down to just their assigned leads/customers.",
              "An employee without a given module's Read permission won't see that item in their sidebar at all.",
              "The Owner (and any account without a parent_id) always sees everything, regardless of permission toggles.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    icon: BarChart3,
    blurb: "See how sales and your team are actually performing.",
    articles: [
      {
        slug: "reading-reports",
        title: "Reading your Reports dashboard",
        blocks: [
          {
            steps: [
              "Open Reports and pick a date range to see total sales, delivered orders, and revenue collected in that window.",
              "Use the by-employee breakdown to see each team member's lead conversions and order volume — handy for performance reviews or incentive tracking.",
              "Everything here respects the same visibility rules as the rest of the app — an employee only ever sees numbers for what they're allowed to see.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    blurb: "Configure the details every other module relies on.",
    articles: [
      {
        slug: "order-stages-settings",
        title: "Order stages & delivery defaults",
        blocks: [
          {
            steps: [
              "Under Settings → Order Stages, add, rename, or reorder the stages your orders move through.",
              "For each stage, flag whether it deducts inventory, restores inventory, or counts as \"delivered\" for Sales Report purposes — a stage can carry more than one of these flags.",
              "Set a default item weight (used when calculating shipping with your connected courier).",
            ],
          },
        ],
      },
      {
        slug: "currency-and-credentials",
        title: "Currency, low-stock threshold & courier credentials",
        blocks: [
          {
            steps: [
              "Set your currency symbol once — it's used across order totals, reports, and customer-facing amounts everywhere in the app.",
              "Set your low-stock threshold, the trigger point for Inventory's low-stock warnings.",
              "Add or update your courier account's API credentials here — this is what powers automatic shipment creation from Customers & Orders.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "billing",
    title: "Billing & Plans",
    icon: CreditCard,
    blurb: "Understand what each plan unlocks and manage your subscription.",
    articles: [
      {
        slug: "plan-tiers-explained",
        title: "Understand plan tiers & features",
        blocks: [
          {
            steps: [
              "Basic covers core lead and customer management — enough to run leads, customers, orders, and inventory manually.",
              "Pro adds connected Lead Sources (Meta Ads, Google Sheets) so new enquiries flow in automatically instead of manual entry.",
              "Pro Max adds outbound WhatsApp/Email/SMS automation (triggers, bulk sends) and more included employee seats.",
              "Custom is a tailored plan for larger teams — reach out from the Contact page to discuss it.",
            ],
          },
        ],
      },
      {
        slug: "upgrade-seats-renew",
        title: "Upgrade, add seats, renew or cancel",
        blocks: [
          {
            steps: [
              "Open Plans any time to upgrade to a higher tier — your existing data carries over with no interruption.",
              "Need more employee logins than your plan includes? Add extra seats from the same page without changing your base plan.",
              "Subscriptions renew automatically on your billing cycle; cancel any time and you'll keep access until the current paid period ends.",
              "If a subscription lapses, your data is kept safe and simply becomes read-only/locked until you renew.",
            ],
          },
        ],
      },
    ],
  },
];

const ALL_ARTICLES = SECTIONS.flatMap((sec) =>
  sec.articles.map((a) => ({ ...a, sectionId: sec.id, sectionTitle: sec.title, sectionIcon: sec.icon })),
);

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [activeSlug, setActiveSlug] = useState(null); // null = landing view
  const [openSectionId, setOpenSectionId] = useState(null); // sidebar accordion
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const active = useMemo(
    () => ALL_ARTICLES.find((a) => a.slug === activeSlug) || null,
    [activeSlug],
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_ARTICLES.filter(
      (a) => a.title.toLowerCase().includes(q) || a.sectionTitle.toLowerCase().includes(q),
    );
  }, [query]);

  const openArticle = (slug, sectionId) => {
    setActiveSlug(slug);
    setOpenSectionId(sectionId);
    setMobileNavOpen(false);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const goHome = () => {
    setActiveSlug(null);
    setQuery("");
  };

  const activeIndexFlat = active ? ALL_ARTICLES.findIndex((a) => a.slug === active.slug) : -1;
  const prevArticle = activeIndexFlat > 0 ? ALL_ARTICLES[activeIndexFlat - 1] : null;
  const nextArticle =
    activeIndexFlat >= 0 && activeIndexFlat < ALL_ARTICLES.length - 1 ? ALL_ARTICLES[activeIndexFlat + 1] : null;

  return (
    <div className={`${poppins.className} mk-page`} style={{ background: "#fff", color: ink }}>
      <MarketingNav />

      {/* ── Hero / search — always visible at the top ───────────── */}
      <div
        style={{
          background: `linear-gradient(180deg, ${mint} 0%, #ffffff 100%)`,
          padding: "56px 24px 40px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: `1px solid ${border}`,
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 12.5,
            fontWeight: 700,
            color: teal,
            marginBottom: 18,
          }}
        >
          <Rocket size={13} /> HELP CENTER
        </div>
        <h1
          onClick={goHome}
          style={{
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: 14,
            cursor: "pointer",
          }}
        >
          How can we help you?
        </h1>
        <p style={{ fontSize: 15, color: sub, maxWidth: 520, margin: "0 auto 26px", lineHeight: 1.6 }}>
          Everything you need to set up LeadLo yourself — from creating your account to running full
          WhatsApp automation and deliveries.
        </p>
        <div style={{ position: "relative", maxWidth: 520, margin: "0 auto" }}>
          <Search size={17} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: muted }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles — e.g. “WhatsApp”, “inventory”, “employees”"
            style={{
              width: "100%",
              padding: "13px 16px 13px 44px",
              borderRadius: 12,
              border: `1px solid ${border}`,
              fontSize: 14,
              outline: "none",
              boxShadow: "0 10px 30px rgba(20,40,90,0.08)",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* ── Search results dropdown-style list ──────────────────── */}
      {searchResults ? (
        <div className="mk-wrap" style={{ padding: "36px 24px 96px", maxWidth: 720 }}>
          <div style={{ fontSize: 13, color: muted, marginBottom: 16 }}>
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for “{query}”
          </div>
          {searchResults.length === 0 ? (
            <div style={{ color: sub, fontSize: 14 }}>No matching articles — try a different word.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {searchResults.map((a) => {
                const Icon = a.sectionIcon;
                return (
                  <button
                    key={a.slug}
                    onClick={() => openArticle(a.slug, a.sectionId)}
                    className="hc-result"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      textAlign: "left",
                      padding: "14px 16px",
                      border: `1px solid ${border}`,
                      borderRadius: 12,
                      background: "#fff",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: mint,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color={teal} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{a.title}</div>
                      <div style={{ fontSize: 11.5, color: muted }}>{a.sectionTitle}</div>
                    </span>
                    <ChevronRight size={16} color={muted} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : !active ? (
        /* ── Landing — category cards ──────────────────────────── */
        <div className="mk-wrap" style={{ padding: "36px 24px 96px", maxWidth: 1160 }}>
          <div
            className="hc-card-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}
          >
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => openArticle(sec.articles[0].slug, sec.id)}
                  className="hover-lift"
                  style={{
                    textAlign: "left",
                    border: `1px solid ${border}`,
                    borderRadius: 16,
                    padding: "26px 24px",
                    background: "#fff",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      background: mint,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Icon size={20} color={teal} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{sec.title}</div>
                  <div style={{ fontSize: 13, color: sub, lineHeight: 1.55, marginBottom: 14 }}>{sec.blurb}</div>
                  <div style={{ fontSize: 12, color: muted, fontWeight: 600 }}>
                    {sec.articles.length} article{sec.articles.length !== 1 ? "s" : ""}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Two-pane article view — sidebar + content ─────────── */
        <div className="mk-wrap" style={{ maxWidth: 1160, padding: "36px 24px 96px" }}>
          <button
            onClick={() => setMobileNavOpen((o) => !o)}
            className="hc-mobile-toggle"
            style={{
              display: "none",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              padding: "9px 14px",
              border: `1px solid ${border}`,
              borderRadius: 9,
              background: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {mobileNavOpen ? <X size={16} /> : <Menu size={16} />} Sections
          </button>

          <div className="hc-layout" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 40, alignItems: "start" }}>
            {/* Sidebar */}
            <aside className={`hc-sidebar ${mobileNavOpen ? "hc-sidebar-open" : ""}`} style={{ position: "sticky", top: 90 }}>
              <button
                onClick={goHome}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  color: teal,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  marginBottom: 18,
                  fontFamily: "inherit",
                }}
              >
                <ChevronLeft size={15} /> All Sections
              </button>
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isOpen = openSectionId === sec.id;
                return (
                  <div key={sec.id} style={{ marginBottom: 6 }}>
                    <button
                      onClick={() => setOpenSectionId(isOpen ? null : sec.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "none",
                        border: "none",
                        padding: "9px 8px",
                        borderRadius: 8,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        color: ink,
                      }}
                    >
                      <Icon size={15} color={isOpen ? teal : muted} />
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: isOpen ? 700 : 600 }}>{sec.title}</span>
                      <ChevronDown
                        size={14}
                        color={muted}
                        style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{ display: "flex", flexDirection: "column", marginLeft: 33, marginTop: 2 }}>
                        {sec.articles.map((a) => {
                          const isActive = a.slug === activeSlug;
                          return (
                            <button
                              key={a.slug}
                              onClick={() => openArticle(a.slug, sec.id)}
                              style={{
                                textAlign: "left",
                                background: isActive ? mint : "none",
                                border: "none",
                                borderRadius: 7,
                                padding: "8px 10px",
                                fontSize: 12.5,
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? tealDeep : sub,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                marginBottom: 2,
                              }}
                            >
                              {a.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </aside>

            {/* Content */}
            <article>
              <div style={{ fontSize: 12.5, color: muted, marginBottom: 10 }}>
                Help Center <ChevronRight size={11} style={{ verticalAlign: -1, margin: "0 2px" }} /> {active.sectionTitle}{" "}
                <ChevronRight size={11} style={{ verticalAlign: -1, margin: "0 2px" }} /> {active.title}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 22, lineHeight: 1.25 }}>
                {active.title}
              </h1>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {active.blocks.map((block, i) => {
                  if (typeof block === "string") {
                    return (
                      <p key={i} style={{ fontSize: 15, color: sub, lineHeight: 1.75 }}>
                        {block}
                      </p>
                    );
                  }
                  if (block.steps) {
                    return (
                      <ol key={i} style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                        {block.steps.map((s, j) => (
                          <li key={j} style={{ fontSize: 15, color: ink, lineHeight: 1.7 }}>
                            {s}
                          </li>
                        ))}
                      </ol>
                    );
                  }
                  if (block.note) {
                    return (
                      <div
                        key={i}
                        style={{
                          background: mint,
                          border: `1px solid ${border}`,
                          borderRadius: 10,
                          padding: "14px 16px",
                          fontSize: 13.5,
                          color: ink,
                          lineHeight: 1.6,
                        }}
                      >
                        💡 {block.note}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Prev / Next */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  marginTop: 44,
                  paddingTop: 24,
                  borderTop: `1px solid ${border}`,
                }}
              >
                {prevArticle ? (
                  <button
                    onClick={() => openArticle(prevArticle.slug, prevArticle.sectionId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "none",
                      border: `1px solid ${border}`,
                      borderRadius: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      maxWidth: "48%",
                    }}
                  >
                    <ChevronLeft size={15} color={muted} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {prevArticle.title}
                    </span>
                  </button>
                ) : (
                  <span />
                )}
                {nextArticle && (
                  <button
                    onClick={() => openArticle(nextArticle.slug, nextArticle.sectionId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "none",
                      border: `1px solid ${border}`,
                      borderRadius: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "right",
                      maxWidth: "48%",
                      marginLeft: "auto",
                    }}
                  >
                    <span style={{ fontSize: 12.5, color: sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {nextArticle.title}
                    </span>
                    <ChevronRight size={15} color={muted} style={{ flexShrink: 0 }} />
                  </button>
                )}
              </div>
            </article>
          </div>
        </div>
      )}

      <MarketingFooter />
      <MarketingStyles />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hc-result:hover { border-color: ${teal} !important; }
        @media (max-width: 860px) {
          .hc-card-grid { grid-template-columns: 1fr !important; }
          .hc-layout { grid-template-columns: 1fr !important; }
          .hc-mobile-toggle { display: inline-flex !important; }
          .hc-sidebar { display: none; position: static !important; }
          .hc-sidebar-open { display: block !important; margin-bottom: 24px; }
        }
      `,
        }}
      />
    </div>
  );
}
