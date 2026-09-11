"use client";
import { teal } from "../lib/marketing-theme";

// Shared CSS for every public marketing page — extracted from the
// homepage's own design system so Features/Solutions/Automation Suite/
// Pricing/Resources/Contact all get the identical hover/float/responsive
// treatment instead of each page re-declaring its own subset.
// Usage: render once per page, alongside a root element carrying
// className={`${poppins.className} mk-page`} and inner wrappers using
// mk-wrap/mk-2col/mk-3col/mk-4col/mk-h1/mk-h2 as needed.
export default function MarketingStyles() {
  return (
    <style>{`
      .mk-page { -webkit-font-smoothing: antialiased; }
      .mk-wrap { max-width: 1400px; margin: 0 auto; }

      /* Animated dotted connector lines */
      .flow-dots { animation: flowDots 0.9s linear infinite; }
      @keyframes flowDots { to { stroke-dashoffset: -16; } }

      /* Hero float */
      .float-mockup { animation: floatMockup 5s ease-in-out infinite; }
      @keyframes floatMockup { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      .float-card {
        position: absolute; z-index: 3; background: #fff; border-radius: 16px;
        box-shadow: 0 20px 44px rgba(20,30,35,0.16); padding: 16px 20px;
        display: flex; align-items: center; gap: 14px;
      }
      .float-card-a { animation: floatA 4.4s ease-in-out infinite; }
      .float-card-b { animation: floatB 5.2s ease-in-out infinite; }
      .float-card-c { animation: floatC 4.8s ease-in-out infinite; }
      @keyframes floatA { 0%,100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
      @keyframes floatB { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
      @keyframes floatC { 0%,100% { transform: translateY(0); } 50% { transform: translateY(7px); } }

      .crm-pulse { animation: crmPulse 2.6s ease-in-out infinite; }
      @keyframes crmPulse {
        0%,100% { box-shadow: 0 18px 40px rgba(0,134,138,0.30); }
        50%     { box-shadow: 0 18px 54px rgba(0,134,138,0.50); }
      }

      .hover-lift { transition: transform .28s cubic-bezier(.16,1,.3,1), box-shadow .28s ease, border-color .28s ease; }
      .hover-lift:hover { transform: translateY(-6px); box-shadow: 0 22px 44px rgba(20,30,35,0.12); border-color: ${teal} !important; }

      .mk-page a:focus-visible, .mk-page button:focus-visible { outline: 3px solid ${teal}; outline-offset: 3px; }

      /* Responsive */
      @media (max-width: 1100px) {
        .mk-h1 { font-size: 52px !important; }
        .mk-h2 { font-size: 40px !important; }
        .mk-4col { grid-template-columns: repeat(2,1fr) !important; }
        .mk-flow, .mk-steps-line { display: none !important; }
        .mk-strip-item { border-left: none !important; padding: 8px 18px !important; }
      }
      @media (max-width: 860px) {
        .mk-wrap { padding-left: 24px !important; padding-right: 24px !important; }
        .mk-2col { grid-template-columns: 1fr !important; gap: 36px !important; }
        .mk-3col { grid-template-columns: 1fr !important; }
        .mk-hero-visual { display: none; }
        .mk-h1 { font-size: 42px !important; }
        .mk-h2 { font-size: 34px !important; }
        .mk-bulk { justify-content: center !important; }
      }
      @media (max-width: 560px) {
        .mk-4col { grid-template-columns: 1fr !important; }
        .mk-2col-keep { grid-template-columns: 1fr !important; }
        .mk-h1 { font-size: 36px !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        .flow-dots, .float-mockup, .float-card-a, .float-card-b, .float-card-c, .crm-pulse { animation: none !important; }
        .hover-lift { transition: none; }
      }
    `}</style>
  );
}
