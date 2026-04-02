"use client";

import { AGENTS, SENTIMENTS } from "@/lib/constants";
import { consensusColor, consensusLabel, avgConfidence, sentimentCounts } from "@/lib/utils";
import useStore from "@/store/useStore";
import { TokenIncentivesPanel } from "@/components/tokens/TokenIncentivesPanel";
import { EscrowPanel } from "@/components/wallet/EscrowPanel";

function RadialScore({ score }) {
  const color  = score >= 60 ? "#3DD68C" : score >= 35 ? "#C8943A" : "#E85858";
  const r = 38, cx = 46, cy = 46;
  const circ = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  const label = score >= 70 ? "Strong" : score >= 50 ? "Partial" : score >= 35 ? "Contested" : "Divided";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0" }}>
      <svg width="92" height="92">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        {/* Progress */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1), stroke 0.5s" }}
          filter={`drop-shadow(0 0 6px ${color}55)`}
        />
        {/* Score text */}
        <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="20" fontFamily="var(--font-mono)" fontWeight="500">{score}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="8" fontFamily="var(--font-body)" opacity="0.7">%</text>
      </svg>
      <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>Consensus</div>
    </div>
  );
}

const SectionTitle = ({ children }) => (
  <div style={{
    fontSize: 9, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.14em",
    marginBottom: 10, fontWeight: 600,
  }}>{children}</div>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "rgba(255,255,255,0.02)",
    border: "1px solid var(--border)",
    borderRadius: 12, padding: "13px 14px", ...style,
  }}>{children}</div>
);

export function ConsensusPanel({ thread, onRefreshSummary }) {
  const contributions = useStore((s) => s.contributions[thread.id] || []);
  const summary       = useStore((s) => s.summaries[thread.id]);
  const agentLoading  = useStore((s) => s.agentLoading);
  const isAnyLoading  = Object.values(agentLoading).some(Boolean);

  const counts  = sentimentCounts(contributions);
  const avgConf = avgConfidence(contributions);
  const score   = thread.consensusScore;

  return (
    <div style={{
      width: 280, minWidth: 280, flexShrink: 0,
      maxWidth: "100%",
      background: "var(--bg-panel)",
      borderLeft: "1px solid var(--border)",
      overflowY: "auto", padding: "16px 14px",
      display: "flex", flexDirection: "column", gap: 18,
    }}>

      {/* ── Consensus Score ── */}
      <div>
        <SectionTitle>Consensus Engine</SectionTitle>
        <Card>
          <RadialScore score={score} />
          {/* Sentiment breakdown */}
          <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
            {Object.entries(SENTIMENTS).map(([key, s]) => (
              <div key={key} style={{
                flex: 1, textAlign: "center", padding: "8px 0",
                background: s.color + "10", borderRadius: 8,
                border: `1px solid ${s.color}20`,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "var(--font-mono)" }}>
                  {counts[key]}
                </div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Stats ── */}
      <div>
        <SectionTitle>Thread Stats</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            ["Contributions", contributions.length],
            ["Avg Confidence", avgConf ? `${avgConf}%` : "—"],
            ["Human",  contributions.filter(c => !c.agentId).length],
            ["AI",     contributions.filter(c =>  c.agentId).length],
          ].map(([label, val]) => (
            <div key={label} style={{
              padding: "9px 11px",
              background: "rgba(255,255,255,0.025)",
              borderRadius: 9, border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{val}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Agent Activity ── */}
      <div>
        <SectionTitle>Agent Activity</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {Object.values(AGENTS).map((agent) => {
            const ac   = contributions.filter(c => c.agentId === agent.id);
            const conf = ac.length ? Math.round(ac.reduce((s,c) => s + c.confidence, 0) / ac.length) : 0;
            const busy = agentLoading[agent.id];
            return (
              <div key={agent.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 10px",
                background: agent.bgColor,
                border: `1px solid ${busy ? agent.color : agent.borderColor}`,
                borderRadius: 9, transition: "all 0.3s",
                boxShadow: busy ? `0 0 12px ${agent.glowColor}` : "none",
              }}>
                <span style={{ color: agent.color, fontSize: 14 }}>{agent.symbol}</span>
                <span style={{ flex: 1, fontSize: 12, color: agent.color, fontWeight: 500 }}>{agent.name}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {ac.length}
                </span>
                {conf > 0 && <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{conf}%</span>}
                {busy && <div style={{ width: 5, height: 5, borderRadius: "50%", background: agent.color, animation: "pulse 1.1s infinite" }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI Summary ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SectionTitle>AI Summary</SectionTitle>
          <button onClick={onRefreshSummary}
            disabled={contributions.length === 0 || isAnyLoading}
            style={{
              padding: "3px 10px", fontSize: 10, borderRadius: 6, fontFamily: "var(--font-body)",
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--text-muted)", opacity: contributions.length === 0 || isAnyLoading ? 0.4 : 1,
              transition: "all 0.15s",
            }}>
            ↻ Refresh
          </button>
        </div>
        {summary ? (
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Current State",     summary.currentState,  "#4D7EFF"],
                ["Strongest For",     summary.keyFor,        "#3DD68C"],
                ["Strongest Against", summary.keyAgainst,    "#E85858"],
                ["Open Question",     summary.openQuestions, "#C8943A"],
                ["Next Steps",        summary.nextSteps,     "#7C6FCD"],
                summary.minorityView ? ["Minority View", summary.minorityView, "#E887C8"] : null,
              ].filter(Boolean).map(([label, text, accent]) => text && (
                <div key={label} style={{ borderLeft: `2px solid ${accent}40`, paddingLeft: 10 }}>
                  <div style={{ fontSize: 9, color: accent, textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 3, fontWeight: 600 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{text}</div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <div style={{ textAlign: "center", padding: "8px 0", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {contributions.length === 0
                ? "Summary appears as contributions arrive."
                : "Click Refresh to generate an AI summary."}
            </div>
          </Card>
        )}
      </div>

      {/* ── GEN Escrow ── */}
      <div>
        <SectionTitle>GEN Escrow</SectionTitle>
        <EscrowPanel />
      </div>

      {/* ── Token Incentives ── */}
      <div>
        <SectionTitle>Token Incentives</SectionTitle>
        <TokenIncentivesPanel />
      </div>
    </div>
  );
}
