"""
interact.py — Read and call SynapseConsensus on GenLayer Bradbury Testnet
Uses only standard Python requests. No special SDK needed.

Install deps:
    pip install requests eth-account python-dotenv

Usage:
    python contracts/interact.py info
    python contracts/interact.py balance <wallet_address>
    python contracts/interact.py thread <thread_id>
    python contracts/interact.py contributions <thread_id>
"""

import os
import sys
import json
from pathlib import Path

try:
    import requests
except ImportError:
    print("Run: pip install requests")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv(".env.local")
except ImportError:
    pass

# ── Config ────────────────────────────────────────────────────
RPC_URL          = os.getenv("NEXT_PUBLIC_GENLAYER_RPC", "https://zksync-os-testnet-genlayer.zksync.dev")
PRIVATE_KEY      = os.getenv("DEPLOYER_PRIVATE_KEY", "")
CONTRACT_ADDRESS = os.getenv("NEXT_PUBLIC_SYNAPSE_CONTRACT_ADDRESS", "")

DEPLOY_FILE = Path(__file__).parent / "deployment.json"
if DEPLOY_FILE.exists() and not CONTRACT_ADDRESS:
    info = json.loads(DEPLOY_FILE.read_text())
    CONTRACT_ADDRESS = info.get("address", "")

if not CONTRACT_ADDRESS or CONTRACT_ADDRESS == "0x" + "0" * 40:
    print("Error: Contract address not set.")
    print("Deploy first: python contracts/deploy.py")
    print("Or set NEXT_PUBLIC_SYNAPSE_CONTRACT_ADDRESS in .env.local")
    sys.exit(1)

# ── JSON-RPC helper ───────────────────────────────────────────
_id = 0
def rpc(method, params=None):
    global _id
    _id += 1
    r = requests.post(RPC_URL, json={
        "jsonrpc": "2.0",
        "id":      _id,
        "method":  method,
        "params":  params or [],
    }, timeout=30)
    r.raise_for_status()
    data = r.json()
    if "error" in data:
        raise RuntimeError(data["error"])
    return data.get("result")


def call_view(function_name, args=None):
    """Call a view (read-only) function on the contract."""
    # GenLayer intelligent contracts expose view functions via eth_call
    # with the function name + args encoded in the data field.
    encoded_args = json.dumps(args or [])
    call_data = {
        "to":   CONTRACT_ADDRESS,
        "data": function_name + ":" + encoded_args,
    }
    return rpc("eth_call", [call_data, "latest"])


# ── Commands ──────────────────────────────────────────────────
def cmd_info():
    """Print contract token info."""
    print(f"\nContract: {CONTRACT_ADDRESS}")
    print(f"Network:  GenLayer Bradbury Testnet (Chain ID 4221)")
    print(f"RPC:      {RPC_URL}")
    try:
        result = call_view("get_contract_info")
        print(f"\nContract State:")
        if isinstance(result, dict):
            for k, v in result.items():
                print(f"  {k}: {v}")
        else:
            print(f"  {result}")
    except Exception as e:
        print(f"\n  (Could not fetch contract state: {e})")
        print("  The contract may not support eth_call in this format.")
        print(f"  View directly: https://studio.genlayer.com/contracts/{CONTRACT_ADDRESS}")


def cmd_balance(address):
    """Get SYNAPSE balance for an address."""
    print(f"\nAddress:  {address}")
    try:
        result = call_view("get_balance", [address])
        print(f"Balance:  {result} SYNAPSE")
    except Exception as e:
        print(f"Error: {e}")
        print(f"View on Studio: https://studio.genlayer.com/contracts/{CONTRACT_ADDRESS}")


def cmd_thread(thread_id):
    """Get thread data."""
    try:
        result = call_view("get_thread", [thread_id])
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")


def cmd_contributions(thread_id):
    """List contributions for a thread."""
    try:
        result = call_view("get_contributions", [thread_id])
        if isinstance(result, list):
            for i, c in enumerate(result):
                print(f"\n[{i+1}] {json.dumps(c, indent=2)}")
        else:
            print(result)
    except Exception as e:
        print(f"Error: {e}")


def cmd_studio():
    """Open the contract in GenLayer Studio."""
    url = f"https://studio.genlayer.com/contracts/{CONTRACT_ADDRESS}"
    print(f"\nOpen in browser:\n  {url}")
    try:
        import webbrowser
        webbrowser.open(url)
    except Exception:
        pass


COMMANDS = {
    "info":          (cmd_info,          0, "Show contract info"),
    "balance":       (cmd_balance,       1, "balance <address>  — SYNAPSE balance"),
    "thread":        (cmd_thread,        1, "thread <id>        — Thread data"),
    "contributions": (cmd_contributions, 1, "contributions <id> — Thread contributions"),
    "studio":        (cmd_studio,        0, "Open contract in GenLayer Studio"),
}

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args[0] not in COMMANDS:
        print("\nUsage: python contracts/interact.py <command> [args]")
        print("\nCommands:")
        for name, (_, _, desc) in COMMANDS.items():
            print(f"  {name:<16} {desc}")
        sys.exit(0)

    cmd_name = args[0]
    fn, nargs, _ = COMMANDS[cmd_name]

    if len(args) - 1 < nargs:
        print(f"Usage: python contracts/interact.py {cmd_name} " + " ".join([f"<arg{i+1}>" for i in range(nargs)]))
        sys.exit(1)

    fn(*args[1:nargs + 1])
