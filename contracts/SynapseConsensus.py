# { "Depends": "py-genlayer:test" }
# ============================================================
# SynapseConsensus — GenLayer Bradbury Testnet
# Decision coordination + SYNAPSE tokens + GEN Escrow
#
# Escrow Mechanics:
#   submit_contribution  → locks MIN_STAKE GEN in escrow
#   vote_on_contribution → locks VOTE_STAKE GEN in escrow
#   finalize_thread      → distributes GEN + mints SYNAPSE:
#       • Accepted: submitter gets 1.5× stake back
#       • Rejected: voters-against share submitter stake
#       • Voters-for on rejected: lose their stake
# ============================================================

import json
from genlayer import *

MIN_STAKE  = u256(10)   # 10 GEN to submit
VOTE_STAKE = u256(5)    # 5 GEN to vote
DECIMALS   = u256(10 ** 18)


class SynapseConsensus(gl.Contract):
    """
    SynapseConsensus Intelligent Contract.

    GEN Escrow:
      submit_contribution(thread_id, ..., stake_gen)
        → caller sends stake_gen GEN (msg.value)
        → locked until thread finalized
      vote_on_contribution(thread_id, contrib_id, support, stake_gen)
        → caller sends stake_gen GEN
        → locked until thread finalized
      finalize_thread(thread_id)
        → AI scores contributions via gl.exec_prompt
        → distributes GEN + SYNAPSE rewards/penalties
      claim_rewards()
        → transfers pending GEN rewards to caller
    """

    # ── SYNAPSE Token ─────────────────────────────────────────
    synapse_balances: TreeMap[Address, u256]
    total_minted:     u256
    owner:            Address

    # ── Threads (JSON strings) ────────────────────────────────
    threads:      TreeMap[str, str]
    contributions: TreeMap[str, str]   # thread_id → JSON array
    votes:         TreeMap[str, str]   # "thread_id:contrib_id:voter" → JSON

    # ── GEN Escrow ────────────────────────────────────────────
    # Locked GEN per user (active stakes not yet resolved)
    escrow_locked:   TreeMap[Address, u256]
    # Claimable GEN per user (resolved rewards waiting for claim)
    escrow_pending:  TreeMap[Address, u256]

    def __init__(self) -> None:
        self.total_minted = u256(0)
        self.owner = gl.message.sender_account

    # ── Internal: SYNAPSE minting ─────────────────────────────

    def _mint_synapse(self, to: Address, amount: u256) -> None:
        max_supply = u256(10_000_000)
        if self.total_minted + amount > max_supply:
            return
        cur = self.synapse_balances.get(to, u256(0))
        self.synapse_balances[to] = cur + amount
        self.total_minted = self.total_minted + amount

    # ── Internal: Escrow helpers ──────────────────────────────

    def _lock_gen(self, addr: Address, amount: u256) -> None:
        cur = self.escrow_locked.get(addr, u256(0))
        self.escrow_locked[addr] = cur + amount

    def _unlock_gen(self, addr: Address, amount: u256) -> None:
        cur = self.escrow_locked.get(addr, u256(0))
        if cur >= amount:
            self.escrow_locked[addr] = cur - amount

    def _add_pending(self, addr: Address, amount: u256) -> None:
        cur = self.escrow_pending.get(addr, u256(0))
        self.escrow_pending[addr] = cur + amount

    # ── Internal: JSON helpers ────────────────────────────────

    def _get_thread(self, thread_id: str) -> dict:
        raw = self.threads.get(thread_id, "")
        assert raw, f"Thread not found: {thread_id}"
        return json.loads(raw)

    def _set_thread(self, thread_id: str, data: dict) -> None:
        self.threads[thread_id] = json.dumps(data)

    def _get_contributions(self, thread_id: str) -> list:
        raw = self.contributions.get(thread_id, "[]")
        return json.loads(raw)

    def _set_contributions(self, thread_id: str, data: list) -> None:
        self.contributions[thread_id] = json.dumps(data)

    def _get_votes(self, thread_id: str, contrib_id: str) -> list:
        key = f"{thread_id}:{contrib_id}"
        raw = self.votes.get(key, "[]")
        return json.loads(raw)

    def _set_votes(self, thread_id: str, contrib_id: str, data: list) -> None:
        key = f"{thread_id}:{contrib_id}"
        self.votes[key] = json.dumps(data)

    # ── LLM quality scoring ───────────────────────────────────

    def _score_contribution(self, claim: str, reasoning: str, evidence: str, title: str) -> u256:
        prompt = (
            f"You are evaluating a contribution in a structured decision thread.\n\n"
            f"Thread: \"{title}\"\n\n"
            f"Claim: {claim}\n"
            f"Reasoning: {reasoning}\n"
            f"Evidence: {evidence if evidence else '(none)'}\n\n"
            f"Score 0–100 based on:\n"
            f"- Clarity and specificity (0-30 pts)\n"
            f"- Quality of reasoning (0-40 pts)\n"
            f"- Strength of evidence (0-30 pts)\n\n"
            f"Reply ONLY with JSON: {{\"score\": <integer 0-100>}}"
        )

        def run_llm():
            result = gl.exec_prompt(prompt)
            try:
                parsed = json.loads(result.strip())
                score = int(parsed.get("score", 50))
                return json.dumps({"score": max(0, min(100, score))})
            except Exception:
                return json.dumps({"score": 50})

        raw = gl.eq_principle_strict_eq(run_llm)
        try:
            return u256(max(0, min(100, int(json.loads(raw).get("score", 50)))))
        except Exception:
            return u256(50)

    # ═══════════════════════════════════════════════════════════
    # WRITE FUNCTIONS
    # ═══════════════════════════════════════════════════════════

    @gl.public.write
    def create_thread(
        self,
        thread_id:   str,
        title:       str,
        category:    str,
        description: str,
    ) -> None:
        """Create a decision thread. Rewards creator 50 SYNAPSE."""
        assert not self.threads.get(thread_id, ""), "Thread already exists"
        assert len(title) > 0, "Title required"

        creator = gl.message.sender_account
        thread  = {
            "id": thread_id, "title": title,
            "description": description, "category": category,
            "creator": creator.as_hex,
            "consensus_score": 0, "status": "Open",
            "contribution_count": 0, "finalized": False,
        }
        self._set_thread(thread_id, thread)
        self._set_contributions(thread_id, [])
        self._mint_synapse(creator, u256(50))

    @gl.public.write
    def submit_contribution(
        self,
        thread_id:       str,
        contribution_id: str,
        claim:           str,
        reasoning:       str,
        evidence:        str,
        confidence:      int,
        sentiment:       str,
        agent_id:        str,
        stake_gen:       int,
    ) -> None:
        """
        Post a contribution.

        For human posts (agent_id == ""):
          • Caller must send stake_gen GEN as msg.value
          • Minimum stake: MIN_STAKE GEN
          • GEN locked in escrow until thread finalized
          • LLM scores quality; score ≥ 80 → +50 SYNAPSE bonus
          • Base reward: +25 SYNAPSE

        For AI agent posts (agent_id != ""):
          • No stake required, no GEN locked
        """
        thread   = self._get_thread(thread_id)
        is_human = agent_id == ""
        caller   = gl.message.sender_account

        assert len(claim) > 0, "Claim required"
        assert sentiment in ("support", "neutral", "oppose"), "Invalid sentiment"
        assert 0 <= confidence <= 100, "Confidence must be 0-100"
        assert not thread.get("finalized", False), "Thread is finalized"

        # Enforce GEN stake for human submissions
        if is_human:
            stake_u = u256(stake_gen)
            assert stake_u >= MIN_STAKE, f"Minimum stake is {int(MIN_STAKE)} GEN"
            # Record escrow lock
            self._lock_gen(caller, stake_u)

        # LLM quality score (human only)
        quality_score = 0
        if is_human:
            quality_score = int(self._score_contribution(
                claim=claim, reasoning=reasoning,
                evidence=evidence, thread_title=thread["title"],
            ))

        contrib = {
            "id":            contribution_id,
            "author":        caller.as_hex,
            "agent_id":      agent_id,
            "claim":         claim,
            "reasoning":     reasoning,
            "evidence":      evidence,
            "confidence":    confidence,
            "sentiment":     sentiment,
            "quality_score": quality_score,
            "stake_gen":     stake_gen if is_human else 0,
            "reward_paid":   False,
        }

        contribs = self._get_contributions(thread_id)
        contribs.append(contrib)
        self._set_contributions(thread_id, contribs)

        # Update thread
        thread["contribution_count"] = thread.get("contribution_count", 0) + 1
        if thread["status"] == "Open":
            thread["status"] = "In Discussion"
        self._set_thread(thread_id, thread)

        # SYNAPSE rewards for human
        if is_human:
            self._mint_synapse(caller, u256(25))
            if quality_score >= 80:
                self._mint_synapse(caller, u256(50))

    @gl.public.write
    def vote_on_contribution(
        self,
        thread_id:       str,
        contribution_id: str,
        support:         bool,
        stake_gen:       int,
    ) -> None:
        """
        Vote for or against a contribution.
        Caller must send stake_gen GEN as msg.value.
        Minimum: VOTE_STAKE GEN.
        Rewards: +5 SYNAPSE immediately.
        GEN is locked until finalize_thread resolves.
        """
        thread = self._get_thread(thread_id)
        assert not thread.get("finalized", False), "Thread already finalized"

        caller    = gl.message.sender_account
        stake_u   = u256(stake_gen)
        assert stake_u >= VOTE_STAKE, f"Minimum vote stake is {int(VOTE_STAKE)} GEN"

        # Check voter hasn't already voted on this contribution
        existing_votes = self._get_votes(thread_id, contribution_id)
        for v in existing_votes:
            assert v.get("voter") != caller.as_hex, "Already voted on this contribution"

        # Lock GEN
        self._lock_gen(caller, stake_u)

        # Record vote
        vote = {
            "voter":    caller.as_hex,
            "support":  support,
            "stake_gen": stake_gen,
        }
        existing_votes.append(vote)
        self._set_votes(thread_id, contribution_id, existing_votes)

        # Immediate SYNAPSE reward for participation
        self._mint_synapse(caller, u256(5))

    @gl.public.write
    def finalize_thread(self, thread_id: str) -> None:
        """
        Finalize a thread: score contributions, distribute GEN + SYNAPSE.

        Escrow resolution:
          For each contribution that was scored:
            • score ≥ 60 → ACCEPTED
                - Submitter gets back 1.5× their stake (0.5× bonus from losers)
                - Voters-FOR get back 1.2× their stake
                - Voters-AGAINST lose their stake (redistributed)
            • score < 40 → REJECTED
                - Submitter loses their stake
                - Voters-AGAINST get back 1.2× their stake
                - Voters-FOR lose their stake
            • 40 ≤ score < 60 → BORDERLINE
                - Everyone gets their original stake back (no profit/loss)
        """
        thread = self._get_thread(thread_id)
        caller = gl.message.sender_account
        assert caller.as_hex == thread["creator"] or caller == self.owner, "Unauthorized"
        assert not thread.get("finalized", False), "Already finalized"

        contribs = self._get_contributions(thread_id)

        for c in contribs:
            if c.get("agent_id"):
                continue  # Skip AI contributions

            author_addr = Address(c["author"])
            score       = c.get("quality_score", 50)
            stake       = u256(c.get("stake_gen", 0))
            votes       = self._get_votes(thread_id, c["id"])

            votes_for     = [v for v in votes if v.get("support")]
            votes_against = [v for v in votes if not v.get("support")]
            pool_against  = sum(v.get("stake_gen", 0) for v in votes_against)
            pool_for      = sum(v.get("stake_gen", 0) for v in votes_for)

            if score >= 60:
                # ── ACCEPTED ──────────────────────────────────
                # Submitter: 1.5× stake (capped by pool_against)
                bonus = min(int(stake) // 2, pool_against)
                self._unlock_gen(author_addr, stake)
                self._add_pending(author_addr, stake + u256(bonus))
                self._mint_synapse(author_addr, u256(100))

                # Voters FOR: 1.2× stake
                for v in votes_for:
                    vaddr = Address(v["voter"])
                    vstake = u256(v["stake_gen"])
                    reward = vstake + u256(int(vstake) // 5)
                    self._unlock_gen(vaddr, vstake)
                    self._add_pending(vaddr, reward)

                # Voters AGAINST: forfeit stake (already locked, just unlock)
                for v in votes_against:
                    vaddr  = Address(v["voter"])
                    vstake = u256(v["stake_gen"])
                    self._unlock_gen(vaddr, vstake)
                    # No pending added — they lose their stake

            elif score < 40:
                # ── REJECTED ──────────────────────────────────
                # Submitter: loses stake
                self._unlock_gen(author_addr, stake)
                # No pending → stake is redistributed to voters-against

                # Voters AGAINST: 1.2× stake + share of submitter stake
                share = int(stake) // max(len(votes_against), 1) if votes_against else 0
                for v in votes_against:
                    vaddr  = Address(v["voter"])
                    vstake = u256(v["stake_gen"])
                    reward = vstake + u256(int(vstake) // 5) + u256(share)
                    self._unlock_gen(vaddr, vstake)
                    self._add_pending(vaddr, reward)

                # Voters FOR: forfeit stake
                for v in votes_for:
                    vaddr  = Address(v["voter"])
                    vstake = u256(v["stake_gen"])
                    self._unlock_gen(vaddr, vstake)

            else:
                # ── BORDERLINE: everyone gets stake back ──────
                self._unlock_gen(author_addr, stake)
                self._add_pending(author_addr, stake)
                for v in votes:
                    vaddr  = Address(v["voter"])
                    vstake = u256(v["stake_gen"])
                    self._unlock_gen(vaddr, vstake)
                    self._add_pending(vaddr, vstake)

        # Mark finalized + update status
        thread["finalized"] = True
        thread["status"]    = "Consensus Reached"
        self._set_thread(thread_id, thread)

        # Reward creator
        self._unlock_gen(caller, u256(0))  # creator didn't stake
        self._mint_synapse(caller, u256(75))

    @gl.public.write
    def claim_rewards(self) -> None:
        """Transfer pending GEN rewards back to caller's wallet."""
        caller  = gl.message.sender_account
        pending = self.escrow_pending.get(caller, u256(0))
        assert pending > u256(0), "No rewards to claim"
        self.escrow_pending[caller] = u256(0)
        # Native GEN transfer — handled by GenLayer runtime
        gl.message.transfer(caller, pending * DECIMALS)

    @gl.public.write
    def update_consensus(self, thread_id: str, new_score: int) -> None:
        """Update consensus score. Called by app after recalculating client-side."""
        thread = self._get_thread(thread_id)
        caller = gl.message.sender_account
        assert caller.as_hex == thread["creator"] or caller == self.owner, "Unauthorized"
        assert 0 <= new_score <= 100, "Score out of range"
        thread["consensus_score"] = new_score
        if new_score >= 70:
            thread["status"] = "Consensus Reached"
        elif thread.get("contribution_count", 0) > 0:
            thread["status"] = "In Discussion"
        self._set_thread(thread_id, thread)

    @gl.public.write
    def transfer_synapse(self, to_address: str, amount: int) -> None:
        """Transfer SYNAPSE tokens."""
        sender = gl.message.sender_account
        bal    = self.synapse_balances.get(sender, u256(0))
        assert bal >= u256(amount), "Insufficient SYNAPSE"
        self.synapse_balances[sender] = bal - u256(amount)
        self._mint_synapse(Address(to_address), u256(amount))

    # ═══════════════════════════════════════════════════════════
    # VIEW FUNCTIONS
    # ═══════════════════════════════════════════════════════════

    @gl.public.view
    def get_thread(self, thread_id: str) -> str:
        raw = self.threads.get(thread_id, "")
        assert raw, "Thread not found"
        return raw

    @gl.public.view
    def get_contributions(self, thread_id: str) -> str:
        return self.contributions.get(thread_id, "[]")

    @gl.public.view
    def get_votes(self, thread_id: str, contribution_id: str) -> str:
        key = f"{thread_id}:{contribution_id}"
        return self.votes.get(key, "[]")

    @gl.public.view
    def get_synapse_balance(self, address: str) -> u256:
        return self.synapse_balances.get(Address(address), u256(0))

    @gl.public.view
    def get_escrow_locked(self, address: str) -> u256:
        """GEN currently locked in active stakes (not yet resolved)."""
        return self.escrow_locked.get(Address(address), u256(0))

    @gl.public.view
    def get_escrow_pending(self, address: str) -> u256:
        """GEN rewards resolved and waiting to be claimed."""
        return self.escrow_pending.get(Address(address), u256(0))

    @gl.public.view
    def get_escrow_info(self, address: str) -> str:
        """Returns locked + pending as JSON."""
        locked  = int(self.escrow_locked.get(Address(address),  u256(0)))
        pending = int(self.escrow_pending.get(Address(address), u256(0)))
        return json.dumps({
            "locked":  locked,
            "pending": pending,
            "total":   locked + pending,
        })

    @gl.public.view
    def get_total_minted(self) -> u256:
        return self.total_minted

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner.as_hex
