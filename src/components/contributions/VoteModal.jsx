"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { MIN_VOTE_STAKE } from "@/lib/web3";

export function VoteModal({ contribution, threadId, onClose, onVoted }) {
  const [support, setSupport] = useState(null);  // true | false
  const [stake,   setStake]   = useState(MIN_VOTE_STAKE);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const { isConnected, voteWithStake } = useWallet();

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handleVote = async () => {
    if (support === null) { setError("Choose FOR or AGAINST."); return; }
    if (!isConnected) { setError("Connect your wallet to vote."); return; }
    setLoading(true); setError("");
    const result = await voteWithStake(threadId, contribution.id, support, stake);
    setLoading(false);
    if (result.ok) { onVoted?.(); onClose(); }
    else setError(result.error || "Vote failed.");
  };

  const claimText = support === true
    ? `If this contribution is accepted, you earn 1.2× your stake back (${(stake * 1.2).toFixed(1)} GEN).`
    : `If this contribution is rejected, you earn 1.2× your stake back (${(stake * 1.2).toFixed(1)} GEN).`;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(4,6,12,0.80)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div style={{
        background: "var(--bg-panel)",
        border: "1px solid rgba(77,126,255,0.2)",
        borderRadius: 16, padding: 26, width: 460, maxWidth: "100%",
        animation: "slideUp 0.28s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 17, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: 3 }}>
              Vote on Contribution
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Stake GEN to signal confidence. Wrong votes lose their stake.</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Claim preview */}
        <div style={{
          padding: "10px 12px", marginBottom: 18,
          background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
          borderRadius: 9,
        }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Contribution Claim</div>
          <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
            {contribution.claim}
          </div>
        </div>

        {/* FOR / AGAINST */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { val: true,  label: "Vote FOR",     icon: "↑", color: "#3DD68C" },
            { val: false, label: "Vote AGAINST",  icon: "↓", color: "#E85858" },
          ].map(({ val, label, icon, color }) => (
            <button key={String(val)} onClick={() => setSupport(val)} style={{
              padding: "14px 0", borderRadius: 10, fontFamily: "var(--font-body)",
              fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.15s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              background: support === val ? color + "18" : "rgba(255,255,255,0.03)",
              border:     `2px solid ${support === val ? color : "var(--border)"}`,
              color:      support === val ? color : "var(--text-muted)",
              boxShadow:  support === val ? `0 0 16px ${color}22` : "none",
            }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Stake slider */}
        <div style={{
          padding: "11px 13px", marginBottom: 16,
          background: "rgba(61,214,140,0.05)",
          border: "1px solid rgba(61,214,140,0.18)",
          borderRadius: 9,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <span style={{ fontSize: 9, color: "#3DD68C", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>GEN Stake</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#3DD68C", fontFamily: "var(--font-mono)" }}>{stake}</span>
              <span style={{ fontSize: 11, color: "rgba(61,214,140,0.5)" }}>GEN</span>
            </div>
          </div>
          <input type="range" min={MIN_VOTE_STAKE} max={50} step={5} value={stake}
            onChange={(e) => setStake(+e.target.value)}
            style={{ width: "100%", accentColor: "#3DD68C" }}
          />
          {support !== null && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
              {claimText} If wrong → you lose your {stake} GEN stake.
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 12, color: "#E85858", marginBottom: 12, padding: "7px 10px", background: "rgba(232,88,88,0.08)", borderRadius: 7, border: "1px solid rgba(232,88,88,0.2)" }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleVote} disabled={loading || support === null} style={{
            flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
            background: support === true ? "#3DD68C" : support === false ? "#E85858" : "rgba(77,126,255,0.3)",
            color: "#fff", fontSize: 13, fontWeight: 600,
            fontFamily: "var(--font-body)", opacity: (loading || support === null) ? 0.5 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {loading ? (
              <><span style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Staking…</>
            ) : (
              `Confirm Vote + Stake ${stake} GEN`
            )}
          </button>
          <button onClick={onClose} style={{
            padding: "10px 16px", background: "transparent",
            border: "1px solid var(--border)", borderRadius: 8,
            color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-body)",
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
