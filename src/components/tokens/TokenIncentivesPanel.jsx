"use client";

import useStore from "@/store/useStore";
import { useWallet } from "@/hooks/useWallet";
import { CONTRACT_ADDRESS, ZERO_ADDRESS } from "@/lib/web3";

const REWARDS = [
  { action: "Submit a contribution", reward: "+10 pts",  desc: "Post a structured argument with evidence",          color: "#3DD68C" },
  { action: "Contribution accepted", reward: "+25 pts",  desc: "Your reasoning is accepted by the community",       color: "#3DD68C" },
  { action: "Vote on right side",    reward: "+5 pts",   desc: "Vote FOR or AGAINST any contribution",              color: "#7C6FCD" },
  { action: "Consensus reached",     reward: "+15 pts",  desc: "All contributors earn when a thread resolves",      color: "#C8943A" },
  { action: "Thread finalized",      reward: "+75 pts",  desc: "Thread creator earns for closing the discussion",   color: "#E887C8" },
  { action: "Create a thread",       reward: "+50 pts",  desc: "Start a new decision thread",                       color: "#4D7EFF" },
];

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function TokenIncentivesPanel() {
  const { isConnected, pendingTx } = useWallet();
  const contractDeployed = CONTRACT_ADDRESS !== ZERO_ADDRESS;

  // Read points from the store (local, instant)
  const synapsePoints  = useStore((s) => s.synapsePoints || 0);
  const pointsHistory  = useStore((s) => s.pointsHistory || []);
  const totalEarned    = pointsHistory.reduce((sum, p) => sum + (p.pts || 0), 0);

  // All human contributions across all threads
  const allContributions = useStore((s) => {
    const threads = s.threads || [];
    const contribs = s.contributions || {};
    const result = [];
    for (const thread of threads) {
      const tc = contribs[thread.id] || [];
      for (const c of tc) {
        if (!c.agentId) result.push({ ...c, threadTitle: thread.title });
      }
    }
    return result.sort((a, b) => b.timestamp - a.timestamp).slice(0, 12);
  });

  const sentimentColor = (s) =>
    s === "support" ? "#3DD68C" : s === "oppose" ? "#E85858" : "#7A94B8";
  const sentimentLabel = (s) =>
    s === "support" ? "↑ Support" : s === "oppose" ? "↓ Oppose" : "→ Neutral";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Synapse Points balance card */}
      {isConnected && (
        <div style={{
          padding: "20px",
          background: "rgba(61,214,140,0.04)",
          border: "1px solid rgba(61,214,140,0.18)",
          borderRadius: 14,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Your Synapse Points
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#3DD68C", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                {synapsePoints}
                <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.6, marginLeft: 8 }}>PTS</span>
              </div>
              {totalEarned > 0 && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
                  {totalEarned} pts earned lifetime
                </div>
              )}
            </div>
            {pendingTx && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#C8943A" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#C8943A", animation: "pulse 1s infinite", display: "inline-block" }} />
                tx pending
              </div>
            )}
          </div>
          {!contractDeployed && (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
              Contract not yet deployed — points tracked locally until deployment.
            </div>
          )}
        </div>
      )}

      {/* Contribution activity feed */}
      <div style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Contribution Activity
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {allContributions.length} contribution{allContributions.length !== 1 ? "s" : ""}
          </div>
        </div>

        {allContributions.length === 0 ? (
          <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No contributions yet. Start a thread and submit your first argument.
          </div>
        ) : (
          allContributions.map((c, i) => (
            <div key={c.id} style={{
              padding: "14px 18px",
              borderBottom: i < allContributions.length - 1 ? "1px solid var(--border)" : "none",
              display: "flex", flexDirection: "column", gap: 6,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.threadTitle}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                  {timeAgo(c.timestamp)}
                </span>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.4, fontStyle: "italic" }}>
                "{c.claim}"
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
                  color: sentimentColor(c.sentiment),
                  background: sentimentColor(c.sentiment) + "15",
                  border: `1px solid ${sentimentColor(c.sentiment)}30`,
                }}>
                  {sentimentLabel(c.sentiment)}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {c.confidence}% confidence
                </span>
                <span style={{ fontSize: 11, color: "#3DD68C", fontFamily: "var(--font-mono)", fontWeight: 700, marginLeft: "auto" }}>
                  +10 pts
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* How to earn */}
      <div style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            How to earn Synapse Points
          </div>
        </div>
        {REWARDS.map((r, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "13px 18px",
            borderBottom: i < REWARDS.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>{r.action}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{r.desc}</div>
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: r.color,
              fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
              padding: "4px 10px", background: r.color + "12",
              borderRadius: 8, border: `1px solid ${r.color}25`,
            }}>
              {r.reward}
            </div>
          </div>
        ))}
        <div style={{ padding: "14px 18px", background: "rgba(77,126,255,0.04)", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#4D7EFF", marginBottom: 5 }}>◈ On-chain AI Scoring</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            When you submit a contribution, GenLayer's validator network scores your reasoning. A score ≥ 80/100 earns you the quality bonus — fully decentralised.
          </div>
        </div>
      </div>

    </div>
  );
}