<<<<<<< HEAD
# Synapse

Synapse is a single-page AI-human decision platform built in plain HTML, CSS, and JavaScript. It lets people create decision threads, invite discussion, collect votes, and view AI-generated perspectives inside one shared workflow.
=======
# Synapse — Decision Intelligence

> AI-native decision coordination on GenLayer Bradbury. Humans and intelligent agents collaborate as equal participants to reason through problems and reach transparent, on-chain consensus.

![GenLayer Bradbury](https://img.shields.io/badge/Network-GenLayer%20Bradbury-4D7EFF?style=flat-square)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-3DD68C?style=flat-square)

---

## What is Synapse?

Synapse is a platform where decisions don't get dictated — they emerge.

Users create **decision threads** around questions, proposals, or predictions. Both humans and AI agents contribute structured insights with claims, reasoning, and evidence. Over time, contributions are scored on-chain using GenLayer's intelligent contracts, consensus forms, and rewards flow to the participants who reasoned well.

**Designed for:**
- Crypto communities coordinating governance proposals
- Teams making complex multi-stakeholder decisions
- Individuals seeking structured, multi-perspective reasoning
- DAOs that want AI-assisted but human-driven consensus

---

## How It Works

```
User creates a thread (question / proposal / prediction)
          │
          ▼
Humans + AI Agents submit structured contributions
  ├── Claim       — the core assertion
  ├── Reasoning   — why they believe it
  ├── Evidence    — supporting data
  ├── Confidence  — self-assessed certainty (5–99%)
  └── Sentiment   — support / oppose / neutral
          │
          ▼
GenLayer Intelligent Contract scores each contribution
  └── gl.exec_prompt() calls an LLM across N validators
      Each validator independently scores quality (0–100)
      Optimistic consensus settles the score on-chain
          │
          ▼
Consensus Score updates as contributions accumulate
  ├── Score ≥ 60  → Consensus Reached  ✓
  └── Score < 60  → In Discussion      ●
          │
          ▼
Synapse Points + GEN rewards distributed
  ├── Contributors earn points for quality reasoning
  ├── Voters earn points for voting with consensus
  └── GEN stake returned 1.5× for accepted contributions
```

---

## AI Agents

Synapse ships with four built-in AI agents that respond automatically to every thread:

| Agent | Symbol | Role |
|-------|--------|------|
| **Logos** | ⬡ | Logical analysis and formal reasoning |
| **Pathos** | ◈ | Human impact and ethical framing |
| **Skeptic** | ⟁ | Devil's advocate and assumption challenges |
| **Synthesist** | ✦ | Pattern recognition and synthesis |

Agents post structured contributions just like humans. Their responses are powered by **Groq (Llama 3.3 70B)** via the `/api/agents` route and are clearly labeled so users always know who is human and who is AI.

---

## Token Economics

### Synapse Points
Earned automatically by participating. No claiming needed.

| Action | Points |
|--------|--------|
| Submit a contribution | +10 pts |
| Contribution accepted on-chain | +25 pts |
| Vote on the right side | +5 pts |
| Consensus reached on your thread | +15 pts |
| Thread finalized | +75 pts |

### GEN Escrow (On-chain)
GEN is the native token of GenLayer Bradbury used for staking.

| Action | Reward |
|--------|--------|
| Create thread | +50 SYNAPSE to creator |
| Post contribution | +25 base; +50 bonus if LLM quality ≥ 80 |
| Cast vote | +5 SYNAPSE to voter |
| Finalize thread | +75 SYNAPSE to creator; +100 to all contributors |
| Contribution accepted | 1.5× your stake returned |
| Contribution rejected | Stake redistributed to correct voters |

**Total Supply:** 10,000,000 SYNAPSE (held by contract at deploy)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | CSS Variables + inline styles |
| State | Zustand (persisted to localStorage) |
| Blockchain | GenLayer Bradbury Testnet |
| Smart Contract | Python Intelligent Contract (`gl.exec_prompt`) |
| AI Agents | Groq API — Llama 3.3 70B Versatile |
| Wallet | MetaMask / Rabby (EIP-1193) |

---
>>>>>>> 9f394b0 (synapse)

## What It Does

<<<<<<< HEAD
- Email/password authentication with Supabase Auth
- Profile onboarding with username, role, focus, and interests
- Decision threads with title, description, category, and status
- AI insight cards from multiple agent personas
- Human and AI discussion messages in the same thread
- Live vote tracking with agree, neutral, and disagree counts
- Realtime dashboard and thread updates through Supabase Realtime
- Responsive dark UI with a custom visual system

## Tech Stack

- `index.html` for the full app UI and client logic
- Supabase Auth for sign up and sign in
- Supabase Database for app data
- Supabase Realtime for live updates
- Google Fonts for typography
- No build step required

## Project Files

```text
synapse/
├── index.html
├── supabase-schema.sql
└── Readme.md
```

## Core Product Flow

1. A user signs up or signs in.
2. Synapse creates or loads the user profile.
3. The user creates a decision thread.
4. AI agents generate structured perspectives for that thread.
5. Humans discuss the decision and cast votes.
6. Consensus updates live as the thread evolves.

## AI Agents

The current version ships with mock in-app agent personas:

- `Aria` the Analyst
- `Kade` the Skeptic
- `Nova` the Optimizer

These agents currently generate client-side mock insights to demonstrate the product flow. They can be replaced later with real LLM API calls.

## Database Tables

The app expects these Supabase tables:

- `profiles`
- `decisions`
- `ai_insights`
- `messages`
- `votes`

The SQL for these tables is included in [supabase-schema.sql](/Users/Pc/Documents/synapse/supabase-schema.sql).

## Setup

### 1. Create a Supabase project

Create a new project in Supabase and wait for it to finish provisioning.

### 2. Run the schema

Open the Supabase SQL Editor and run the contents of [supabase-schema.sql](/Users/Pc/Documents/synapse/supabase-schema.sql).

### 3. Enable Realtime

In Supabase, enable Realtime/replication for:

- `decisions`
- `messages`
- `votes`
- `ai_insights`

### 4. Add your project credentials

This app is a plain browser app, so it does not read `.env.local` automatically at runtime.

Update the Supabase config block in [index.html](/Users/Pc/Documents/synapse/index.html#L1191):

```js
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'YOUR_SUPABASE_PUBLISHABLE_KEY';
```

### 5. Run the app

You can open `index.html` directly, but serving it locally is usually smoother.

Example options:

```bash
npx serve .
```

```bash
python -m http.server 3000
```

Then open the local URL in your browser.

## Auth Notes

- If email confirmation is enabled in Supabase, new users may need to confirm their email before signing in.
- If confirmation emails are not arriving, check Supabase Auth email settings, spam folders, and SMTP configuration.
- For local testing, you can temporarily disable email confirmation in Supabase Auth settings.

## Important Implementation Notes

- The app is intentionally built as a single HTML file.
- Supabase is loaded from the CDN in the browser.
- The connected client instance in the app is `supabaseClient`.
- The current AI insight generation is mocked in the frontend.
- The browser currently updates some denormalized counters directly, which is fine for prototyping but should be tightened for production.

## Next Improvements

- Replace mock AI insights with real LLM calls
- Move vote and message counter updates into database functions
- Tighten RLS policies for production security
- Split the single HTML file into smaller modules if the app grows
- Add deployment for a hosted version

## Vision

Synapse explores a collaborative model where humans and AI do not operate in separate lanes. Instead, both contribute visible reasoning to the same decision process so outcomes are more transparent, discussable, and accountable.
=======
```
src/
├── app/
│   ├── page.tsx                  # Homepage — thread grid
│   ├── layout.jsx                # Root layout
│   ├── globals.css               # Design system + tokens
│   ├── threads/[id]/page.tsx     # Thread detail + contributions
│   ├── leaderboard/page.jsx      # Agent + human leaderboard
│   ├── wallet/page.jsx           # GEN + Synapse Points dashboard
│   └── api/
│       ├── agents/route.js       # AI agent response endpoint
│       ├── contributions/route.js
│       ├── summary/route.js      # Consensus summary generation
│       └── threads/route.js
├── components/
│   ├── nav/Navbar.jsx
│   ├── threads/
│   │   ├── ThreadList.jsx        # Sidebar thread list + create
│   │   ├── ThreadCard.jsx
│   │   └── CreateThreadModal.jsx
│   ├── contributions/
│   │   ├── ContributionFeed.jsx
│   │   ├── ContributionForm.jsx
│   │   └── ContributionBlock.jsx
│   ├── consensus/ConsensusPanel.jsx
│   ├── wallet/EscrowPanel.jsx
│   └── tokens/TokenIncentivesPanel.jsx
├── hooks/
│   ├── useAgents.js              # Agent trigger + summary refresh
│   └── useWallet.js             # Wallet connection + chain management
├── store/
│   └── useStore.js              # Zustand global state
├── lib/
│   ├── agents.js                # Agent API calls + wave logic
│   ├── constants.js             # AGENTS, CATEGORIES, FILTERS, SENTIMENTS
│   ├── utils.js
│   └── web3.js                  # Chain config, formatters, wallet utils
└── contracts/
    ├── SynapseConsensus.py      # GenLayer intelligent contract
    ├── deploy.py                # Python deploy script
    ├── interact.py              # CLI for reading contract state
    └── DEPLOY_STUDIO.md        # Browser-based deploy guide
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A browser wallet (MetaMask or Rabby)
- A [Groq API key](https://console.groq.com) (free)
- Testnet GEN tokens from [faucet.genlayer.com](https://faucet.genlayer.com)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/synapse.git
cd synapse
npm install
```

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# Required — AI agent responses
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx

# Optional — GenLayer contract (get after deploying)
NEXT_PUBLIC_SYNAPSE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_RPC=https://rpc.testnet.genlayer.com
DEPLOYER_PRIVATE_KEY=0x...
```

> **Note:** The app works fully without a deployed contract. On-chain features (GEN staking, escrow, SYNAPSE minting) will silently no-op and contributions are stored locally in your browser.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying the Smart Contract

### Option A — GenLayer Studio (No code, recommended)

See **[contracts/DEPLOY_STUDIO.md](./contracts/DEPLOY_STUDIO.md)** for a step-by-step browser guide.

### Option B — Python Script

```bash
pip install requests eth-account python-dotenv
python contracts/deploy.py
```

Requires `DEPLOYER_PRIVATE_KEY` and `NEXT_PUBLIC_GENLAYER_RPC` in `.env.local`.

After deploy, copy the contract address into `NEXT_PUBLIC_SYNAPSE_CONTRACT_ADDRESS`.

### Contract Functions

**Write (costs GEN gas, earns rewards):**

| Function | Description |
|----------|-------------|
| `create_thread(id, title, category, pool)` | Create a new decision thread |
| `add_contribution(thread_id, ...)` | Submit a contribution (LLM-scored on-chain) |
| `cast_vote(thread_id, contrib_id, sentiment)` | Vote on a contribution |
| `finalize_thread(thread_id)` | Finalize and distribute rewards |
| `update_consensus(thread_id, score)` | Update the consensus score |

**Read (free):**

| Function | Returns |
|----------|---------|
| `get_thread(thread_id)` | Thread struct |
| `get_contributions(thread_id)` | All contributions |
| `get_balance(address)` | SYNAPSE balance |
| `get_token_info(address)` | Full token breakdown |
| `has_voted(thread_id, address)` | bool |

### Interact via CLI

```bash
pip install requests python-dotenv

python contracts/interact.py info              # Contract info
python contracts/interact.py balance 0xYour   # SYNAPSE balance
python contracts/interact.py thread t1        # Thread data
python contracts/interact.py studio           # Open in Studio
```

---

## How LLM Quality Scoring Works

When a contribution is submitted on-chain, GenLayer's `gl.exec_prompt()` runs the scoring logic across multiple independent validators — each one calls an LLM, scores the contribution from 0–100, and the results reach optimistic consensus before being stored on-chain.

```
add_contribution() called
        │
        └─ gl.exec_prompt("Score this contribution 0-100 for...")
                  │
        ┌─────────┴──────────┐
        │  N validators each  │
        │  independently call │
        │  the LLM and score  │
        └─────────┬──────────┘
                  │
        Optimistic consensus
        on the score value
                  │
        Score stored on-chain
        ├── Score ≥ 80 → +50 SYNAPSE bonus minted
        └── Score < 80 → base reward only
```

This means AI quality assessment is **trustless and decentralized** — no single node decides, and the result is verifiable on-chain.

---

## Network Configuration

Synapse runs on **GenLayer Bradbury Testnet**.

| Parameter | Value |
|-----------|-------|
| Network Name | GenLayer Bradbury |
| RPC URL | `https://rpc.testnet.genlayer.com` |
| Chain ID | `42069` (check [docs.genlayer.com](https://docs.genlayer.com)) |
| Currency | GEN |
| Faucet | [faucet.genlayer.com](https://faucet.genlayer.com) |

The app will prompt you to add the network automatically when you connect your wallet.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m 'Add your feature'`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please keep PRs focused. For large changes, open an issue first to discuss the approach.

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

<div align="center">
  <strong>◈ Synapse</strong> — Built on GenLayer Bradbury
  <br/>
  <a href="https://faucet.genlayer.com">Get Testnet GEN</a> ·
  <a href="https://docs.genlayer.com">GenLayer Docs</a> ·
  <a href="https://console.groq.com">Get Groq API Key</a>
</div>
>>>>>>> 9f394b0 (synapse)
#   S y n a p s e - v 2  
 