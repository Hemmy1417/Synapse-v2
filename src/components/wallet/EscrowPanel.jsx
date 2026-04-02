"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { formatGEN, MIN_SUBMIT_STAKE, MIN_VOTE_STAKE } from "@/lib/web3";

export function EscrowPanel() {
  const {
    isConnected, escrowLocked, escrowPending,
    pendingTx, claimRewards,
  } = useWallet();

  const [claiming,    setClaiming]    = useState(false);
  const [claimError,  setClaimError]  = useState("");
  const [claimSuccess,setClaimSuccess]= useState(false);

  const locked     = BigInt(escrowLocked  || "0");
  const pending    = BigInt(escrowPending || "0");
  const hasPending = pending > 0n;
  const hasLocked  = locked  > 0n;

  const handleClaim = async () => {
    if (!hasPending) return;
    setClaiming(true); setClaimError(""); setClaimSuccess(false);
    const result = await claimRewards();
    setClaiming(false);
    if (result.ok) {
      setClaimSuccess(true);
      setTimeout(() => setClaimSuccess(false), 4000);
    } else {
      setClaimError(result.error || "Claim failed");
      setTimeout(() => setClaimError(""), 5000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Explainer */}
      <div style={{
        padding: "18px 20px",
        background: "rgba(200,148,58,0.04)",
        border: "1px solid rgba(200,148,58,0.15)",
        borderRadius: 14,
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#C8943A", marginBottom: 8 }}>
          🔒 GEN Escrow
        </div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65 }}>
          When you submit or vote, your GEN is held in escrow by the smart contract.
          Once the thread is finalized, correct predictions are rewarded and incorrect ones are redistributed.
          No funds leave the contract until you claim.
        </div>
      </div>

      {/* Balance cards */}
      {isConnected ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {/* Locked */}
            <div style={{
              padding: "16px",
              background: hasLocked ? "rgba(200,148,58,0.07)" : "rgba(255,255,255,0.025)",
              border: `1px solid ${hasLocked ? "rgba(200,148,58,0.25)" : "var(--border)"}`,
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: hasLocked ? "#C8943A" : "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                {formatGEN(locked)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: hasLocked ? "#C8943A" : "var(--text-muted)", marginTop: 4 }}>
                GEN Locked
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4 }}>
                Active stakes — awaiting resolution
              </div>
            </div>

            {/* Claimable */}
            <div style={{
              padding: "16px",
              background: hasPending ? "rgba(61,214,140,0.08)" : "rgba(255,255,255,0.025)",
              border: `1px solid ${hasPending ? "rgba(61,214,140,0.3)" : "var(--border)"}`,
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: hasPending ? "#3DD68C" : "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                {formatGEN(pending)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: hasPending ? "#3DD68C" : "var(--text-muted)", marginTop: 4 }}>
                GEN Claimable
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4 }}>
                Resolved rewards — ready to withdraw
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {(hasLocked || hasPending) && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden", display: "flex" }}>
                {hasLocked && (
                  <div style={{ width: `${Number(locked * 100n / (locked + pending + 1n))}%`, background: "#C8943A", transition: "width 0.8s ease" }} />
                )}
                {hasPending && (
                  <div style={{ width: `${Number(pending * 100n / (locked + pending + 1n))}%`, background: "#3DD68C", transition: "width 0.8s ease" }} />
                )}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 7 }}>
                <span style={{ fontSize: 12, color: "#C8943A", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#C8943A", display: "inline-block" }} />
                  Locked
                </span>
                <span style={{ fontSize: 12, color: "#3DD68C", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#3DD68C", display: "inline-block" }} />
                  Claimable
                </span>
              </div>
            </div>
          )}

          {/* Claim button */}
          <button
            onClick={handleClaim}
            disabled={!hasPending || claiming}
            style={{
              width: "100%", padding: "13px 0",
              fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
              borderRadius: 10, transition: "all 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: hasPending ? "rgba(61,214,140,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${hasPending ? "rgba(61,214,140,0.35)" : "var(--border)"}`,
              color: hasPending ? "#3DD68C" : "var(--text-muted)",
              opacity: (!hasPending || claiming) ? 0.55 : 1,
              cursor: hasPending ? "pointer" : "default",
            }}
          >
            {claiming ? (
              <>
                <span style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Claiming…
              </>
            ) : claimSuccess ? (
              "✓ Claimed successfully!"
            ) : (
              `↑ Claim ${hasPending ? formatGEN(pending) + " GEN" : "Rewards"}`
            )}
          </button>

          {claimError && (
            <div style={{ fontSize: 13, color: "var(--red)", marginTop: 8, padding: "8px 12px", background: "rgba(232,88,88,0.07)", borderRadius: 8, border: "1px solid rgba(232,88,88,0.2)" }}>
              {claimError}
            </div>
          )}
        </>
      ) : (
        <div style={{
          padding: "20px", textAlign: "center",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--border)", borderRadius: 12,
          fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6,
        }}>
          Connect your wallet to see your GEN escrow balance and claim resolved rewards.
        </div>
      )}

      {/* How it works */}
      <div style={{
        marginTop: 12, padding: "16px 18px",
        background: "var(--bg-raised)",
        border: "1px solid var(--border)", borderRadius: 12,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Escrow Rules
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "📥", label: "Submit a contribution", detail: `Min ${MIN_SUBMIT_STAKE} GEN locked until thread resolves` },
            { icon: "⚖",  label: "Vote FOR or AGAINST",  detail: `Min ${MIN_VOTE_STAKE} GEN locked per vote` },
            { icon: "✅",  label: "Contribution accepted", detail: "Submitter gets 1.5× stake back; correct voters get 1.2×" },
            { icon: "❌",  label: "Contribution rejected", detail: "Submitter loses stake — shared among correct voters" },
            { icon: "↔",  label: "Borderline (score 40–60)", detail: "Everyone gets their original stake back" },
          ].map(({ icon, label, detail }) => (
            <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
