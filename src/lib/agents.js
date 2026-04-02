import { AGENTS } from "./constants";

// ─── Build agent prompt ───────────────────────────────────────────────────────
function buildAgentPrompt(agent, thread, existingContributions) {
  const recentContext = existingContributions
    .slice(-5)
    .map((c) => {
      const name = c.agentId ? AGENTS[c.agentId]?.name : c.author;
      return `${name} (${c.sentiment}, ${c.confidence}% confidence): "${c.claim}"`;
    })
    .join("\n");

  return `You are participating in a structured decision-making thread on Synapse, an AI-human collaboration platform.

Thread Title: "${thread.title}"
Thread Description: "${thread.description}"

${recentContext ? `Recent contributions from other participants:\n${recentContext}\n` : "This is the opening of the discussion — no prior contributions."}

${agent.systemPrompt}

CRITICAL: Respond ONLY with a valid JSON object. No markdown fences, no preamble, no explanation. Just the JSON.

The JSON must have exactly these fields:
{
  "claim": "Your core assertion in 1–2 clear sentences.",
  "reasoning": "Your reasoning in 2–4 sentences. Reference or challenge specific prior points if they exist.",
  "evidence": "A specific study, statistic, historical event, or expert reference. Empty string if none.",
  "confidence": <integer between 30 and 95>,
  "sentiment": "<support|oppose|neutral>"
}`;
}

// ─── Call a single agent via the API route ────────────────────────────────────
export async function callAgent(agentId, thread, existingContributions) {
  const agent = AGENTS[agentId];
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);

  const response = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildAgentPrompt(agent, thread, existingContributions),
      agentId,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Agent call failed");
  }

  const data = await response.json();
  return {
    ...data,
    confidence: Math.min(95, Math.max(10, Number(data.confidence) || 60)),
  };
}

// ─── Select agents to respond ─────────────────────────────────────────────────
/**
 * Given existing contributions, choose which agents should respond.
 * Prioritize agents that haven't spoken recently.
 */
export function selectRespondingAgents(existingContributions, count = 3) {
  const agentKeys = Object.keys(AGENTS);
  const recentAgents = new Set(
    existingContributions.slice(-4).map((c) => c.agentId).filter(Boolean)
  );
  // Prefer agents that haven't spoken recently
  const preferred = agentKeys.filter((k) => !recentAgents.has(k));
  const others    = agentKeys.filter((k) =>  recentAgents.has(k));
  const pool = [...preferred, ...others];
  // Shuffle and pick
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// ─── Run a wave of agent responses ───────────────────────────────────────────
/**
 * Sequentially runs agents and yields each contribution via onContribution callback.
 * @param {string[]} agentIds
 * @param {object} thread
 * @param {object[]} baseContributions
 * @param {(agentId: string, contribution: object) => void} onContribution
 * @param {(agentId: string, active: boolean) => void} onLoadingChange
 */
export async function runAgentWave({
  agentIds,
  thread,
  baseContributions,
  onContribution,
  onLoadingChange,
  delayMs = 700,
}) {
  const runningContribs = [...baseContributions];

  for (const agentId of agentIds) {
    onLoadingChange(agentId, true);
    try {
      const result = await callAgent(agentId, thread, runningContribs);
      const contrib = { ...result, agentId };
      runningContribs.push(contrib);
      onContribution(agentId, contrib);
    } catch (e) {
      console.error(`Agent ${agentId} failed:`, e);
    } finally {
      onLoadingChange(agentId, false);
    }
    // Stagger agents so responses don't flood at once
    await new Promise((r) => setTimeout(r, delayMs));
  }
}
