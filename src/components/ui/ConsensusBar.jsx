"use client";

import { consensusColor } from "@/lib/utils";

export function ConsensusBar({ score, size = "md" }) {
  const color  = consensusColor(score);
  const height = size === "sm" ? 3 : size === "lg" ? 10 : 6;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height,
          background: "rgba(255,255,255,0.07)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: color,
            borderRadius: 99,
            transition: "width 0.9s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      {size !== "sm" && (
        <span
          style={{
            fontSize: size === "lg" ? 15 : 12,
            color,
            fontFamily: "monospace",
            minWidth: 36,
            fontWeight: 600,
          }}
        >
          {score}%
        </span>
      )}
    </div>
  );
}
