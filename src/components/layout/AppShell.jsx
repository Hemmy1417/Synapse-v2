"use client";

import { useCallback, useState } from "react";
import { ThreadList }        from "@/components/threads/ThreadList";
import { ContributionFeed }  from "@/components/contributions/ContributionFeed";
import { ConsensusPanel }    from "@/components/consensus/ConsensusPanel";
import { WalletButton }      from "@/components/auth/WalletButton";
import { RewardToast }       from "@/components/tokens/RewardToast";
import useStore              from "@/store/useStore";
import { useAgents }         from "@/hooks/useAgents";
import { useWallet }         from "@/hooks/useWallet";

// ── Mobile bottom tab nav ─────────────────────────────────────
function MobileNav({ activePanel, setActivePanel, hasActiveThread }) {
  const tabs = [
    { id: "threads",  icon: "≡",  label: "Threads"   },
    { id: "feed",     icon: "◈",  label: "Discussion", disabled: !hasActiveThread },
    { id: "consensus",icon: "⊙",  label: "Insights",   disabled: !hasActiveThread },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "var(--bg-panel)",
      borderTop: "1px solid var(--border)",
      display: "flex",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {tabs.map((tab) => {
        const active = activePanel === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActivePanel(tab.id)}
            style={{
              flex: 1, padding: "10px 0 8px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: tab.disabled ? "default" : "pointer",
              opacity: tab.disabled ? 0.3 : 1, transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontSize: 18, color: active ? "#4D7EFF" : "var(--text-muted)", lineHeight: 1 }}>
              {tab.icon}
            </span>
            <span style={{ fontSize: 9, color: active ? "#4D7EFF" : "var(--text-muted)", fontWeight: active ? 600 : 400, letterSpacing: "0.06em" }}>
              {tab.label}
            </span>
            {active && (
              <div style={{ position: "absolute", top: 0, left: `calc(${tabs.indexOf(tab) * 33.33}% + 10%)`, width: "13%", height: 2, background: "#4D7EFF", borderRadius: "0 0 2px 2px" }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Active thread panels ──────────────────────────────────────
function ActiveThread({ mobilePanel }) {
  const activeThreadId = useStore((s) => s.activeThreadId);
  const thread         = useStore((s) => s.threads.find((t) => t.id === s.activeThreadId));
  const addContrib     = useStore((s) => s.addContribution);
  const markNew        = useStore((s) => s.markContribNew);
  const clearNew       = useStore((s) => s.clearContribNew);
  const getContribs    = useStore((s) => s.getContributions);

  const { triggerAgents, refreshSummary } = useAgents(activeThreadId);
  const { isConnected, address, submitWithStake, onChainUpdateConsensus } = useWallet();

  const handleUserContribute = useCallback(async (formData) => {
    if (!activeThreadId) return;
    const author   = (isConnected && address) ? address : "You";
    const stakeGEN = formData.stakeGEN ?? 10;
    const contrib  = addContrib(activeThreadId, { ...formData, author, stakeGEN });
    markNew(contrib.id);
    setTimeout(() => clearNew(contrib.id), 2500);
    submitWithStake(activeThreadId, { ...contrib, stakeGEN }, stakeGEN).catch(() => {});
    const current = getContribs(activeThreadId);
    await triggerAgents(current, 2);
    const updated = getContribs(activeThreadId);
    const t = useStore.getState().threads.find((t) => t.id === activeThreadId);
    if (t) onChainUpdateConsensus(activeThreadId, t.consensusScore).catch(() => {});
    await refreshSummary(updated);
  }, [activeThreadId, isConnected, address, addContrib, markNew, clearNew, getContribs, triggerAgents, refreshSummary, submitWithStake, onChainUpdateConsensus]);

  const handleRefreshSummary = useCallback(async () => {
    if (!activeThreadId) return;
    await refreshSummary(getContribs(activeThreadId));
  }, [activeThreadId, getContribs, refreshSummary]);

  if (!thread) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, opacity: 0.06, fontFamily: "var(--font-display)", marginBottom: 12 }}>◈</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Select a thread to begin</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Center feed — hidden on mobile when showing other panels */}
      <div className={`panel-feed ${mobilePanel === "feed" ? "mobile-visible" : "mobile-hidden"}`}
        style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <ContributionFeed thread={thread} onUserContribute={handleUserContribute} />
      </div>

      {/* Right panel — hidden on mobile when showing other panels */}
      <div className={`panel-insights ${mobilePanel === "consensus" ? "mobile-visible" : "mobile-hidden"}`}>
        <ConsensusPanel thread={thread} onRefreshSummary={handleRefreshSummary} />
      </div>
    </>
  );
}

// ── Root AppShell ─────────────────────────────────────────────
export function AppShell() {
  const [mobilePanel, setMobilePanel] = useState("threads");
  const hasThread = useStore((s) => !!s.activeThreadId);

  // When a thread is selected on mobile, auto-switch to feed panel
  const handleThreadSelect = useCallback(() => {
    setMobilePanel("feed");
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100dvh", width: "100vw",
      background: "var(--bg-base)", overflow: "hidden",
      fontFamily: "var(--font-body)", color: "var(--text-primary)", fontSize: 13,
    }}>
      {/* ── Top bar ── */}
      <div style={{
        height: 48, flexShrink: 0,
        background: "var(--bg-panel)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center",
        padding: "0 12px 0 16px", gap: 10,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto" }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: "linear-gradient(135deg, rgba(77,126,255,0.3), rgba(77,126,255,0.08))",
            border: "1px solid rgba(77,126,255,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, color: "#4D7EFF", flexShrink: 0,
          }}>◈</div>
          <div>
            <div style={{ fontSize: 15, fontFamily: "var(--font-display)", color: "var(--text-primary)", letterSpacing: "0.01em", lineHeight: 1 }}>
              Synapse
            </div>
            <div className="hidden-xs" style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.18em", marginTop: 1 }}>
              Decision Intelligence
            </div>
          </div>
        </div>

        {/* Network pill — hidden on smallest screens */}
        <div className="hidden-xs" style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px",
          background: "rgba(61,214,140,0.06)",
          border: "1px solid rgba(61,214,140,0.15)",
          borderRadius: 20, flexShrink: 0,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3DD68C", animation: "pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 10, color: "#3DD68C", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>GenLayer · 4221</span>
        </div>

        <WalletButton />
      </div>

      {/* ── Three panels — desktop side-by-side, mobile stacked ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Left — thread list */}
        <div className={`panel-threads ${mobilePanel === "threads" ? "mobile-visible" : "mobile-hidden"}`}>
          <ThreadList onThreadSelect={handleThreadSelect} />
        </div>

        {/* Center + Right — active thread */}
        <ActiveThread mobilePanel={mobilePanel} />
      </div>

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <div className="mobile-nav-container">
        <MobileNav
          activePanel={mobilePanel}
          setActivePanel={setMobilePanel}
          hasActiveThread={hasThread}
        />
      </div>

      <RewardToast />
    </div>
  );
}
