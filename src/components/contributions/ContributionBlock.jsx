"use client";

import { useState } from "react";
import { AGENTS, SENTIMENTS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { VoteModal } from "./VoteModal";

export function ContributionBlock({ contribution, threadId, isNew }) {
  const [expanded, setExpanded] = useState(true);
  const [showVote, setShowVote] = useState(false);
  const [voted,    setVoted]    = useState(false);

  const isAgent   = !!contribution.agentId;
  const agent     = isAgent ? AGENTS[contribution.agentId] : null;
  const sentiment = SENTIMENTS[contribution.sentiment] || SENTIMENTS.neutral;

  const borderTop = contribution.sentiment === "support" ? "#3DD68C"
                  : contribution.sentiment === "oppose"  ? "#E85858"
                  : "rgba(255,255,255,0.07)";

  return (
    <>
      <div style={{
        marginBottom: 14, borderRadius: 14, overflow: "hidden",
        background: isAgent ? agent.bgColor : "rgba(255,255,255,0.025)",
        border: `1px solid ${isAgent ? agent.borderColor : "var(--border)"}`,
        boxShadow: isAgent ? `0 0 24px ${agent.glowColor}` : "none",
        animation: isNew ? "slideUp 0.35s cubic-bezier(0.4,0,0.2,1)" : "none",
      }}>
        {/* Sentiment top stripe */}
        <div style={{ height: 3, background: borderTop, opacity: 0.7 }} />

        <div className="contrib-block">
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: expanded ? 16 : 0, flexWrap: "wrap" }}>
            {/* Author */}
            {isAgent ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 12px", background: agent.bgColor, border: `1px solid ${agent.borderColor}`, borderRadius: 22 }}>
                <span style={{ color: agent.color, fontSize: 14 }}>{agent.symbol}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: agent.color }}>{agent.name}</span>
              </div>
            ) : (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 22 }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  ◌ {contribution.author?.startsWith("0x")
                    ? contribution.author.slice(0,6) + "…" + contribution.author.slice(-4)
                    : contribution.author || "You"}
                </span>
              </div>
            )}

            {/* Sentiment */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", background: sentiment.color + "12", border: `1px solid ${sentiment.color}30`, borderRadius: 22, fontSize: 13, color: sentiment.color }}>
              {sentiment.symbol} {sentiment.label}
            </div>

            {/* Stake */}
            {!isAgent && contribution.stakeGEN > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", background: "rgba(61,214,140,0.08)", border: "1px solid rgba(61,214,140,0.2)", borderRadius: 22, fontSize: 13, color: "#3DD68C", fontFamily: "var(--font-mono)" }}>
                🔒 {contribution.stakeGEN} GEN
              </div>
            )}

            <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
              {timeAgo(contribution.timestamp)}
            </span>
            <button onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, padding: 0 }}>
              {expanded ? "▲" : "▼"}
            </button>
          </div>

          {/* Body */}
          {expanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div className="field-label">Claim</div>
                <div className="contrib-claim">{contribution.claim}</div>
              </div>
              <div>
                <div className="field-label">Reasoning</div>
                <div className="contrib-reasoning">{contribution.reasoning}</div>
              </div>
              {contribution.evidence && (
                <div>
                  <div className="field-label">Evidence</div>
                  <div className="contrib-evidence" style={{ paddingLeft: 12, borderLeft: "2px solid rgba(77,126,255,0.25)" }}>
                    {contribution.evidence}
                  </div>
                </div>
              )}

              {/* Confidence */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 99 }}>
                  <div style={{ width: `${contribution.confidence}%`, height: "100%", background: isAgent ? agent.color : "#4D7EFF", borderRadius: 99, opacity: 0.6 }} />
                </div>
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-mono)", minWidth: 90, textAlign: "right" }}>
                  {contribution.confidence}% confidence
                </span>
              </div>

              {/* Vote button */}
              {!isAgent && !voted && (
                <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button onClick={() => setShowVote(true)} style={{
                    padding: "9px 18px", borderRadius: 9, fontSize: 14, fontFamily: "var(--font-body)",
                    fontWeight: 500, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                    color: "var(--text-muted)", transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 7,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(77,126,255,0.4)"; e.currentTarget.style.color = "#4D7EFF"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                  >
                    ⚖ Vote + Stake GEN
                  </button>
                </div>
              )}
              {!isAgent && voted && (
                <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 14, color: "#3DD68C", display: "flex", alignItems: "center", gap: 5 }}>
                  ✓ Voted
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showVote && (
        <VoteModal contribution={contribution} threadId={threadId} onClose={() => setShowVote(false)} onVoted={() => { setVoted(true); setShowVote(false); }} />
      )}
    </>
  );
}
