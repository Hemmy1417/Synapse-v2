"use client";

import { useRef, useEffect } from "react";
import { ContributionBlock } from "./ContributionBlock";
import { ContributionForm }  from "./ContributionForm";
import { AGENTS }            from "@/lib/constants";
import { CATEGORIES }        from "@/lib/constants";
import useStore              from "@/store/useStore";

export function ContributionFeed({ thread, onUserContribute }) {
  const feedRef = useRef(null);
  const contributions = useStore((s) => s.contributions[thread.id] || []);
  const newContribIds = useStore((s) => s.newContribIds);
  const agentLoading  = useStore((s) => s.agentLoading);
  const busyAgents    = Object.entries(agentLoading).filter(([,v]) => v).map(([id]) => id);
  const isAnyBusy     = busyAgents.length > 0;
  const cat           = CATEGORIES[thread.category] || { label: thread.category, color: "#5C738A" };

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [contributions.length]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 500 }}>
      {/* Thread header */}
      <div className="feed-thread-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{ padding: "3px 10px", background: cat.color + "18", color: cat.color, border: `1px solid ${cat.color}30`, borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat.label}</span>
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>by {thread.creator}</span>
        </div>
        <div className="feed-thread-title">{thread.title}</div>
        {thread.description && <div className="feed-thread-desc">{thread.description}</div>}

        {/* Busy agents banner */}
        {isAnyBusy && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {busyAgents.map((id) => {
              const a = AGENTS[id];
              return (
                <span key={id} style={{ fontSize: 13, color: a.color, padding: "4px 12px", background: a.bgColor, border: `1px solid ${a.borderColor}`, borderRadius: 20, display: "flex", alignItems: "center", gap: 5, animation: "pulse 1.4s ease-in-out infinite" }}>
                  {a.symbol} {a.name} reasoning…
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Feed */}
      <div ref={feedRef} className="dot-grid" style={{ flex: 1, overflowY: "auto", padding: "20px 20px" }}>
        {contributions.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 220, gap: 14 }}>
            {isAnyBusy ? (
              <>
                <div style={{ width: 44, height: 44, border: "2px solid rgba(77,126,255,0.3)", borderTopColor: "#4D7EFF", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <div style={{ fontSize: 16, color: "var(--text-muted)" }}>Agents are analyzing the thread…</div>
              </>
            ) : (
              <div style={{ fontSize: 16, color: "var(--text-muted)" }}>No contributions yet — be the first!</div>
            )}
          </div>
        )}

        {contributions.map((c) => (
          <ContributionBlock key={c.id} contribution={c} threadId={thread.id} isNew={newContribIds.has(c.id)} />
        ))}

        {isAnyBusy && contributions.length > 0 && (
          <div style={{ display: "flex", gap: 8, padding: "10px 0", flexWrap: "wrap" }}>
            {busyAgents.map((id) => {
              const a = AGENTS[id];
              return <span key={id} style={{ fontSize: 13, color: a.color, padding: "4px 12px", background: a.bgColor, border: `1px solid ${a.borderColor}`, borderRadius: 20, animation: "pulse 1.4s ease-in-out infinite" }}>{a.symbol} {a.name} reasoning…</span>;
            })}
          </div>
        )}
      </div>

      {/* Form */}
      <div style={{ padding: "16px 20px 20px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <ContributionForm onSubmit={onUserContribute} disabled={isAnyBusy} />
      </div>
    </div>
  );
}
