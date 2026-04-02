"use client";

import { THREAD_STATUS } from "@/lib/constants";

const STATUS_STYLES = {
  [THREAD_STATUS.OPEN]: {
    color: "#888",
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.1)",
  },
  [THREAD_STATUS.IN_DISCUSSION]: {
    color: "#FFB347",
    bg: "rgba(255,179,71,0.1)",
    border: "rgba(255,179,71,0.3)",
  },
  [THREAD_STATUS.CONSENSUS_REACHED]: {
    color: "#52D68A",
    bg: "rgba(82,214,138,0.1)",
    border: "rgba(82,214,138,0.3)",
  },
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES[THREAD_STATUS.OPEN];

  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 9px",
        borderRadius: 20,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
