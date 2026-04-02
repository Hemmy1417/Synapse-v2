# SynapseConsensus — GenLayer Intelligent Contract

Deployed on the GenLayer Bradbury Testnet. Uses `gl.exec_prompt()` to call Claude
*from within the contract* to score contribution quality on-chain.

---

## Deploy Options

### Option A — GenLayer Studio (Easiest, no code)
See **[DEPLOY_STUDIO.md](./DEPLOY_STUDIO.md)** for a step-by-step browser guide.

### Option B — Python Script
```bash
pip install requests eth-account python-dotenv
python contracts/deploy.py
```

Requires in `.env.local`:
```env
DEPLOYER_PRIVATE_KEY=0x...your-key...
NEXT_PUBLIC_GENLAYER_RPC=https://rpc.testnet.genlayer.com
```

Get testnet GEN: **https://studio.genlayer.com** → Faucet tab

---

## Files

| File | Description |
|------|-------------|
| `SynapseConsensus.py` | The intelligent contract |
| `deploy.py` | Python deploy script (needs `requests`, `eth-account`) |
| `interact.py` | CLI for reading the deployed contract |
| `DEPLOY_STUDIO.md` | Browser-based deploy guide (no Python needed) |
| `deployment.json` | Auto-created after deploy — stores contract address |

---

## Contract Functions

### Write (earn SYNAPSE rewards)

| Function | Reward |
|----------|--------|
| `create_thread(id, title, category, pool)` | +50 SYNAPSE to creator |
| `add_contribution(thread_id, ...)` | +25 base; +50 bonus if LLM quality ≥ 80 |
| `cast_vote(thread_id, contrib_id, sentiment)` | +5 SYNAPSE to voter |
| `finalize_thread(thread_id)` | +75 SYNAPSE to creator; +100 to all contributors |
| `update_consensus(thread_id, score, ...)` | — (no reward) |

### View (free reads)

| Function | Returns |
|----------|---------|
| `get_thread(thread_id)` | Thread struct |
| `get_contributions(thread_id)` | Contribution[] |
| `get_balance(address)` | SYNAPSE balance |
| `get_token_info(address)` | Full TokenBalance struct |
| `get_contract_info()` | Name, symbol, supply, owner |
| `has_voted(thread_id, address)` | bool |

---

## How LLM Quality Scoring Works

```
Human posts → add_contribution() called on-chain
                    │
                    └─ gl.exec_prompt("Score 0-100...")
                              │
                    ┌─────────┴──────────┐
                    │  GenLayer runs the  │
                    │  prompt across N    │
                    │  validators, each   │
                    │  independently      │
                    │  calling Claude     │
                    └─────────┬──────────┘
                              │
                    Optimistic consensus
                    on the score value
                              │
                    Score stored on-chain
                    Tokens minted if ≥ 80
```

---

## Token Economics

```
Total Supply:  10,000,000 SYNAPSE (held by contract at deploy)

Earnings:
  Create thread          →  +50 SYNAPSE
  Post contribution      →  +25 SYNAPSE
  Quality bonus (≥80)    →  +50 SYNAPSE  (LLM-scored on-chain)
  Cast vote              →   +5 SYNAPSE
  Thread finalized       →  +75 SYNAPSE  (creator)
  Consensus reached      → +100 SYNAPSE  (all contributors)
  Reward pool share      →  pro-rata by quality score
```

---

## Interact via CLI

After deploying and setting `NEXT_PUBLIC_SYNAPSE_CONTRACT_ADDRESS`:

```bash
# Install deps
pip install requests python-dotenv

# Contract info
python contracts/interact.py info

# SYNAPSE balance
python contracts/interact.py balance 0xYourAddress

# Thread data
python contracts/interact.py thread t1

# Open in Studio browser
python contracts/interact.py studio
```
