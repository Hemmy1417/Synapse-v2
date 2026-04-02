"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/nav/Navbar";
import { TokenIncentivesPanel } from "@/components/tokens/TokenIncentivesPanel";
import { useWallet } from "@/hooks/useWallet";
import { formatSynapse, formatGEN, isWalletAvailable } from "@/lib/web3";

export default function WalletPage() {
  const {
    address, isConnected, walletName, isOnCorrectChain,
    synapseBalance, totalEarned,
    connect, disconnect, addGenLayerChain,
  } = useWallet();

  const [genBalance, setGenBalance] = useState(null);
  const [loadingGen, setLoadingGen] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || !isWalletAvailable()) return;
    setLoadingGen(true);
    window.ethereum.request({ method: "eth_getBalance", params: [address, "latest"] })
      .then((hex) => setGenBalance(BigInt(hex)))
      .catch(() => setGenBalance(null))
      .finally(() => setLoadingGen(false));
  }, [isConnected, address]);

  return (
    <>
      <Navbar />
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Your GEN balance, Synapse Points, and contribution activity on GenLayer Bradbury.
          </p>
        </div>

        {!isConnected ? (
          <div className="connect-card">
            <div style={{ fontSize: 52, marginBottom: 20, opacity: 0.12 }}>⬡</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 12, color: "var(--text-primary)" }}>
              Connect your wallet
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.65, maxWidth: 380, margin: "0 auto 28px" }}>
              Connect to view your GEN balance, Synapse Points, and contribution activity.
            </p>
            <button className="btn-primary btn-lg" onClick={connect}>Connect Wallet</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Wallet address */}
            <div className="info-card" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="info-card-label">Connected Wallet</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text-primary)", wordBreak: "break-all", marginBottom: 8 }}>
                  {address}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "4px 12px", background: "rgba(61,214,140,0.1)", border: "1px solid rgba(61,214,140,0.25)", borderRadius: 20, fontSize: 13, color: "#3DD68C" }}>
                    {walletName}
                  </span>
                  {isOnCorrectChain ? (
                    <span style={{ padding: "4px 12px", background: "rgba(77,126,255,0.1)", border: "1px solid rgba(77,126,255,0.25)", borderRadius: 20, fontSize: 13, color: "#4D7EFF" }}>
                      ● GenLayer Bradbury
                    </span>
                  ) : (
                    <button className="btn-warning" onClick={addGenLayerChain}>
                      ⚠ Switch to GenLayer Bradbury
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={disconnect}
                style={{ padding: "10px 20px", background: "transparent", border: "1px solid rgba(232,88,88,0.2)", borderRadius: 10, color: "rgba(232,88,88,0.6)", fontSize: 14, fontFamily: "var(--font-body)", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#E85858"; e.currentTarget.style.borderColor = "rgba(232,88,88,0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(232,88,88,0.6)"; e.currentTarget.style.borderColor = "rgba(232,88,88,0.2)"; }}
              >
                Disconnect
              </button>
            </div>

            {/* Two balance cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>

              {/* GEN balance */}
              <div className="info-card" style={{ background: "rgba(77,126,255,0.04)", borderColor: "rgba(77,126,255,0.18)" }}>
                <div className="info-card-label" style={{ color: "#4D7EFF" }}>GEN Balance</div>
                <div className="big-number" style={{ color: "#4D7EFF", marginBottom: 6 }}>
                  {loadingGen ? "…" : genBalance !== null ? formatGEN(genBalance) : "—"}
                  <span style={{ fontSize: 18, fontWeight: 500, opacity: 0.6, marginLeft: 10 }}>GEN</span>
                </div>
                <div className="info-card-sub" style={{ marginBottom: 16 }}>
                  Native wallet balance on GenLayer Bradbury
                </div>
                <a
                  href="https://faucet.genlayer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 16px",
                    background: "rgba(77,126,255,0.1)",
                    border: "1px solid rgba(77,126,255,0.25)",
                    borderRadius: 8, color: "#4D7EFF",
                    fontSize: 13, fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Get testnet GEN ↗
                </a>
              </div>

              {/* Synapse Points */}
              <div className="info-card" style={{ background: "rgba(61,214,140,0.04)", borderColor: "rgba(61,214,140,0.18)" }}>
                <div className="info-card-label" style={{ color: "#3DD68C" }}>Synapse Points</div>
                <div className="big-number" style={{ color: "#3DD68C", marginBottom: 6 }}>
                  {formatSynapse(synapseBalance)}
                  <span style={{ fontSize: 18, fontWeight: 500, opacity: 0.6, marginLeft: 10 }}>PTS</span>
                </div>
                <div className="info-card-sub" style={{ marginBottom: 16 }}>
                  Earned from contributing and voting
                </div>

                {totalEarned > 0 && (
                  <div style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(61,214,140,0.07)", border: "1px solid rgba(61,214,140,0.15)", borderRadius: 8, fontSize: 13, color: "#3DD68C" }}>
                    {formatSynapse(totalEarned)} pts earned lifetime
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    { action: "Submit a contribution", pts: "+10 pts" },
                    { action: "Contribution accepted",  pts: "+25 pts" },
                    { action: "Vote on right side",     pts: "+5 pts"  },
                    { action: "Consensus reached",      pts: "+15 pts" },
                    { action: "Thread finalized",       pts: "+75 pts" },
                  ].map(({ action, pts }, i, arr) => (
                    <div key={action} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{action}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#3DD68C", fontFamily: "var(--font-mono)" }}>{pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Points activity panel */}
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text-primary)", marginBottom: 4 }}>
                Synapse Points Activity
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>
                Points are earned automatically as you contribute and vote. No claiming needed.
              </p>
              <TokenIncentivesPanel />
            </div>



          </div>
        )}
      </div>
    </>
  );
}