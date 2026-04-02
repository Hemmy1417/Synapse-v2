"use client";

import { useState } from "react";
import { AGENTS, FILTERS } from "@/lib/constants";
import { ThreadCard } from "./ThreadCard";
import { CreateThreadModal } from "./CreateThreadModal";
import useStore, { useSortedThreads } from "@/store/useStore";
import { useWallet } from "@/hooks/useWallet";

const AI_TOPICS = [
  { category: "tech",       prompts: ["Should AI replace software engineers?", "Is quantum computing overhyped?", "Will Web3 ever reach mainstream adoption?", "Are large language models truly intelligent?"] },
  { category: "governance", prompts: ["Should voting be mandatory in democracies?", "Is universal basic income fiscally viable?", "Should social media platforms be regulated as utilities?", "Should the UN Security Council be reformed?"] },
  { category: "science",    prompts: ["Is fusion energy commercially viable by 2040?", "Should we prioritize Mars colonization over ocean exploration?", "Is CRISPR gene editing ethical for human enhancement?", "Should geoengineering be used to combat climate change?"] },
  { category: "ethics",     prompts: ["Is it ethical to eat lab-grown meat?", "Should AI systems have legal personhood?", "Is surveillance capitalism an acceptable tradeoff for free services?", "Should autonomous weapons be banned internationally?"] },
  { category: "econ",       prompts: ["Will cryptocurrency replace fiat currency?", "Should central banks issue digital currencies?", "Is degrowth economics a realistic solution to climate change?", "Should there be a global minimum corporate tax?"] },
];

function getRandomAIThread() {
  const topic = AI_TOPICS[Math.floor(Math.random() * AI_TOPICS.length)];
  const title = topic.prompts[Math.floor(Math.random() * topic.prompts.length)];
  return { title, category: topic.category, description: "" };
}

export function ThreadList({ onThreadSelect }) {
  const [showCreate,   setShowCreate]   = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiFlash,      setAiFlash]      = useState(false);

  const activeThreadId  = useStore((s) => s.activeThreadId);
  const setActiveThread = useStore((s) => s.setActiveThread);
  const createThread    = useStore((s) => s.createThread);
  const filter          = useStore((s) => s.filter);
  const setFilter       = useStore((s) => s.setFilter);
  const agentLoading    = useStore((s) => s.agentLoading);
  const threads         = useSortedThreads();

  const { onChainCreateThread } = useWallet();

  const handleCreate = async (data) => {
    const thread = createThread(data);
    setActiveThread(thread.id);
    onChainCreateThread(thread.id, thread.title, thread.category).catch(() => {});
    onThreadSelect?.(thread.id);
  };

  const handleThreadClick = (id) => {
    setActiveThread(id);
    onThreadSelect?.(id);
  };

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    try {
      let data;
      try {
        const res = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `Generate a single thought-provoking debate thread topic for a decision intelligence platform.
Return ONLY valid JSON in this exact format, nothing else:
{"title": "A sharp yes/no or should/shouldn't question under 12 words", "category": "one of: tech|governance|science|ethics|econ", "description": "2-3 sentence context that sets up the debate"}`,
          }),
        });
        const json = await res.json();
        if (json.title && json.category) {
          data = { title: json.title, category: json.category, description: json.description || "" };
        } else {
          throw new Error("unexpected format");
        }
      } catch {
        // Fallback to local curated topics if API unavailable
        data = getRandomAIThread();
      }

      const thread = createThread(data);
      setActiveThread(thread.id);
      onChainCreateThread(thread.id, thread.title, thread.category).catch(() => {});
      setAiFlash(true);
      setTimeout(() => setAiFlash(false), 2000);
      onThreadSelect?.(thread.id);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <>
      <div style={{
        width: "100%", height: "100%",
        background: "var(--bg-panel)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 14px 11px" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
            {threads.length} active thread{threads.length !== 1 ? "s" : ""}
          </div>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 3 }}>
            {FILTERS.map(({ value, label }) => (
              <button key={value} onClick={() => setFilter(value)} style={{
                flex: 1, padding: "5px 0", fontSize: 10, borderRadius: 6,
                fontFamily: "var(--font-body)", fontWeight: 500,
                letterSpacing: "0.04em", transition: "all 0.15s", cursor: "pointer",
                background: filter === value ? "rgba(77,126,255,0.12)" : "transparent",
                border: `1px solid ${filter === value ? "rgba(77,126,255,0.3)" : "var(--border)"}`,
                color: filter === value ? "#4D7EFF" : "var(--text-muted)",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Thread list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 10px" }}>
          {threads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)", fontSize: 12 }}>
              No threads yet.
            </div>
          ) : threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeThreadId}
              onClick={() => handleThreadClick(thread.id)}
            />
          ))}
        </div>

        {/* New thread buttons */}
        <div style={{ padding: "10px 12px 6px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Manual create */}
          <button
            onClick={() => setShowCreate(true)}
            style={{
              width: "100%", padding: "9px 0",
              background: "rgba(77,126,255,0.08)",
              border: "1px solid rgba(77,126,255,0.22)",
              borderRadius: 8, color: "#4D7EFF",
              fontSize: 12, fontWeight: 500,
              fontFamily: "var(--font-body)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(77,126,255,0.14)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(77,126,255,0.08)"; }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Thread
          </button>

          {/* AI generate */}
          <button
            onClick={handleAIGenerate}
            disabled={aiGenerating}
            style={{
              width: "100%", padding: "9px 0",
              background: aiFlash ? "rgba(61,214,140,0.15)" : "rgba(138,90,255,0.08)",
              border: `1px solid ${aiFlash ? "rgba(61,214,140,0.4)" : "rgba(138,90,255,0.25)"}`,
              borderRadius: 8, color: aiFlash ? "#3DD68C" : "#8A5AFF",
              fontSize: 12, fontWeight: 500,
              fontFamily: "var(--font-body)", cursor: aiGenerating ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              opacity: aiGenerating ? 0.7 : 1,
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => { if (!aiGenerating && !aiFlash) e.currentTarget.style.background = "rgba(138,90,255,0.14)"; }}
            onMouseLeave={(e) => { if (!aiGenerating && !aiFlash) e.currentTarget.style.background = "rgba(138,90,255,0.08)"; }}
          >
            {aiGenerating ? (
              <>
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  border: "2px solid rgba(138,90,255,0.3)",
                  borderTopColor: "#8A5AFF",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }} />
                Generating…
              </>
            ) : aiFlash ? (
              <><span>✓</span> Thread created!</>
            ) : (
              <><span style={{ fontSize: 14 }}>◈</span> AI Generate Thread</>
            )}
          </button>
        </div>

        {/* Agent status */}
        <div style={{ padding: "8px 14px 12px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>
            Agents Online
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {Object.values(AGENTS).map((agent) => {
              const busy = agentLoading[agent.id];
              return (
                <div key={agent.id} title={`${agent.name} — ${agent.description}`} style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: agent.bgColor,
                  border: `1px solid ${busy ? agent.color : agent.borderColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, color: agent.color, position: "relative",
                  transition: "all 0.3s",
                  boxShadow: busy ? `0 0 10px ${agent.glowColor}` : "none",
                }}>
                  {agent.symbol}
                  {busy && (
                    <span style={{
                      position: "absolute", inset: -3, borderRadius: 12,
                      border: `1px solid ${agent.color}`,
                      animation: "pulse 1.1s ease-in-out infinite",
                      pointerEvents: "none",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateThreadModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </>
  );
}