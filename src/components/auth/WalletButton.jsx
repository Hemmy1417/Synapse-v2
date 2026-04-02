"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import {
  shortAddress,
  formatSynapse,
  formatGEN,
  GENLAYER_CHAIN,
  GENLAYER_CHAIN_ID,
  GENLAYER_CHAIN_PARAMS,
} from "@/lib/web3";

export function WalletButton() {
  const [open,    setOpen]    = useState(false);
  const [status,  setStatus]  = useState("");
  const [adding,  setAdding]  = useState(false);
  const dropRef = useRef(null);

  const {
    address, isConnected, walletName, isOnCorrectChain,
    synapseBalance, totalEarned, escrowLocked, escrowPending,
    pendingTx, txHistory,
    connect, disconnect,
  } = useWallet();

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Add / switch chain — called directly from window.ethereum ──
  // We bypass the hook here so the call is always fresh (no stale closure)
  const handleAddChain = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setStatus("No wallet detected");
      return;
    }
    setAdding(true);
    setStatus("Check your wallet…");
    try {
      // Try adding the chain — MetaMask also switches automatically after add
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [GENLAYER_CHAIN_PARAMS],
      });
      setStatus("");
    } catch (err) {
      if (err.code === 4001) {
        // User rejected
        setStatus("Rejected — please approve in MetaMask");
      } else {
        // Chain already added — just switch
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: GENLAYER_CHAIN_PARAMS.chainId }],
          });
          setStatus("");
        } catch (switchErr) {
          setStatus(switchErr.message?.slice(0, 60) || "Switch failed");
        }
      }
    } finally {
      setAdding(false);
      setTimeout(() => setStatus(""), 5000);
    }
  };

  const handleConnect = async () => {
    setStatus("Connecting…");
    try {
      await connect();
      setStatus("");
    } catch (err) {
      setStatus(err.message?.slice(0, 50) || "Failed");
      setTimeout(() => setStatus(""), 4000);
    }
  };

  // ── Not connected ──────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <button
          onClick={handleConnect}
          style={{
            padding: "7px 14px",
            background: "rgba(77,126,255,0.10)",
            border: "1px solid rgba(77,126,255,0.3)",
            borderRadius: 8, color: "#4D7EFF",
            fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
            display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 14 }}>⬡</span>
          <span className="hidden-xs">Connect Wallet</span>
          <span className="show-xs">Connect</span>
        </button>
        {status && <div style={{ fontSize: 10, color: "#E85858" }}>{status}</div>}
      </div>
    );
  }

  // ── Wrong / unrecognised chain ─────────────────────────────
  if (!isOnCorrectChain) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
        <button
          onClick={handleAddChain}
          disabled={adding}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 14px",
            background: adding ? "rgba(200,148,58,0.06)" : "rgba(200,148,58,0.12)",
            border: "1px solid rgba(200,148,58,0.35)",
            borderRadius: 8, color: "#C8943A",
            fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
            cursor: adding ? "wait" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {adding ? (
            <span style={{
              width: 12, height: 12, border: "1.5px solid #C8943A",
              borderTopColor: "transparent", borderRadius: "50%",
              display: "inline-block", animation: "spin 0.8s linear infinite",
            }} />
          ) : "⚠"}
          {adding ? "Check MetaMask…" : "Add GenLayer Bradbury"}
        </button>
        <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "right" }}>
          {status || `Chain ID ${GENLAYER_CHAIN_ID} · RPC: zksync-os-testnet`}
        </div>
      </div>
    );
  }

  // ── Connected + correct chain ──────────────────────────────
  const locked  = BigInt(escrowLocked  || "0");
  const pending = BigInt(escrowPending || "0");
  const hasPending = pending > 0n;

  return (
    <div style={{ position: "relative" }} ref={dropRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "5px 10px 5px 8px",
          background: open ? "rgba(77,126,255,0.10)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(77,126,255,0.3)" : "var(--border)"}`,
          borderRadius: 10, fontFamily: "var(--font-body)", cursor: "pointer", transition: "all 0.15s",
        }}
      >
        {/* SYNAPSE badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5, padding: "2px 8px",
          background: "rgba(61,214,140,0.10)", border: "1px solid rgba(61,214,140,0.22)", borderRadius: 20,
        }}>
          <span style={{ fontSize: 11, color: "#3DD68C" }}>◈</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#3DD68C", fontFamily: "var(--font-mono)" }}>
            {formatSynapse(synapseBalance)}
          </span>
        </div>

        {/* Address — hidden on very small screens */}
        <span className="hidden-xs" style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
          {shortAddress(address)}
        </span>

        {pendingTx && (
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#C8943A", animation: "pulse 1s infinite" }} />
        )}
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "fixed",
          right: 12,
          top: 56,
          width: "min(280px, calc(100vw - 24px))",
          background: "var(--bg-panel)",
          border: "1px solid rgba(77,126,255,0.18)",
          borderRadius: 14, overflow: "hidden", zIndex: 400,
          animation: "slideUp 0.2s ease",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        }}>
          {/* Header */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>
              {walletName} · GenLayer Bradbury #{GENLAYER_CHAIN_ID}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
              {shortAddress(address)}
            </div>
          </div>

          {/* SYNAPSE balance */}
          <div style={{ padding: "13px 14px", borderBottom: "1px solid var(--border)", background: "rgba(61,214,140,0.04)" }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 5 }}>SYNAPSE</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 600, color: "#3DD68C", fontFamily: "var(--font-mono)" }}>
                {formatSynapse(synapseBalance)}
              </span>
              <span style={{ fontSize: 11, color: "rgba(61,214,140,0.4)" }}>SYNAPSE</span>
            </div>
          </div>

          {/* GEN escrow */}
          <div style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", background: "rgba(200,148,58,0.03)" }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 7 }}>GEN Escrow</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#C8943A", fontFamily: "var(--font-mono)" }}>{formatGEN(locked)}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Locked</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-mono)", color: hasPending ? "#3DD68C" : "var(--text-muted)" }}>
                  {formatGEN(pending)}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Claimable</div>
              </div>
            </div>
          </div>

          {/* Tx history */}
          {txHistory.length > 0 && (
            <div style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Recent</div>
              {txHistory.slice(0, 3).map((tx) => (
                <div key={tx.hash} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {tx.action}
                  </span>
                  <span style={{ fontSize: 10, marginLeft: 8, flexShrink: 0, color: tx.status === "confirmed" ? "#3DD68C" : tx.status === "failed" ? "#E85858" : "#C8943A" }}>
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: "8px 14px 10px" }}>
            <a href={GENLAYER_CHAIN.blockExplorerUrls[0]} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#4D7EFF", textDecoration: "none", display: "block", padding: "4px 0" }}>
              GenLayer Studio ↗
            </a>
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              style={{
                width: "100%", marginTop: 6, padding: "7px 0",
                background: "transparent", border: "1px solid rgba(232,88,88,0.15)",
                borderRadius: 8, color: "rgba(232,88,88,0.45)",
                fontSize: 12, fontFamily: "var(--font-body)", cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#E85858"; e.currentTarget.style.borderColor = "rgba(232,88,88,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(232,88,88,0.45)"; e.currentTarget.style.borderColor = "rgba(232,88,88,0.15)"; }}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
