import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SEED_THREADS, THREAD_STATUS } from "@/lib/constants";
import { generateId, calcConsensusScore } from "@/lib/utils";
import {
  fbCreateThread, fbUpdateThread, fbDeleteThread,
  fbAddContribution, fbGetThreads, fbGetContributions,
} from "@/lib/firebase";

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
        // Sync to Firebase
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
        // Sync to Firebase
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

          return {
            contributions: { ...s.contributions, [threadId]: updated },
            threads: s.threads.map((t) =>
              t.id === threadId
                ? { ...t, consensusScore: score, status: score >= 70 ? THREAD_STATUS.CONSENSUS_REACHED : THREAD_STATUS.IN_DISCUSSION }
                : t
            ),
          };
        });

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
      name: "synapse-store-v2",
      storage,
      partialize: (s) => ({
        threads:       s.threads,
        contributions: s.contributions,
        summaries:     s.summaries,
        filter:        s.filter,
      }),
      merge: (persisted, current) => {
        const persistedIds = new Set((persisted.threads || []).map((t) => t.id));
        const missingSeeds = SEED_THREADS.filter((t) => !persistedIds.has(t.id));
        return {
          ...current,
          ...persisted,
          threads: [...missingSeeds, ...(persisted.threads || [])],
          contributions: persisted.contributions || {},
          summaries:     persisted.summaries     || {},
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated();
      },
    }
  )
);

export default useStore;

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
