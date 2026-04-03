"use client";

import { useState } from "react";
import { SENTIMENTS } from "@/lib/constants";
import { useWallet } from "@/hooks/useWallet";

const DEFAULT = { claim: "", reasoning: "", evidence: "", confidence: 70, sentiment: "neutral" };

export function ContributionForm({ onSubmit, disabled, autoOpen = false }) {
  const [open,    setOpen]    = useState(autoOpen);
  const [form,    setForm]    = useState(DEFAULT);
  const [errs,    setErrs]    = useState({});
  const [success, setSuccess] = useState(false);
  const { isConnected, address } = useWallet();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

  const submit = () => {
    const e = {};
    if (!form.claim.trim())     e.claim     = true;
    if (!form.reasoning.trim()) e.reasoning = true;
    if (Object.keys(e).length) { setErrs(e); return; }
    onSubmit({ ...form, author: address || "You", stakeGEN: 0 });
    setForm(DEFAULT); setErrs({}); setOpen(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3500);
  };

  if (success) return (
    <div style={{
      width: "100%", padding: "16px 20px",
      background: "rgba(61,214,140,0.08)",
      border: "1px solid rgba(61,214,140,0.3)",
      borderRadius: 12, display: "flex", alignItems: "center", gap: 12,
      animation: "slideUp 0.25s ease",
    }}>
      <span style={{ fontSize: 22 }}>✓</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#3DD68C" }}>Contribution submitted!</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          AI agents are reviewing your input…
        </div>
      </div>
    </div>
  );

  if (!open) return (
    <button onClick={() => !disabled && setOpen(true)} style={{
      width: "100%", padding: "14px 0",
      background: "rgba(77,126,255,0.06)", border: "1px dashed rgba(77,126,255,0.25)",
      borderRadius: 12, color: "#4D7EFF", fontSize: 15, fontWeight: 500,
      fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      opacity: disabled ? 0.4 : 1, transition: "all 0.15s",
    }}
    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderStyle = "solid"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderStyle = "dashed"; }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
      {disabled ? "Agents are reasoning…" : "Add your contribution"}
    </button>
  );

  return (
    <div style={{ background: "rgba(77,126,255,0.05)", border: "1px solid rgba(77,126,255,0.2)", borderRadius: 14, padding: "20px", animation: "slideUp 0.25s ease" }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: errs.claim ? "var(--red)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>
          Claim {errs.claim && "— required"}
        </label>
        <input value={form.claim} onChange={set("claim")} autoFocus placeholder="Your core assertion in one or two sentences."
          className="form-input" style={{ height: 46, border: errs.claim ? "1px solid rgba(232,88,88,0.5)" : "1px solid var(--border)", borderRadius: 9, width: "100%", padding: "11px 14px", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 15, fontFamily: "var(--font-body)", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: errs.reasoning ? "var(--red)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>
          Reasoning {errs.reasoning && "— required"}
        </label>
        <textarea value={form.reasoning} onChange={set("reasoning")} rows={3}
          placeholder="Why do you believe this? Challenge or build on prior arguments."
          style={{ width: "100%", padding: "11px 14px", background: "var(--bg-input)", border: errs.reasoning ? "1px solid rgba(232,88,88,0.5)" : "1px solid var(--border)", borderRadius: 9, color: "var(--text-primary)", fontSize: 15, fontFamily: "var(--font-body)", resize: "vertical", boxSizing: "border-box", lineHeight: 1.55 }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>
          Evidence <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— optional</span>
        </label>
        <input value={form.evidence} onChange={set("evidence")} placeholder="A study, statistic, or example…"
          style={{ width: "100%", height: 46, padding: "11px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text-primary)", fontSize: 15, fontFamily: "var(--font-body)", boxSizing: "border-box" }}
        />
      </div>

      {/* Confidence + Sentiment row */}
      <div style={{ display: "flex", gap: 20, marginBottom: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>Confidence — {form.confidence}%</label>
          <input type="range" min={5} max={99} step={1} value={form.confidence} onChange={(e) => setForm((f) => ({ ...f, confidence: +e.target.value }))} style={{ width: "100%", accentColor: "#4D7EFF" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>Sentiment</label>
          <div style={{ display: "flex", gap: 7 }}>
            {Object.entries(SENTIMENTS).map(([key, s]) => (
              <button key={key} onClick={() => setForm((f) => ({ ...f, sentiment: key }))} style={{
                padding: "7px 14px", fontSize: 14, borderRadius: 22, fontFamily: "var(--font-body)", fontWeight: 500, transition: "all 0.12s",
                background: form.sentiment === key ? s.color + "18" : "transparent",
                border: `1px solid ${form.sentiment === key ? s.color + "55" : "var(--border)"}`,
                color: form.sentiment === key ? s.color : "var(--text-muted)",
              }}>{s.symbol} {s.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={submit} style={{ flex: 1, padding: "12px 0", background: "#4D7EFF", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-body)", transition: "opacity 0.15s" }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          Submit {isConnected ? `+ Stake ${form.stake} GEN` : "(no wallet)"}
        </button>
        <button onClick={() => { setOpen(false); setForm(DEFAULT); setErrs({}); }} style={{ padding: "12px 18px", background: "transparent", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 15, fontFamily: "var(--font-body)" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}