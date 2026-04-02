"use client";

import { useCallback, useEffect, useRef } from "react";
import useStore from "@/store/useStore";
import { runAgentWave, selectRespondingAgents } from "@/lib/agents";

// Module-level set so it persists across re-renders without leaking refs
const initializedThreads = new Set();

export function useAgents(threadId) {
  const addContribution  = useStore((s) => s.addContribution);
  const getContributions = useStore((s) => s.getContributions);
  const setAgentLoading  = useStore((s) => s.setAgentLoading);
  const markContribNew   = useStore((s) => s.markContribNew);
  const clearContribNew  = useStore((s) => s.clearContribNew);
  const threads          = useStore((s) => s.threads);
  const setSummary       = useStore((s) => s.setSummary);

  // Use a ref to always read the latest thread without stale closures
  const threadRef = useRef(null);
  threadRef.current = threads.find((t) => t.id === threadId) || null;

  // ── refreshSummary defined FIRST — triggerAgents depends on it ───────────
  const refreshSummary = useCallback(
    async (contribs) => {
      const thread = threadRef.current;
      if (!thread || !contribs || contribs.length === 0) return;
      try {
        const res = await fetch("/api/summary", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ thread, contributions: contribs }),
        });
        if (res.ok) {
          const summary = await res.json();
          setSummary(threadId, summary);
        }
      } catch (e) {
        console.error("Summary failed:", e);
      }
    },
    [threadId, setSummary]
  );

  // ── triggerAgents defined AFTER refreshSummary ───────────────────────────
  const triggerAgents = useCallback(
    async (baseContribs, agentCount = 3) => {
      const thread = threadRef.current;
      if (!thread) return;

      const agentIds = selectRespondingAgents(baseContribs, agentCount);

      await runAgentWave({
        agentIds,
        thread,
        baseContributions: baseContribs,
        onContribution: (agentId, contrib) => {
          const full = addContribution(threadId, { ...contrib, agentId });
          markContribNew(full.id);
          setTimeout(() => clearContribNew(full.id), 2500);
        },
        onLoadingChange: (agentId, active) => {
          setAgentLoading(agentId, active);
        },
        delayMs: 600,
      });

      // Refresh summary after each agent wave
      const updated = getContributions(threadId);
      if (updated.length >= 2) {
        await refreshSummary(updated);
      }
    },
    [threadId, addContribution, markContribNew, clearContribNew, setAgentLoading, getContributions, refreshSummary]
  );

  // ── Auto-trigger on first open ────────────────────────────────────────────
  useEffect(() => {
    if (!threadId) return;
    if (initializedThreads.has(threadId)) return;
    initializedThreads.add(threadId);

    const existing = getContributions(threadId);
    if (existing.length === 0) {
      triggerAgents([]);
    }
  // triggerAgents identity changes are fine here — we only want this on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  return { triggerAgents, refreshSummary };
}
