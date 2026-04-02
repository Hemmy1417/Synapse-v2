"use client";

import { useCallback, useEffect, useRef } from "react";
import useWalletStore from "@/store/useWalletStore";
import {
  connectWallet,
  addAndSwitchToGenLayer,
  getSynapseContract,
  getReadOnlyProvider,
  getWalletName,
  isWalletAvailable,
  GENLAYER_CHAIN_ID,
  CONTRACT_ADDRESS,
  ZERO_ADDRESS,
  MIN_SUBMIT_STAKE,
  MIN_VOTE_STAKE,
} from "@/lib/web3";

const DEPLOYED = CONTRACT_ADDRESS !== ZERO_ADDRESS;

export function useWallet() {
  const store    = useWalletStore();
  const provider = useRef(null);
  const signer   = useRef(null);

  const fetchBalances = useCallback(async (address) => {
    if (!DEPLOYED || !address) return;
    try {
      const ro = await getReadOnlyProvider();
      const c  = await getSynapseContract(ro);
      const [synBal, locked, pending] = await Promise.all([
        c.get_synapse_balance(address).catch(() => 0n),
        c.get_escrow_locked(address).catch(() => 0n),
        c.get_escrow_pending(address).catch(() => 0n),
      ]);
      store.setSynapseBalance(synBal);
      store.setEscrow({ locked: locked.toString(), pending: pending.toString() });
    } catch (e) { console.debug("fetchBalances:", e.message); }
  }, []); // eslint-disable-line

  const silentReconnect = useCallback(async () => {
    if (!isWalletAvailable()) return;
    try {
      const { BrowserProvider } = await import("ethers");
      const _p       = new BrowserProvider(window.ethereum);
      const accounts = await _p.send("eth_accounts", []);
      if (!accounts.length) return;
      provider.current = _p;
      signer.current   = await _p.getSigner();
      const net        = await _p.getNetwork();
      store.setWallet({ address: accounts[0], chainId: Number(net.chainId), walletName: getWalletName() });
      fetchBalances(accounts[0]);
    } catch { /* not connected */ }
  }, [fetchBalances]); // eslint-disable-line

  useEffect(() => {
    if (store.isConnected && store.address) silentReconnect();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!isWalletAvailable()) return;
    const onAccounts = (accounts) => {
      if (!accounts.length) store.disconnect();
      else { store.setWallet({ address: accounts[0], chainId: store.chainId, walletName: getWalletName() }); fetchBalances(accounts[0]); }
    };
    const onChain = (hex) => store.setWallet({ address: store.address, chainId: parseInt(hex, 16), walletName: store.walletName });
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => { window.ethereum.removeListener("accountsChanged", onAccounts); window.ethereum.removeListener("chainChanged", onChain); };
  }, []); // eslint-disable-line

  const connect = useCallback(async () => {
    const result = await connectWallet();
    provider.current = result.provider;
    signer.current   = result.signer;
    if (result.chainId !== GENLAYER_CHAIN_ID) await addAndSwitchToGenLayer();
    store.setWallet({ address: result.address, chainId: result.chainId, walletName: getWalletName() });
    await fetchBalances(result.address);
    return result.address;
  }, [fetchBalances]); // eslint-disable-line

  const disconnect = useCallback(() => {
    provider.current = null; signer.current = null; store.disconnect();
  }, []); // eslint-disable-line

  // ── addGenLayerChain — for the standalone button ──────────
  const addGenLayerChain = useCallback(async () => {
    await addAndSwitchToGenLayer();
  }, []);

  const requireWallet = useCallback(async () => {
    if (!store.address) throw new Error("Connect your wallet first.");
    if (store.chainId !== GENLAYER_CHAIN_ID) await addAndSwitchToGenLayer();
    if (!signer.current) throw new Error("Signer not ready — please reconnect.");
  }, [store.address, store.chainId]);

  const onChainCreateThread = useCallback(async (threadId, title, category, description = "") => {
    if (!DEPLOYED || !signer.current) return null;
    try {
      const c  = await getSynapseContract(signer.current);
      const tx = await c.create_thread(threadId, title, category, description);
      store.addTx(tx.hash, `Create: ${title.slice(0, 28)}`);
      store.addReward(50, "Thread created", "synapse");
      await tx.wait();
      store.resolveTx(tx.hash);
      fetchBalances(store.address);
    } catch (e) { console.debug("createThread:", e.message); }
    return null;
  }, [fetchBalances]); // eslint-disable-line

  const submitWithStake = useCallback(async (threadId, contrib, stakeGEN = MIN_SUBMIT_STAKE) => {
    try { await requireWallet(); } catch (e) { return { ok: false, error: e.message }; }
    store.addReward(25, "Contribution posted", "synapse");
    if (!DEPLOYED || !signer.current) return { ok: true, txHash: null };
    try {
      const { parseEther } = await import("ethers");
      const c   = await getSynapseContract(signer.current);
      const val = parseEther(String(stakeGEN));
      const tx  = await c.submit_contribution(
        threadId, contrib.id,
        contrib.claim.slice(0, 200),
        contrib.reasoning.slice(0, 500),
        (contrib.evidence || "").slice(0, 300),
        BigInt(contrib.confidence), contrib.sentiment, "",
        BigInt(stakeGEN), { value: val }
      );
      store.addTx(tx.hash, `Submit (${stakeGEN} GEN staked)`);
      store.addReward(stakeGEN, `${stakeGEN} GEN locked`, "gen");
      await tx.wait(); store.resolveTx(tx.hash); fetchBalances(store.address);
      return { ok: true, txHash: tx.hash };
    } catch (e) { console.debug("submitWithStake:", e.message); return { ok: true, txHash: null }; }
  }, [requireWallet, fetchBalances]); // eslint-disable-line

  const voteWithStake = useCallback(async (threadId, contributionId, support, stakeGEN = MIN_VOTE_STAKE) => {
    try { await requireWallet(); } catch (e) { return { ok: false, error: e.message }; }
    store.addReward(5, "Vote cast", "synapse");
    if (!DEPLOYED || !signer.current) return { ok: true, txHash: null };
    try {
      const { parseEther } = await import("ethers");
      const c   = await getSynapseContract(signer.current);
      const val = parseEther(String(stakeGEN));
      const tx  = await c.vote_on_contribution(threadId, contributionId, support, BigInt(stakeGEN), { value: val });
      store.addTx(tx.hash, `Vote ${support ? "FOR" : "AGAINST"} (${stakeGEN} GEN)`);
      store.addReward(stakeGEN, `${stakeGEN} GEN locked`, "gen");
      await tx.wait(); store.resolveTx(tx.hash); fetchBalances(store.address);
      return { ok: true, txHash: tx.hash };
    } catch (e) { console.debug("voteWithStake:", e.message); return { ok: true, txHash: null }; }
  }, [requireWallet, fetchBalances]); // eslint-disable-line

  const claimRewards = useCallback(async () => {
    try { await requireWallet(); } catch (e) { return { ok: false, error: e.message }; }
    if (!DEPLOYED || !signer.current) return { ok: false, error: "Contract not deployed" };
    if (BigInt(store.escrowPending || "0") === 0n) return { ok: false, error: "No rewards to claim" };
    try {
      const c  = await getSynapseContract(signer.current);
      const tx = await c.claim_rewards();
      store.addTx(tx.hash, "Claim GEN rewards");
      await tx.wait(); store.resolveTx(tx.hash);
      store.setEscrow({ locked: store.escrowLocked, pending: "0" });
      fetchBalances(store.address);
      return { ok: true, txHash: tx.hash };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [requireWallet, fetchBalances, store.escrowPending, store.escrowLocked]); // eslint-disable-line

  const onChainUpdateConsensus = useCallback(async (threadId, score) => {
    if (!DEPLOYED || !signer.current) return null;
    try {
      const c  = await getSynapseContract(signer.current);
      const tx = await c.update_consensus(threadId, BigInt(score));
      await tx.wait(); return tx.hash;
    } catch (e) { console.debug("updateConsensus:", e.message); return null; }
  }, []); // eslint-disable-line

  return {
    address: store.address, chainId: store.chainId,
    isConnected: store.isConnected, walletName: store.walletName,
    isOnCorrectChain: store.chainId === GENLAYER_CHAIN_ID,
    synapseBalance: store.synapseBalance, totalEarned: store.totalEarned,
    escrowLocked: store.escrowLocked, escrowPending: store.escrowPending,
    pendingRewards: store.pendingRewards, pendingTx: store.pendingTx, txHistory: store.txHistory,
    connect, disconnect, addGenLayerChain,
    fetchBalances: () => fetchBalances(store.address),
    onChainCreateThread, submitWithStake, voteWithStake, claimRewards, onChainUpdateConsensus,
  };
}
