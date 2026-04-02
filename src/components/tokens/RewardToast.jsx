"use client";

import { useWallet } from "@/hooks/useWallet";

export function RewardToast() {
  const { pendingRewards } = useWallet();
  if (!pendingRewards.length) return null;

  return (
    <div style={{
      position: "fixed", bottom: 28, right: 24, zIndex: 500,
      display: "flex", flexDirection: "column", gap: 8,
      pointerEvents: "none",
    }}>
      {pendingRewards.map((r) => {
        const isGEN   = r.type === "gen";
        const color   = isGEN ? "#3DD68C" : "#4D7EFF";
        const symbol  = isGEN ? "GEN" : "SYNAPSE";
        const icon    = isGEN ? "🔒" : "◈";
        return (
          <div key={r.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 16px",
            background: "rgba(10,14,24,0.96)",
            border: `1px solid ${color}55`,
            borderRadius: 22,
            boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${color}18`,
            animation: "rewardPop 0.45s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>
              {isGEN ? "" : "+"}{r.amount}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color }}>{symbol}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.reason}</span>
          </div>
        );
      })}
    </div>
  );
}
