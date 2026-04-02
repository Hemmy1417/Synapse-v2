"use client";

import { AGENTS } from "@/lib/constants";

export function AgentBadge({ agentId, size = "sm", showPulse = false }) {
  const agent = AGENTS[agentId];
  if (!agent) return null;

  const fontSize  = size === "sm" ? 11 : 12;
  const padding   = size === "sm" ? "2px 8px" : "3px 10px";

  return (
    <span
      style={{
        display:     "inline-flex",
        alignItems:  "center",
        gap:         5,
        padding,
        background:  agent.bgColor,
        border:      `1px solid ${agent.borderColor}`,
        borderRadius: 20,
        fontSize,
        color:       agent.color,
        fontWeight:  600,
        position:    "relative",
      }}
    >
      {agent.symbol} {agent.name}
      {showPulse && (
        <span
          style={{
            width:        6,
            height:       6,
            borderRadius: "50%",
            background:   agent.color,
            animation:    "pulse 1.2s ease-in-out infinite",
          }}
        />
      )}
    </span>
  );
}

export function HumanBadge({ author, size = "sm" }) {
  const fontSize = size === "sm" ? 11 : 12;
  const padding  = size === "sm" ? "2px 8px" : "3px 10px";

  return (
    <span
      style={{
        display:     "inline-flex",
        alignItems:  "center",
        gap:         5,
        padding,
        background:  "rgba(255,255,255,0.05)",
        border:      "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20,
        fontSize,
        color:       "#bbb",
        fontWeight:  500,
      }}
    >
      ◌ {author || "You"}
    </span>
  );
}
