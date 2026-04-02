"use client";

import Link from "next/link";
import { Navbar } from "@/components/nav/Navbar";
import { AGENTS } from "@/lib/constants";
import useStore from "@/store/useStore";
import { shortAddress } from "@/lib/web3";

function getMedal(rank) {
  if (rank === 1) return { emoji: "🥇", color: "#FFD700" };
  if (rank === 2) return { emoji: "🥈", color: "#C0C0C0" };
  if (rank === 3) return { emoji: "🥉", color: "#CD7F32" };
  return { emoji: `#${rank}`, color: "var(--text-muted)" };
}

export default function LeaderboardPage() {
  const contributions = useStore((s) => s.contributions);
  const threads       = useStore((s) => s.threads);

  // Build leaderboard from local contributions
  const leaderboard = (() => {
    const map = {};
    Object.values(contributions).flat().forEach((c) => {
      if (c.agentId) return;
      const key = c.author || "Anonymous";
      if (!map[key]) map[key] = { address: key, score: 0, count: 0, accepted: 0 };
      map[key].score  += c.confidence || 0;
      map[key].count  += 1;
      if (c.sentiment === "support") map[key].accepted += 1;
    });
    return Object.values(map)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  })();

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-subtitle">Top contributors ranked by cumulative confidence score</p>
        </div>

        {/* Agent cards */}
        <div className="section-title">AI Agents</div>
        <div className="agent-grid">
          {Object.values(AGENTS).map((agent) => {
            const agentContribs = Object.values(contributions).flat().filter((c) => c.agentId === agent.id);
            return (
              <div key={agent.id} className="agent-card" style={{ borderColor: agent.borderColor, background: agent.bgColor }}>
                <div style={{ fontSize: 28, color: agent.color, marginBottom: 8 }}>{agent.symbol}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: agent.color, marginBottom: 4 }}>{agent.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>{agent.description}</div>
                <div style={{ display: "flex", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: agent.color, fontFamily: "var(--font-mono)" }}>{agentContribs.length}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>contributions</div>
                  </div>
                  {agentContribs.length > 0 && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: agent.color, fontFamily: "var(--font-mono)" }}>
                        {Math.round(agentContribs.reduce((s, c) => s + c.confidence, 0) / agentContribs.length)}%
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>avg confidence</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Human leaderboard */}
        <div className="section-title" style={{ marginTop: 48 }}>Human Contributors</div>
        {leaderboard.length === 0 ? (
          <div className="empty-state">
            <p>No human contributions yet. <Link href="/" className="back-link">Start a discussion</Link></p>
          </div>
        ) : (
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <span style={{ width: 50 }}>Rank</span>
              <span style={{ flex: 1 }}>Address</span>
              <span style={{ width: 100, textAlign: "right" }}>Contributions</span>
              <span style={{ width: 100, textAlign: "right" }}>Score</span>
            </div>
            {leaderboard.map((entry) => {
              const medal = getMedal(entry.rank);
              return (
                <div key={entry.address} className="leaderboard-row">
                  <span style={{ width: 50, fontSize: 18, color: medal.color, fontWeight: 700 }}>{medal.emoji}</span>
                  <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--text-primary)", wordBreak: "break-all" }}>
                    {entry.address.startsWith("0x") ? shortAddress(entry.address) : entry.address}
                  </span>
                  <span style={{ width: 100, textAlign: "right", fontSize: 16, color: "var(--text-secondary)" }}>{entry.count}</span>
                  <span style={{ width: 100, textAlign: "right", fontSize: 16, fontWeight: 700, color: "#4D7EFF", fontFamily: "var(--font-mono)" }}>{entry.score}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
