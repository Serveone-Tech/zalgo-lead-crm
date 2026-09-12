"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZES = [25, 50, 75, 100];

// Reusable pager for any client-side-filtered table/list — a rows-per-page
// selector (25/50/75/100) plus prev/next and a "showing X-Y of Z" readout.
// Purely presentational: the caller owns `page`/`pageSize` state and does
// its own `.slice(...)` on the already-filtered array; this just renders
// the controls and clamps page back into range if the size/data changes.
export default function Pagination({ page, setPage, pageSize, setPageSize, total }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) {
    // Data shrank (filter applied, item deleted) and the current page no
    // longer exists — snap back onto the new last page instead of showing
    // an empty table with working-looking prev/next buttons.
    setTimeout(() => setPage(safePage), 0);
  }

  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        padding: "14px 4px",
        fontSize: 12.5,
        color: "var(--text-muted)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          style={{
            padding: "5px 8px",
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--text-primary)",
            fontSize: 12.5,
            outline: "none",
            cursor: "pointer",
          }}
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span>
          {total === 0 ? "No results" : `${from}–${to} of ${total}`}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setPage(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            style={pagerBtnStyle(safePage <= 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <span style={{ padding: "5px 10px", fontWeight: 600, color: "var(--text-secondary)" }}>
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            style={pagerBtnStyle(safePage >= totalPages)}
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function pagerBtnStyle(disabled) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--bg-input)",
    color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}

export { PAGE_SIZES };
