import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SEED_THREADS, THREAD_STATUS } from "@/lib/constants";
import { generateId, calcConsensusScore } from "@/lib/utils";
import {
  fbCreateThread, fbUpdateThread, fbDeleteThread,
  fbAddContribution,
} from "@/lib/firebase";

// ── Point values ───────────────────────────────────────
const PTS = {
  CONTRIBUTE:        10,
  CONTRIBUTION_ACCEPTED: 25,
  VOTE_CORRECT:       5,
  CONSENSUS_REACHED: 15,
  CREATE_THREAD:     50,
  THREAD_FINALIZED:  75,
};

// SSR-safe localStorage
const storage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return window.localStorage;
});

// Check if Firebase is configured
const firebaseEnabled = () =>
  typeof window !== "undefined" &&
  !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const useStore = create(
  persist(
    (set, get) => ({
      // ── Hydration flag ─────────────────────────────────────
      _hasHydrated: false,
      setHasHydrated: () => set({ _hasHydrated: true }),

      // ── Synapse Points (local, instant) ────────────────────
      synapsePoints: 0,
      pointsHistory: [], // { action, pts, timestamp, threadId }

      awardPoints: (action, pts, threadId = null) => {
        set((s) => ({
          synapsePoints: s.synapsePoints + pts,
          pointsHistory: [
            { action, pts, timestamp: Date.now(), threadId },
            ...s.pointsHistory,
          ].slice(0, 100), // keep last 100 events
        }));
      },

      // ── Threads ─────────────────────────────────────────────
      threads:        SEED_THREADS,
      activeThreadId: SEED_THREADS[0].id,

      setActiveThread: (id) => set({ activeThreadId: id }),

      createThread: (data) => {
        const thread = {
          ...data,
          id:             generateId("t"),
          timestamp:      Date.now(),
          status:         THREAD_STATUS.OPEN,
          consensusScore: 0,
        };
        set((s) => ({ threads: [thread, ...s.threads] }));

        // Award points instantly
        get().awardPoints("Created a thread", PTS.CREATE_THREAD, thread.id);

        // Sync to Firebase
        if (firebaseEnabled()) {
          fbCreateThread(thread).catch((e) => console.warn("Firebase createThread:", e));
        }
        return thread;
      },

      // ── Edit thread ─────────────────────────────────────────
      editThread: (threadId, updates) => {
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? { ...t, ...updates, editedAt: Date.now() }
              : t
          ),
        }));
        if (firebaseEnabled()) {
          fbUpdateThread(threadId, { ...updates, editedAt: Date.now() })
            .catch((e) => console.warn("Firebase editThread:", e));
        }
      },

      // ── Delete thread ────────────────────────────────────────
      deleteThread: (threadId) => {
        const { threads, activeThreadId } = get();
        const remaining = threads.filter((t) => t.id !== threadId);
        set((s) => ({
          threads: remaining,
          activeThreadId: activeThreadId === threadId
            ? (remaining[0]?.id || null)
            : activeThreadId,
          contributions: Object.fromEntries(
            Object.entries(s.contributions).filter(([k]) => k !== threadId)
          ),
          summaries: Object.fromEntries(
            Object.entries(s.summaries).filter(([k]) => k !== threadId)
          ),
        }));
        if (firebaseEnabled()) {
          fbDeleteThread(threadId).catch((e) => console.warn("Firebase deleteThread:", e));
        }
      },

      // ── Contributions ──────────────────────────────────────
      contributions: {},

      getContributions: (threadId) => get().contributions[threadId] || [],

      addContribution: (threadId, contrib) => {
        const id   = generateId("c");
        const full = { ...contrib, id, timestamp: Date.now(), threadId };

        set((s) => {
          const existing = s.contributions[threadId] || [];
          const updated  = [...existing, full];
          const score    = calcConsensusScore(updated);
          const wasConsensus = s.threads.find((t) => t.id === threadId)?.status === THREAD_STATUS.CONSENSUS_REACHED;
          const nowConsensus = score >= 70;

          // Award consensus points to all contributors if newly reached
          if (!wasConsensus && nowConsensus) {
            setTimeout(() => get().awardPoints("Consensus reached", PTS.CONSENSUS_REACHED, threadId), 0);
          }

          return {
            contributions: { ...s.contributions, [threadId]: updated },
            threads: s.threads.map((t) =>
              t.id === threadId
                ? { ...t, consensusScore: score, status: nowConsensus ? THREAD_STATUS.CONSENSUS_REACHED : THREAD_STATUS.IN_DISCUSSION }
                : t
            ),
          };
        });

        // Award contribution points instantly
        if (!contrib.agentId) {
          get().awardPoints("Submitted a contribution", PTS.CONTRIBUTE, threadId);
        }

        // Sync to Firebase
        if (firebaseEnabled()) {
          fbAddContribution(threadId, full).catch((e) => console.warn("Firebase addContribution:", e));
        }

        return full;
      },

      // ── Agent Loading ───────────────────────────────────────
      agentLoading: {},

      setAgentLoading: (agentId, loading) =>
        set((s) => ({ agentLoading: { ...s.agentLoading, [agentId]: loading } })),

      // ── New-contribution animations ─────────────────────────
      newContribIds: new Set(),

      markContribNew: (id) =>
        set((s) => ({ newContribIds: new Set([...s.newContribIds, id]) })),

      clearContribNew: (id) =>
        set((s) => { const n = new Set(s.newContribIds); n.delete(id); return { newContribIds: n }; }),

      // ── AI Summaries ────────────────────────────────────────
      summaries: {},
      setSummary: (threadId, summary) =>
        set((s) => ({ summaries: { ...s.summaries, [threadId]: summary } })),

      // ── Filter ──────────────────────────────────────────────
      filter: "latest",
      setFilter: (f) => set({ filter: f }),
    }),
    {
      name: "synapse-store-v3",
      storage,
      partialize: (s) => ({
        threads:       s.threads,
        contributions: s.contributions,
        summaries:     s.summaries,
        filter:        s.filter,
        synapsePoints: s.synapsePoints,
        pointsHistory: s.pointsHistory,
      }),
      merge: (persisted, current) => {
        const persistedIds = new Set((persisted.threads || []).map((t) => t.id));
        const missingSeeds = SEED_THREADS.filter((t) => !persistedIds.has(t.id));
        return {
          ...current,
          ...persisted,
          threads:       [...missingSeeds, ...(persisted.threads || [])],
          contributions: persisted.contributions || {},
          summaries:     persisted.summaries     || {},
          synapsePoints: persisted.synapsePoints || 0,
          pointsHistory: persisted.pointsHistory || [],
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated();
      },
    }
  )
);

export default useStore;
export { PTS };

// Reactive sorted-threads selector
export function useSortedThreads() {
  return useStore((s) => {
    const { threads, contributions, filter } = s;
    return [...threads].sort((a, b) => {
      if (filter === "most-agreed")  return b.consensusScore - a.consensusScore;
      if (filter === "most-debated") {
        const ac = (contributions[a.id] || []).filter((c) => c.sentiment === "oppose").length;
        const bc = (contributions[b.id] || []).filter((c) => c.sentiment === "oppose").length;
        return bc - ac;
      }
      return b.timestamp - a.timestamp;
    });
  });
}