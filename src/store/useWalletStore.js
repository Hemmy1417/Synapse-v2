import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useWalletStore = create(
  persist(
    (set) => ({
      // ── Connection ──────────────────────────────────────────
      address:     null,
      chainId:     null,
      isConnected: false,
      walletName:  null,

      // ── SYNAPSE token ───────────────────────────────────────
      synapseBalance: 0,
      totalEarned:    0,

      // ── GEN Escrow ──────────────────────────────────────────
      // GEN locked in active stakes (BigInt serialised as string)
      escrowLocked:   "0",
      // GEN available to claim (resolved rewards)
      escrowPending:  "0",

      // ── Reward toast animations ─────────────────────────────
      pendingRewards: [],

      // ── Transaction history ─────────────────────────────────
      pendingTx: null,
      txHistory:  [],

      // ── Setters ─────────────────────────────────────────────
      setWallet: ({ address, chainId, walletName }) =>
        set({ address, chainId, walletName, isConnected: true }),

      disconnect: () =>
        set({
          address: null, chainId: null,
          isConnected: false, walletName: null,
          synapseBalance: 0, escrowLocked: "0", escrowPending: "0",
        }),

      setSynapseBalance: (balance) =>
        set({ synapseBalance: Number(balance) || 0 }),

      setEscrow: ({ locked, pending }) =>
        set({
          escrowLocked:  String(locked  ?? "0"),
          escrowPending: String(pending ?? "0"),
        }),

      addReward: (amount, reason, type = "synapse") => {
        const id = `r-${Date.now()}`;
        set((s) => ({
          synapseBalance: type === "synapse" ? s.synapseBalance + amount : s.synapseBalance,
          totalEarned:    type === "synapse" ? s.totalEarned    + amount : s.totalEarned,
          pendingRewards: [...s.pendingRewards, { id, amount, reason, type }],
        }));
        setTimeout(
          () => set((s) => ({ pendingRewards: s.pendingRewards.filter((r) => r.id !== id) })),
          4500
        );
      },

      addTx: (hash, action) =>
        set((s) => ({
          pendingTx: hash,
          txHistory: [
            { hash, action, timestamp: Date.now(), status: "pending" },
            ...s.txHistory.slice(0, 19),
          ],
        })),

      resolveTx: (hash, status = "confirmed") =>
        set((s) => ({
          pendingTx: s.pendingTx === hash ? null : s.pendingTx,
          txHistory: s.txHistory.map((tx) =>
            tx.hash === hash ? { ...tx, status } : tx
          ),
        })),
    }),
    {
      name: "synapse-wallet-v3",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return window.localStorage;
      }),
      partialize: (s) => ({
        address:        s.address,
        chainId:        s.chainId,
        isConnected:    s.isConnected,
        walletName:     s.walletName,
        synapseBalance: s.synapseBalance,
        totalEarned:    s.totalEarned,
        escrowLocked:   s.escrowLocked,
        escrowPending:  s.escrowPending,
        txHistory:      s.txHistory,
      }),
    }
  )
);

export default useWalletStore;
