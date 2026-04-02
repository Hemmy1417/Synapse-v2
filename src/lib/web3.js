// SSR-safe — all ethers imports are lazy

export const GENLAYER_CHAIN_ID     = 4221;
export const GENLAYER_CHAIN_ID_HEX = "0x107d"; // lowercase hex — required by some wallets

// Strict MetaMask-compatible shape for wallet_addEthereumChain
export const GENLAYER_CHAIN_PARAMS = {
  chainId:   "0x107d",
  chainName: "GenLayer Bradbury Testnet",
  nativeCurrency: {
    name:     "GEN",
    symbol:   "GEN",
    decimals: 18,
  },
  rpcUrls: ["https://zksync-os-testnet-genlayer.zksync.dev"],
  blockExplorerUrls: ["https://studio.genlayer.com"],
};

// Alias kept for any existing imports
export const GENLAYER_CHAIN = GENLAYER_CHAIN_PARAMS;

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_SYNAPSE_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const CONTRACT_DEPLOYED = CONTRACT_ADDRESS !== ZERO_ADDRESS;

export const MIN_SUBMIT_STAKE = 10;
export const MIN_VOTE_STAKE   = 5;

export const SYNAPSE_ABI = [
  "function get_synapse_balance(address) view returns (uint256)",
  "function get_escrow_locked(address) view returns (uint256)",
  "function get_escrow_pending(address) view returns (uint256)",
  "function get_total_minted() view returns (uint256)",
  "function get_thread(string) view returns (string)",
  "function get_contributions(string) view returns (string)",
  "function get_votes(string, string) view returns (string)",
  "function create_thread(string,string,string,string) returns ()",
  "function submit_contribution(string,string,string,string,string,uint256,string,string,uint256) payable returns ()",
  "function vote_on_contribution(string,string,bool,uint256) payable returns ()",
  "function finalize_thread(string) returns ()",
  "function claim_rewards() returns ()",
  "function update_consensus(string,uint256) returns ()",
];

// ── Wallet utilities ──────────────────────────────────────────
export function isWalletAvailable() {
  return typeof window !== "undefined" && !!window.ethereum;
}

export function getWalletName() {
  if (!isWalletAvailable()) return null;
  if (window.ethereum.isRabby)          return "Rabby";
  if (window.ethereum.isCoinbaseWallet) return "Coinbase Wallet";
  if (window.ethereum.isMetaMask)       return "MetaMask";
  return "Wallet";
}

// ── The ONE function that adds + switches to GenLayer ─────────
// Call this from onClick handlers — never from hooks or useEffect
export async function addAndSwitchToGenLayer() {
  if (!isWalletAvailable()) throw new Error("Install MetaMask or a Web3 wallet first.");

  // Step 1: always try adding the chain
  // MetaMask: if chain already exists it throws but still stays on it
  // If truly new: MetaMask shows the Add Network dialog and switches automatically
  try {
    await window.ethereum.request({
      method:  "wallet_addEthereumChain",
      params:  [GENLAYER_CHAIN_PARAMS],
    });
    return; // success — MetaMask added + switched
  } catch (addErr) {
    if (addErr.code === 4001) {
      // User clicked "Cancel" on the MetaMask dialog
      throw new Error("You cancelled the network prompt. Please try again and click Approve.");
    }
    // Any other error (e.g. chain already exists) — fall through and switch
  }

  // Step 2: chain was already added — just switch to it
  try {
    await window.ethereum.request({
      method:  "wallet_switchEthereumChain",
      params:  [{ chainId: "0x107d" }],
    });
  } catch (switchErr) {
    if (switchErr.code === 4001) {
      throw new Error("You cancelled the switch. Please approve in MetaMask.");
    }
    throw new Error(`Network switch failed: ${switchErr.message}`);
  }
}

// ── Connect wallet ────────────────────────────────────────────
export async function connectWallet() {
  if (!isWalletAvailable()) throw new Error("Install MetaMask or a Web3 wallet first.");
  const { BrowserProvider } = await import("ethers");
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  if (!accounts.length) throw new Error("No accounts returned.");
  const signer  = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  return { provider, signer, address, chainId: Number(network.chainId) };
}

export async function getSynapseContract(signerOrProvider) {
  const { Contract } = await import("ethers");
  return new Contract(CONTRACT_ADDRESS, SYNAPSE_ABI, signerOrProvider);
}

export async function getReadOnlyProvider() {
  const { JsonRpcProvider } = await import("ethers");
  return new JsonRpcProvider("https://zksync-os-testnet-genlayer.zksync.dev");
}

export function shortAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatSynapse(raw) {
  const n = Number(raw);
  return (n && n !== 0) ? n.toLocaleString() : "0";
}

export function formatGEN(wei) {
  try {
    const n = Number(BigInt(wei)) / 1e18;
    return n % 1 === 0 ? n.toString() : n.toFixed(3);
  } catch { return "0"; }
}
