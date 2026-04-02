"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Navbar }            from "@/components/nav/Navbar";
import { ContributionFeed }  from "@/components/contributions/ContributionFeed";
import { ConsensusPanel }    from "@/components/consensus/ConsensusPanel";
import { ContributionForm }  from "@/components/contributions/ContributionForm";
import { ThreadActions }     from "@/components/threads/ThreadActions";
import useStore              from "@/store/useStore";
import { useAgents }         from "@/hooks/useAgents";
import { useWallet }         from "@/hooks/useWallet";
import { CATEGORIES, THREAD_STATUS } from "@/lib/constants";

export default function ThreadPage({ params }) {
  const id = params.id;

  const [showTopForm, setShowTopForm] = useState(false);

  const hasHydrated  = useStore((s) => s._hasHydrated);
  const thread       = useStore((s) => s.threads.find((t) => t.id === id));
  const addContrib   = useStore((s) => s.addContribution);
  const markNew      = useStore((s) => s.markContribNew);
  const clearNew     = useStore((s) => s.clearContribNew);
  const getContribs  = useStore((s) => s.getContributions);
  const setActive    = useStore((s) => s.setActiveThread);
  const agentLoading = useStore((s) => s.agentLoading);
  const isBusy       = Object.values(agentLoading).some(Boolean);

  const feedBottomRef = useRef(null);

  useEffect(() => {
    setActive(id);
  }, [id]); // eslint-disable-line

  const { triggerAgents, refreshSummary } = useAgents(id);
  const { isConnected, address, submitWithStake, onChainUpdateConsensus } = useWallet();

  const handleUserContribute = useCallback(async (formData) => {
    const author   = (isConnected && address) ? address : "You";
    const stakeGEN = formData.stakeGEN ?? 0;
    const contrib  = addContrib(id, { ...formData, author, stakeGEN });
    markNew(contrib.id);
    setTimeout(() => clearNew(contrib.id), 2500);
    setShowTopForm(false);
    setTimeout(() => feedBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 200);
    submitWithStake(id, { ...contrib, stakeGEN }, stakeGEN).catch(() => {});
    const current = getContribs(id);
    await triggerAgents(current, 2);
    const updated = getContribs(id);
    const t = useStore.getState().threads.find((t) => t.id === id);
    if (t) onChainUpdateConsensus(id, t.consensusScore).catch(() => {});
    await refreshSummary(updated);
  }, [id, isConnected, address, addContrib, markNew, clearNew, getContribs, triggerAgents, refreshSummary, submitWithStake, onChainUpdateConsensus]); // eslint-disable-line

  const handleRefreshSummary = useCallback(async () => {
    await refreshSummary(getContribs(id));
  }, [id, getContribs, refreshSummary]); // eslint-disable-line

  // Loading spinner
  if (!hasHydrated) {
    return (
      <>
        <Navbar />
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "60vh", flexDirection: "column", gap: 16,
        }}>
          <div style={{
            width: 40, height: 40,
            border: "3px solid rgba(77,126,255,0.2)",
            borderTopColor: "#4D7EFF", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <div style={{ fontSize: 15, color: "var(--text-muted)" }}>Loading thread…</div>
        </div>
      </>
    );
  }

  // Thread not found
  if (!thread) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div style={{ fontSize: 52, opacity: 0.07, fontFamily: "var(--font-display)" }}>◈</div>
            <p style={{ fontSize: 18, color: "var(--text-muted)" }}>Thread not found.</p>
            <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>
              This thread may have been created in a different browser session.
              Seed threads are always available.
            </p>
            <Link href="/" className="btn-primary" style={{ textDecoration: "none", display: "inline-block", marginTop: 8 }}>
              ← Back to Threads
            </Link>
          </div>
        </div>
      </>
    );
  }

  const cat      = CATEGORIES[thread.category] || { label: thread.category, color: "#5C738A" };
  const contribs = useStore.getState().contributions[id] || [];

  return (
    <>
      <Navbar />

      {/* Breadcrumb */}
      <div className="breadcrumb-bar">
        <Link href="/" className="back-link">← Threads</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">
          {thread.title.length > 55 ? thread.title.slice(0, 55) + "…" : thread.title}
        </span>
      </div>

      {/* Thread hero */}
      <div className="thread-hero">
        <div className="thread-hero-inner">
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <span className="cat-badge" style={{
                background: cat.color + "18", color: cat.color,
                border: `1px solid ${cat.color}33`, fontSize: 13, padding: "4px 12px",
              }}>
                {cat.label}
              </span>
              <span style={{
                fontSize: 13, padding: "4px 12px", borderRadius: 20,
                background: thread.status === THREAD_STATUS.CONSENSUS_REACHED
                  ? "rgba(61,214,140,0.1)" : "rgba(200,148,58,0.1)",
                color: thread.status === THREAD_STATUS.CONSENSUS_REACHED
                  ? "#3DD68C" : "#C8943A",
                border: `1px solid ${thread.status === THREAD_STATUS.CONSENSUS_REACHED
                  ? "rgba(61,214,140,0.25)" : "rgba(200,148,58,0.25)"}`,
              }}>
                {thread.status}
              </span>
              {thread.editedAt && (
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                  edited
                </span>
              )}
            </div>

            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 4vw, 32px)",
              color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 10,
            }}>
              {thread.title}
            </h1>

            {thread.description && (
              <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 680 }}>
                {thread.description}
              </p>
            )}

            <div style={{ marginTop: 12, fontSize: 14, color: "var(--text-muted)" }}>
              by {thread.creator} · {contribs.length} contribution{contribs.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Submit + thread actions */}
          <div style={{ flexShrink: 0, alignSelf: "flex-start", marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
            {!showTopForm ? (
              <button
                className="btn-primary"
                onClick={() => setShowTopForm(true)}
                disabled={isBusy}
                style={{ fontSize: 15, padding: "12px 22px", whiteSpace: "nowrap" }}
              >
                + Submit Contribution
              </button>
            ) : (
              <button
                onClick={() => setShowTopForm(false)}
                style={{
                  padding: "10px 18px", background: "transparent",
                  border: "1px solid var(--border)", borderRadius: 10,
                  color: "var(--text-muted)", fontSize: 14, fontFamily: "var(--font-body)",
                  cursor: "pointer",
                }}
              >
                ✕ Cancel
              </button>
            )}
            {/* ⋯ Edit / Delete menu */}
            <ThreadActions thread={thread} />
          </div>
        </div>

        {/* Inline contribution form */}
        {showTopForm && (
          <div className="top-form-container">
            <ContributionForm onSubmit={handleUserContribute} disabled={isBusy} autoOpen />
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="thread-page-layout">
        <div className="thread-feed-col">
          <ContributionFeed thread={thread} onUserContribute={handleUserContribute} />
          <div ref={feedBottomRef} />
        </div>
        <div className="thread-sidebar-col">
          <ConsensusPanel thread={thread} onRefreshSummary={handleRefreshSummary} />
        </div>
      </div>
    </>
  );
}