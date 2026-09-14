"use client";
import { Plus, LayoutGrid } from "lucide-react";
import TemplateCardBuilder from "./TemplateCardBuilder";
import { MIN_CAROUSEL_CARDS, MAX_CAROUSEL_CARDS } from "../../lib/template-validator";
import { label, sectionCard } from "./shared-styles";

const BLANK_CARD = { header: { format: "IMAGE" }, body: { text: "", variables: [] }, buttons: [] };

// Carousel is MARKETING-only and optional — most templates won't use it, so
// it only renders when the category is Marketing, and starts collapsed
// (no cards) until the user explicitly adds one.
export default function TemplateCarouselBuilder({ category, carousel, onChange }) {
  if (category !== "MARKETING") return null;

  const cards = carousel?.cards || [];

  const addCard = () => {
    if (cards.length >= MAX_CAROUSEL_CARDS) return;
    onChange({ cards: [...cards, { ...BLANK_CARD }] });
  };
  const updateCard = (i, card) => onChange({ cards: cards.map((c, idx) => (idx === i ? card : c)) });
  const duplicateCard = (i) => {
    if (cards.length >= MAX_CAROUSEL_CARDS) return;
    const next = [...cards];
    next.splice(i + 1, 0, JSON.parse(JSON.stringify(cards[i])));
    onChange({ cards: next });
  };
  const deleteCard = (i) => onChange({ cards: cards.filter((_, idx) => idx !== i) });
  const moveCard = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= cards.length) return;
    const next = [...cards];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ cards: next });
  };

  return (
    <div style={sectionCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: cards.length ? 10 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <LayoutGrid size={13} color="var(--teal)" />
          <div style={{ ...label, marginBottom: 0 }}>Carousel Cards (optional)</div>
        </div>
        {cards.length > 0 && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{cards.length}/{MAX_CAROUSEL_CARDS}</span>}
      </div>

      {cards.length === 0 ? (
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 10 }}>
          Show up to {MAX_CAROUSEL_CARDS} scrollable product cards alongside the main body — each with its own image/video, text and buttons. Needs at least {MIN_CAROUSEL_CARDS} cards once you start.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
          {cards.map((card, i) => (
            <TemplateCardBuilder
              key={i}
              card={card}
              index={i}
              total={cards.length}
              onChange={(next) => updateCard(i, next)}
              onDuplicate={() => duplicateCard(i)}
              onDelete={() => deleteCard(i)}
              onMoveUp={() => moveCard(i, -1)}
              onMoveDown={() => moveCard(i, 1)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addCard}
        disabled={cards.length >= MAX_CAROUSEL_CARDS}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7,
          border: "1px dashed var(--border-strong)", background: "transparent",
          color: cards.length >= MAX_CAROUSEL_CARDS ? "var(--text-muted)" : "var(--teal)",
          fontSize: 12, fontWeight: 600, cursor: cards.length >= MAX_CAROUSEL_CARDS ? "not-allowed" : "pointer",
          fontFamily: "var(--font-main)",
        }}
      >
        <Plus size={13} /> Add Card
      </button>

      <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        Carousel support follows Meta's documented template structure but hasn't been used with this account before — double-check the result in your Meta Business dashboard after submitting.
      </div>
    </div>
  );
}
