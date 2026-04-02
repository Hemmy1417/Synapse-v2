"use client";

import { CATEGORIES } from "@/lib/constants";

export function CategoryBadge({ category, size = "sm" }) {
  const cat      = CATEGORIES[category] || { label: category, color: "#888" };
  const fontSize = size === "sm" ? 10 : 11;

  return (
    <span
      style={{
        padding:      "1px 7px",
        background:   cat.color + "22",
        color:        cat.color,
        fontSize,
        borderRadius: 10,
        border:       `1px solid ${cat.color}44`,
        whiteSpace:   "nowrap",
        fontWeight:   500,
      }}
    >
      {cat.label}
    </span>
  );
}
