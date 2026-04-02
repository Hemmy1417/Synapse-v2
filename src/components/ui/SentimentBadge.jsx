"use client";

import { SENTIMENTS } from "@/lib/constants";

export function SentimentBadge({ sentiment }) {
  const s = SENTIMENTS[sentiment] || SENTIMENTS.neutral;

  return (
    <span
      style={{
        fontSize: 11,
        padding: "1px 8px",
        borderRadius: 20,
        background: s.color + "18",
        color: s.color,
        border: `1px solid ${s.color}33`,
        fontWeight: 500,
      }}
    >
      {s.symbol} {s.label}
    </span>
  );
}
