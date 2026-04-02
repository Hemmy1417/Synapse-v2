# Deploy via GenLayer Studio (No Code Required)

This is the **easiest way** to deploy `SynapseConsensus.py` to the Bradbury Testnet.
No Python SDK, no CLI — just a browser.

---

## Step 1 — Open GenLayer Studio

Go to: **https://studio.genlayer.com**

---

## Step 2 — Connect Your Wallet

Click **Connect Wallet** in the top right.
Use MetaMask (or any EIP-1193 wallet).

GenLayer Studio will automatically add the Bradbury Testnet network to MetaMask.

---

## Step 3 — Get Testnet Tokens

In the Studio, find the **Faucet** tab or button.
Enter your wallet address and request testnet GEN tokens.

You need at least **0.01 GEN** to deploy.

---

## Step 4 — Create a New Contract

1. Click **New Contract** (or the `+` button)
2. Choose **Python** as the contract language
3. Delete the example code in the editor

---

## Step 5 — Paste the Contract

Open `contracts/SynapseConsensus.py` from this project.
Select all (`Ctrl+A`) and copy (`Ctrl+C`).
Paste into the Studio editor.

---

## Step 6 — Deploy

1. Click the **Deploy** button
2. MetaMask will ask you to confirm the transaction — click **Confirm**
3. Wait 15–60 seconds for the transaction to confirm
4. The Studio will show your contract address once deployed

---

## Step 7 — Copy the Contract Address

The deployed contract address looks like: `0xAbC123...`

Copy it and add it to your `.env.local` file:

```env
NEXT_PUBLIC_SYNAPSE_CONTRACT_ADDRESS=0xYourContractAddress
```

Then restart the dev server:

```bash
npm run dev
```

---

## Step 8 — Verify It Worked

In GenLayer Studio, you can:
- Click **Read** to call view functions (e.g. `get_contract_info`)
- Click **Write** to call state-changing functions
- See all transaction history

Or open your contract directly:
```
https://studio.genlayer.com/contracts/0xYourContractAddress
```

---

## Python Deploy (Alternative)

If you prefer the command line, the Python script only needs `requests` and `eth-account`:

```bash
pip install requests eth-account python-dotenv
python contracts/deploy.py
```

Make sure `.env.local` has:
```env
DEPLOYER_PRIVATE_KEY=0x...your-private-key...
NEXT_PUBLIC_GENLAYER_RPC=https://zksync-os-testnet-genlayer.zksync.dev
```

---

## Troubleshooting

**"Transaction failed"**
→ Check you have enough GEN in your wallet (use the Faucet)

**"Contract not found"**
→ Wait a few more seconds — Bradbury is a testnet and can be slow

**"Network error"**
→ The Bradbury testnet may be down. Check https://status.genlayer.com

**App shows 0 SYNAPSE balance**
→ Make sure `NEXT_PUBLIC_SYNAPSE_CONTRACT_ADDRESS` is set and the dev server is restarted
