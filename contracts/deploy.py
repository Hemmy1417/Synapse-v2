"""
deploy.py — Deploy SynapseConsensus to GenLayer Bradbury Testnet
Uses only standard Python libraries (requests + eth_account).

Install deps:
    pip install requests eth-account python-dotenv

Run:
    python contracts/deploy.py

After deploy, copy the printed contract address into .env.local:
    NEXT_PUBLIC_SYNAPSE_CONTRACT_ADDRESS=0x...
"""

import os
import sys
import json
import time
import hashlib
from pathlib import Path

# ── Minimal dependency check ──────────────────────────────────
missing = []
try:
    import requests
except ImportError:
    missing.append("requests")

try:
    from eth_account import Account
    from eth_account.signers.local import LocalAccount
except ImportError:
    missing.append("eth-account")

try:
    from dotenv import load_dotenv
    load_dotenv(".env.local")
except ImportError:
    pass  # optional

if missing:
    print(f"\n  Missing dependencies: {', '.join(missing)}")
    print(f"  Run: pip install {' '.join(missing)}")
    print("\n  Or use the Studio method instead:")
    print("  See: contracts/DEPLOY_STUDIO.md")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────
RPC_URL     = os.getenv("NEXT_PUBLIC_GENLAYER_RPC", "https://zksync-os-testnet-genlayer.zksync.dev")
PRIVATE_KEY = os.getenv("DEPLOYER_PRIVATE_KEY", "").strip()
CONTRACT_PATH = Path(__file__).parent / "SynapseConsensus.py"

if not PRIVATE_KEY:
    print("\n  Error: DEPLOYER_PRIVATE_KEY not set in .env.local")
    print("  See: contracts/DEPLOY_STUDIO.md for the no-code deploy option")
    sys.exit(1)

if not PRIVATE_KEY.startswith("0x"):
    PRIVATE_KEY = "0x" + PRIVATE_KEY

# ── Helpers ───────────────────────────────────────────────────
def rpc(method, params=None, url=RPC_URL):
    """Make a JSON-RPC call to the GenLayer node."""
    payload = {
        "jsonrpc": "2.0",
        "id":      1,
        "method":  method,
        "params":  params or [],
    }
    try:
        r = requests.post(url, json=payload, timeout=60)
        r.raise_for_status()
        data = r.json()
        if "error" in data:
            raise RuntimeError(f"RPC error: {data['error']}")
        return data.get("result")
    except requests.exceptions.ConnectionError:
        print(f"\n  Cannot reach GenLayer RPC: {url}")
        print("  Check your internet connection or try the Studio deploy instead.")
        print("  See: contracts/DEPLOY_STUDIO.md")
        sys.exit(1)


def wait_for_tx(tx_hash, timeout=180, poll=3):
    """Poll for transaction receipt until confirmed or timeout."""
    deadline = time.time() + timeout
    dots = 0
    while time.time() < deadline:
        receipt = rpc("eth_getTransactionReceipt", [tx_hash])
        if receipt:
            return receipt
        dots += 1
        print(f"  Waiting{'.' * (dots % 4)}   ", end="\r")
        time.sleep(poll)
    raise TimeoutError(f"Transaction {tx_hash} not confirmed within {timeout}s")


# ── Main deploy ───────────────────────────────────────────────
def deploy():
    print("=" * 62)
    print("  Synapse — GenLayer Bradbury Testnet Deployment")
    print("=" * 62)

    # Load account
    account: LocalAccount = Account.from_key(PRIVATE_KEY)
    address = account.address
    print(f"\n  Deployer:  {address}")
    print(f"  RPC:       {RPC_URL}")

    # Check balance
    balance_hex = rpc("eth_getBalance", [address, "latest"])
    balance_wei = int(balance_hex, 16)
    balance_eth = balance_wei / 1e18
    print(f"  Balance:   {balance_eth:.6f} GEN")

    if balance_eth < 0.001:
        print("\n  ⚠  Low balance. Get testnet GEN from:")
        print("     https://studio.genlayer.com  →  Faucet tab")
        if balance_eth == 0:
            sys.exit(1)

    # Read contract source
    source = CONTRACT_PATH.read_text(encoding="utf-8")
    print(f"\n  Contract:  {CONTRACT_PATH.name}  ({len(source):,} bytes)")

    # Get nonce
    nonce_hex = rpc("eth_getTransactionCount", [address, "latest"])
    nonce = int(nonce_hex, 16)

    # Get gas price
    gas_price_hex = rpc("eth_gasPrice")
    gas_price = int(gas_price_hex, 16)
    print(f"  Gas price: {gas_price / 1e9:.2f} Gwei")

    # Encode contract bytecode
    # GenLayer intelligent contracts are deployed as UTF-8 source code.
    # The deployment data = ABI-encoded constructor call wrapping the source.
    source_bytes = source.encode("utf-8")
    source_hex   = source_bytes.hex()

    # Build deployment transaction
    # GenLayer uses standard Ethereum transaction format;
    # "to" is None for contract deployment.
    tx = {
        "nonce":    nonce,
        "gasPrice": gas_price,
        "gas":      3_000_000,
        "to":       None,        # contract creation
        "value":    0,
        "data":     "0x" + source_hex,
        "chainId":  4221,       # GenLayer Bradbury
    }

    # Sign
    signed = account.sign_transaction(tx)
    raw_tx = signed.raw_transaction.hex()
    if not raw_tx.startswith("0x"):
        raw_tx = "0x" + raw_tx

    # Send
    print("\n  Sending deployment transaction...")
    start   = time.time()
    tx_hash = rpc("eth_sendRawTransaction", [raw_tx])
    print(f"  Tx hash:   {tx_hash}")

    # Wait for confirmation
    print("  Waiting for confirmation (up to 3 min)...")
    receipt = wait_for_tx(tx_hash)
    elapsed = time.time() - start

    status = int(receipt.get("status", "0x0"), 16)
    if status != 1:
        print(f"\n  ✗ Transaction failed. Receipt:\n{json.dumps(receipt, indent=2)}")
        sys.exit(1)

    contract_address = receipt.get("contractAddress")
    print(f"\n  ✓ Deployed in {elapsed:.1f}s")
    print(f"  Address:   {contract_address}")

    # Save deployment info
    info = {
        "contract":   "SynapseConsensus",
        "address":    contract_address,
        "tx_hash":    tx_hash,
        "deployer":   address,
        "network":    "GenLayer Bradbury Testnet",
        "chain_id":   4221,
        "rpc":        RPC_URL,
        "deployed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    out = Path(__file__).parent / "deployment.json"
    out.write_text(json.dumps(info, indent=2))

    print(f"\n  Saved to:  {out}")
    print("\n  ── Next Steps ─────────────────────────────────────────────")
    print(f"  1. Add to .env.local:")
    print(f"       NEXT_PUBLIC_SYNAPSE_CONTRACT_ADDRESS={contract_address}")
    print(f"  2. View on Studio:")
    print(f"       https://studio.genlayer.com/contracts/{contract_address}")
    print("=" * 62)
    return contract_address


if __name__ == "__main__":
    deploy()
