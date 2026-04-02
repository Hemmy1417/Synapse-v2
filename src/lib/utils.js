import { clsx } from "clsx";

// ─── Class name helper ────────────────────────────────────────────────────────
export function cn(...inputs) {
  return clsx(inputs);
}

// ─── Time formatting ──────────────────────────────────────────────────────────
export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60)   return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── ID generation ────────────────────────────────────────────────────────────
export function generateId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Consensus calculation ────────────────────────────────────────────────────
/**
 * Calculate a consensus score (0–100) from an array of contributions.
 * Weight: confidence × sentiment direction.
 */
export function calcConsensusScore(contributions) {
  if (!contributions.length) return 0;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const c of contributions) {
    const direction = c.sentiment === "support" ? 1 : c.sentiment === "oppose" ? -1 : 0;
    const weight = c.confidence / 100;
    weightedSum += direction * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return 50;
  // Normalize to 0–100 where 50 = neutral
  const normalized = (weightedSum / totalWeight + 1) / 2;
  return Math.round(normalized * 100);
}

// ─── Sentiment counts ─────────────────────────────────────────────────────────
export function sentimentCounts(contributions) {
  return {
    support: contributions.filter((c) => c.sentiment === "support").length,
    neutral: contributions.filter((c) => c.sentiment === "neutral").length,
    oppose:  contributions.filter((c) => c.sentiment === "oppose").length,
  };
}

// ─── Average confidence ───────────────────────────────────────────────────────
export function avgConfidence(contributions) {
  if (!contributions.length) return 0;
  const sum = contributions.reduce((acc, c) => acc + c.confidence, 0);
  return Math.round(sum / contributions.length);
}

// ─── Consensus label ──────────────────────────────────────────────────────────
export function consensusLabel(score) {
  if (score >= 70) return "Strong Consensus";
  if (score >= 50) return "Partial Consensus";
  if (score >= 35) return "Contested";
  return "Deep Disagreement";
}

// ─── Consensus color ──────────────────────────────────────────────────────────
export function consensusColor(score) {
  if (score >= 60) return "#52D68A";
  if (score >= 35) return "#FFB347";
  return "#FF6B6B";
}

// ─── Truncate text ────────────────────────────────────────────────────────────
export function truncate(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
}
