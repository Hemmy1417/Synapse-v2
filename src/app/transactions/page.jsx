"use client";

import { Navbar } from "@/components/nav/Navbar";
import { useWallet } from "@/hooks/useWallet";
import useStore from "@/store/useStore";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const sentimentColor = (s) =>
  s === "support" ? "#3DD68C" : s === "oppose" ? "#E85858" : "#7A94B8";
const sentimentLabel = (s) =>
  s === "support" ? "↑ Support" : s === "oppose" ? "↓ Oppose" : "→ Neutral";

export default function TransactionsPage() {
  const { txHistory, isConnected } = useWallet();

  // All human contributions across all threads from the store
  const contributions = useStore((s) => {
    const threads = s.threads || [];
    const contribs = s.contributions || {};
    const result = [];
    for (const thread of threads) {
      for (const c of (contribs[thread.id] || [])) {
        if (!c.agentId) result.push({ ...c, threadTitle: thread.title });
      }
    }
    return result.sort((a, b) => b.timestamp - a.timestamp);
  });

  const hasOnChainTx = txHistory && txHistory.length > 0;
  const hasContribs  = contributions.length > 0;

  return (
    <>
      <Navbar />
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Transaction History</h1>
          <p className="page-subtitle">
            Your on-chain transactions and contribution activity across all threads.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {/* ── On-chain transactions ── */}
          {isConnected && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
                On-chain Transactions
              </div>
              <div className="info-card" style={{ padding: 0, overflow: "hidden" }}>
                {!hasOnChainTx ? (
                  <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                    No on-chain transactions yet. Connect your wallet and start contributing to see activity here.
                  </div>
                ) : (
                  txHistory.map((tx, i) => (
                    <div key={tx.hash || i} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 20px",
                      borderBottom: i < txHistory.length - 1 ? "1px solid var(--border)" : "none",
                      flexWrap: "wrap",
                    }}>
                      {/* Status dot */}
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: tx.status === "confirmed" ? "#3DD68C" : tx.status === "failed" ? "#E85858" : "#C8943A",
                        boxShadow: tx.status === "pending" ? "0 0 6px #C8943A" : "none",
                      }} />

                      {/* Action */}
                      <span style={{ fontSize: 14, color: "var(--text-primary)", flex: 1, minWidth: 160 }}>
                        {tx.action}
                      </span>

                      {/* Hash */}
                      {tx.hash && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {tx.hash.slice(0, 12)}…
                        </span>
                      )}

                      {/* Timestamp */}
                      {tx.timestamp && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {timeAgo(tx.timestamp)}
                        </span>
                      )}

                      {/* Status badge */}
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                        background: tx.status === "confirmed" ? "rgba(61,214,140,0.1)" : tx.status === "failed" ? "rgba(232,88,88,0.1)" : "rgba(200,148,58,0.1)",
                        color: tx.status === "confirmed" ? "#3DD68C" : tx.status === "failed" ? "#E85858" : "#C8943A",
                      }}>
                        {tx.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Contribution activity ── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Contribution Activity
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {contributions.length} total
              </div>
            </div>

            <div className="info-card" style={{ padding: 0, overflow: "hidden" }}>
              {!hasContribs ? (
                <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                  No contributions yet. Go to a thread and submit your first argument.
                </div>
              ) : (
                contributions.map((c, i) => (
                  <div key={c.id} style={{
                    padding: "18px 20px",
                    borderBottom: i < contributions.length - 1 ? "1px solid var(--border)" : "none",
                    display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    {/* Thread title + time */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                      }}>
                        {c.threadTitle}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
                        {timeAgo(c.timestamp)}
                      </span>
                    </div>

                    {/* Claim */}
                    <div style={{
                      fontSize: 15, color: "var(--text-primary)",
                      lineHeight: 1.45, fontStyle: "italic",
                      fontFamily: "var(--font-display)",
                    }}>
                      "{c.claim}"
                    </div>

                    {/* Reasoning preview */}
                    {c.reasoning && (
                      <div style={{
                        fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {c.reasoning}
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        color: sentimentColor(c.sentiment),
                        background: sentimentColor(c.sentiment) + "15",
                        border: `1px solid ${sentimentColor(c.sentiment)}30`,
                      }}>
                        {sentimentLabel(c.sentiment)}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {c.confidence}% confidence
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        by {c.author}
                      </span>
                      <span style={{
                        marginLeft: "auto", fontSize: 12, fontWeight: 700,
                        color: "#3DD68C", fontFamily: "var(--font-mono)",
                      }}>
                        +10 pts
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}