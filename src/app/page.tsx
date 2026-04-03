"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/nav/Navbar";
import { CreateThreadModal } from "@/components/threads/CreateThreadModal";
import useStore from "@/store/useStore";
import { CATEGORIES, SENTIMENTS } from "@/lib/constants";
import { useWallet } from "@/hooks/useWallet";

/* ── Quick Contribute Modal ───────────────────────── */
function ContributeModal({ thread, onClose }) {
  const addContrib = useStore((s) => s.addContribution);
  const { address, isConnected } = useWallet();
  const router = useRouter();
  const [claim,      setClaim]      = useState("");
  const [reasoning,  setReasoning]  = useState("");
  const [sentiment,  setSentiment]  = useState("neutral");
  const [confidence, setConfidence] = useState(70);
  const [submitted,  setSubmitted]  = useState(false);
  const [errs,       setErrs]       = useState<Record<string, boolean>>({});

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!claim.trim())     e.claim     = true;
    if (!reasoning.trim()) e.reasoning = true;
    if (Object.keys(e).length) { setErrs(e); return; }
    addContrib(thread.id, {
      claim, reasoning, evidence: "", confidence, sentiment,
      author: address || "You", stakeGEN: 0,
    });
    setSubmitted(true);
    setTimeout(() => { onClose(); router.push(`/threads/${thread.id}`); }, 1800);
  };

  const inp = {
    width: "100%", padding: "11px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border)", borderRadius: 9,
    color: "var(--text-primary)", fontSize: 15,
    fontFamily: "var(--font-body)", boxSizing: "border-box",
  };
  const lbl = {
    display: "block", fontSize: 11, fontWeight: 600,
    color: "var(--text-muted)", textTransform: "uppercase",
    letterSpacing: "0.1em", marginBottom: 7,
  };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(4,6,12,0.85)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "var(--bg-panel)", border: "1px solid rgba(77,126,255,0.22)",
        borderRadius: 18, padding: 28, width: 540, maxWidth: "100%",
        animation: "slideUp 0.25s ease", boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#3DD68C", marginBottom: 6 }}>Contribution submitted!</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Redirecting to thread for AI agent responses…</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: 4 }}>
                  Submit Contribution
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 380 }}>
                  {thread.title.length > 60 ? thread.title.slice(0, 60) + "…" : thread.title}
                </div>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ ...lbl, color: errs.claim ? "var(--red)" : "var(--text-muted)" }}>
                Claim {errs.claim && "— required"}
              </label>
              <input value={claim} onChange={(e) => setClaim(e.target.value)} autoFocus
                placeholder="Your core assertion in one or two sentences."
                style={{ ...inp, border: errs.claim ? "1px solid rgba(232,88,88,0.5)" : "1px solid var(--border)", height: 46 }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ ...lbl, color: errs.reasoning ? "var(--red)" : "var(--text-muted)" }}>
                Reasoning {errs.reasoning && "— required"}
              </label>
              <textarea value={reasoning} onChange={(e) => setReasoning(e.target.value)} rows={3}
                placeholder="Why do you believe this?"
                style={{ ...inp, border: errs.reasoning ? "1px solid rgba(232,88,88,0.5)" : "1px solid var(--border)", resize: "vertical", lineHeight: 1.55 }}
              />
            </div>

            <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={lbl}>Confidence — {confidence}%</label>
                <input type="range" min={5} max={99} value={confidence}
                  onChange={(e) => setConfidence(+e.target.value)}
                  style={{ width: "100%", accentColor: "#4D7EFF" }}
                />
              </div>
              <div>
                <label style={lbl}>Sentiment</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(SENTIMENTS).map(([key, s]) => (
                    <button key={key} onClick={() => setSentiment(key)} style={{
                      padding: "6px 12px", fontSize: 13, borderRadius: 20,
                      fontFamily: "var(--font-body)", fontWeight: 500, transition: "all 0.12s",
                      background: sentiment === key ? s.color + "18" : "transparent",
                      border: `1px solid ${sentiment === key ? s.color + "55" : "var(--border)"}`,
                      color: sentiment === key ? s.color : "var(--text-muted)",
                    }}>{s.symbol} {s.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={submit} style={{
                flex: 1, padding: "12px 0", background: "#4D7EFF",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 15, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
              }}>
                Submit Contribution
              </button>
              <button onClick={onClose} style={{
                padding: "12px 18px", background: "transparent",
                border: "1px solid var(--border)", borderRadius: 10,
                color: "var(--text-muted)", fontSize: 15, fontFamily: "var(--font-body)", cursor: "pointer",
              }}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Homepage ─────────────────────────────────────── */
export default function HomePage() {
  const router        = useRouter();
  const threads       = useStore((s) => s.threads) || [];
  const contributions = useStore((s) => s.contributions) || {};
  const createThread  = useStore((s) => s.createThread);
  const { onChainCreateThread } = useWallet();

  const [search,           setSearch]           = useState("");
  const [showCreate,       setShowCreate]        = useState(false);
  const [contributeThread, setContributeThread]  = useState(null);

  const filtered = threads.filter((t) =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (data) => {
    const thread = createThread(data);
    onChainCreateThread?.(thread.id, thread.title, thread.category).catch(() => {});
    router.push(`/threads/${thread.id}`);
  };

  return (
    <>
      <Navbar />

      <div style={{
        minHeight: "calc(100dvh - var(--navbar-h))",
        background: "var(--bg-base)",
        padding: "40px 32px 80px",
      }}>

        {/* Hero header */}
        <div style={{ marginBottom: 40, maxWidth: 800 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px",
            background: "rgba(61,214,140,0.07)",
            border: "1px solid rgba(61,214,140,0.2)",
            borderRadius: 20, fontSize: 13, color: "#3DD68C",
            fontFamily: "var(--font-mono)", marginBottom: 20,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#3DD68C", animation: "pulse 2s ease-in-out infinite",
              display: "inline-block",
            }} />
            {threads.length} Active Thread{threads.length !== 1 ? "s" : ""}
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 5.5vw, 68px)",
            color: "var(--text-primary)",
            lineHeight: 1.1, marginBottom: 16,
          }}>
            Decision Intelligence
          </h1>

          <p style={{
            fontSize: "clamp(15px, 1.8vw, 19px)",
            color: "var(--text-muted)", lineHeight: 1.7,
            maxWidth: 640, marginBottom: 28,
          }}>
            Humans and intelligent agents collaborate as equal participants to analyze information, reason through problems, and reach transparent consensus.
          </p>

          {/* Search + create row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search threads…"
              style={{
                flex: 1, minWidth: 200, maxWidth: 400, padding: "12px 18px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)", borderRadius: 12,
                color: "var(--text-primary)", fontSize: 15,
                fontFamily: "var(--font-body)",
              }}
            />
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: "12px 22px", background: "#4D7EFF", border: "none",
                borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 600,
                fontFamily: "var(--font-body)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
              }}
            >
              + New Thread
            </button>
          </div>
        </div>

        {/* Thread grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 64, opacity: 0.06, fontFamily: "var(--font-display)", marginBottom: 16 }}>◈</div>
            <p style={{ fontSize: 18, marginBottom: 16 }}>No threads yet.</p>
            <button onClick={() => setShowCreate(true)} style={{
              padding: "12px 28px", background: "#4D7EFF", border: "none",
              borderRadius: 12, color: "#fff", fontSize: 16, fontWeight: 600,
              fontFamily: "var(--font-body)", cursor: "pointer",
            }}>
              Create the first thread
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}>
            {filtered.map((thread) => {
              const cat = CATEGORIES[thread.category] || { label: thread.category, color: "#5C738A" };
              const contribs = (contributions[thread.id] || []).length;
              const score = thread.consensusScore || 0;
              const scoreColor = score >= 60 ? "#3DD68C" : score >= 35 ? "#C8943A" : "#E85858";
              const isConsensus = thread.status === "Consensus Reached";

              return (
                <div
                  key={thread.id}
                  style={{
                    background: "var(--bg-panel)",
                    border: `1px solid ${isConsensus ? "rgba(61,214,140,0.2)" : "var(--border)"}`,
                    borderRadius: 18, padding: "24px 24px 20px",
                    display: "flex", flexDirection: "column", gap: 12,
                    minHeight: 200, transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(77,126,255,0.35)";
                    e.currentTarget.style.boxShadow = "0 8px 40px rgba(77,126,255,0.09)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isConsensus ? "rgba(61,214,140,0.2)" : "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Category + status */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", padding: "4px 12px", borderRadius: 6,
                      background: cat.color + "18", color: cat.color,
                      border: `1px solid ${cat.color}30`,
                    }}>
                      {cat.label}
                    </span>
                    <span style={{
                      fontSize: 12, padding: "4px 12px", borderRadius: 20, fontWeight: 600,
                      background: isConsensus ? "rgba(61,214,140,0.1)" : "rgba(200,148,58,0.1)",
                      color: isConsensus ? "#3DD68C" : "#C8943A",
                      border: `1px solid ${isConsensus ? "rgba(61,214,140,0.25)" : "rgba(200,148,58,0.25)"}`,
                    }}>
                      {isConsensus ? "✓ Consensus" : "● Active"}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    onClick={() => router.push(`/threads/${thread.id}`)}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(18px, 2vw, 24px)",
                      color: "var(--text-primary)", lineHeight: 1.3,
                      flex: 1, cursor: "pointer",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => { e.target.style.color = "#4D7EFF"; }}
                    onMouseLeave={(e) => { e.target.style.color = "var(--text-primary)"; }}
                  >
                    {thread.title}
                  </h2>

                  {/* Description */}
                  {thread.description && (
                    <p style={{
                      fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {thread.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: 12, borderTop: "1px solid var(--border)", marginTop: "auto",
                    gap: 10, flexWrap: "wrap",
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {contribs} contrib{contribs !== 1 ? "s" : ""}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 52, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                          <div style={{ width: `${score}%`, height: "100%", background: scoreColor, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 12, color: scoreColor, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{score}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setContributeThread(thread)}
                        style={{
                          padding: "6px 14px", fontSize: 12, fontWeight: 600,
                          background: "rgba(77,126,255,0.1)",
                          border: "1px solid rgba(77,126,255,0.25)",
                          borderRadius: 8, color: "#4D7EFF",
                          fontFamily: "var(--font-body)", cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(77,126,255,0.2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(77,126,255,0.1)"; }}
                      >
                        + Contribute
                      </button>
                      <button
                        onClick={() => router.push(`/threads/${thread.id}`)}
                        style={{
                          padding: "6px 14px", fontSize: 12, fontWeight: 600,
                          background: "transparent", border: "1px solid var(--border)",
                          borderRadius: 8, color: "var(--text-muted)",
                          fontFamily: "var(--font-body)", cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-mid)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateThreadModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {contributeThread && (
        <ContributeModal thread={contributeThread} onClose={() => setContributeThread(null)} />
      )}
    </>
  );
}