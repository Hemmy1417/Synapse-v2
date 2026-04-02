"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { EditThreadModal } from "@/components/threads/EditThreadModal";
import useStore from "@/store/useStore";

function ConsensusArc({ score }) {
  const color = score >= 60 ? "#3DD68C" : score >= 35 ? "#C8943A" : "#E85858";
  const r = 10, cx = 13, cy = 13;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="26" height="26" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)" }} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="6" fontFamily="var(--font-mono)" fontWeight="500">
        {score}
      </text>
    </svg>
  );
}

export function ThreadCard({ thread, isActive, onClick }) {
  const router       = useRouter();
  const contributions = useStore((s) => s.contributions[thread.id] || []);
  const editThread   = useStore((s) => s.editThread);
  const deleteThread = useStore((s) => s.deleteThread);
  const cat = CATEGORIES[thread.category] || { label: thread.category, color: "#5C738A" };

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [showEdit,    setShowEdit]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hovered,     setHovered]     = useState(false);

  const handleDelete = () => {
    deleteThread(thread.id);
    setShowConfirm(false);
    router.push("/");
  };

  const handleSave = (updates) => {
    editThread(thread.id, updates);
    setShowEdit(false);
  };

  return (
    <>
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); }}
        style={{
          padding: "11px 12px 11px 14px",
          borderRadius: 10, marginBottom: 3,
          cursor: "pointer", position: "relative",
          background: isActive ? "rgba(77,126,255,0.07)" : hovered ? "rgba(255,255,255,0.03)" : "transparent",
          border: `1px solid ${isActive ? "rgba(77,126,255,0.22)" : "transparent"}`,
          transition: "all 0.15s ease", overflow: "visible",
        }}
      >
        {/* Left accent stripe */}
        {isActive && (
          <div style={{
            position: "absolute", left: 0, top: "20%", bottom: "20%",
            width: 2, borderRadius: "0 2px 2px 0",
            background: "linear-gradient(to bottom, #4D7EFF, rgba(77,126,255,0.3))",
          }} />
        )}

        {/* Category + consensus arc + options button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{
            fontSize: 9, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase",
            color: cat.color, padding: "2px 7px",
            background: cat.color + "15", border: `1px solid ${cat.color}30`, borderRadius: 4,
          }}>{cat.label}</span>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <ConsensusArc score={thread.consensusScore} />

            {/* ⋯ options button — visible on hover or when menu open */}
            {(hovered || menuOpen) && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                  style={{
                    width: 22, height: 22, borderRadius: 5,
                    background: menuOpen ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)", fontSize: 13, lineHeight: 1,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  ⋯
                </button>

                {menuOpen && (
                  <>
                    <div
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                      style={{ position: "fixed", inset: 0, zIndex: 98 }}
                    />
                    <div style={{
                      position: "absolute", right: 0, top: "calc(100% + 4px)",
                      background: "var(--bg-panel)",
                      border: "1px solid rgba(77,126,255,0.2)",
                      borderRadius: 10, overflow: "hidden", zIndex: 99,
                      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                      minWidth: 140,
                      animation: "slideUp 0.15s ease",
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowEdit(true); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          width: "100%", padding: "10px 14px",
                          background: "transparent", border: "none",
                          color: "var(--text-primary)", fontSize: 13,
                          fontFamily: "var(--font-body)", cursor: "pointer", textAlign: "left",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        ✏️ Edit
                      </button>
                      <div style={{ height: 1, background: "var(--border)", margin: "0 10px" }} />
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowConfirm(true); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          width: "100%", padding: "10px 14px",
                          background: "transparent", border: "none",
                          color: "#E85858", fontSize: 13,
                          fontFamily: "var(--font-body)", cursor: "pointer", textAlign: "left",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232,88,88,0.06)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 12, fontWeight: 500, lineHeight: 1.45,
          color: isActive ? "var(--text-primary)" : "#8A9EBD",
          marginBottom: 8,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {thread.title}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {contributions.length} contrib{contributions.length !== 1 ? "s" : ""}
          </span>
          <span style={{
            fontSize: 9, letterSpacing: "0.06em",
            color: thread.status === "Consensus Reached" ? "#3DD68C"
                 : thread.status === "In Discussion"     ? "#C8943A"
                 : "var(--text-muted)",
          }}>
            {thread.status === "Consensus Reached" ? "✓ Consensus" :
             thread.status === "In Discussion"     ? "● Active" : "○ Open"}
          </span>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <EditThreadModal
          thread={thread}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm modal */}
      {showConfirm && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(4,6,12,0.85)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div style={{
            background: "var(--bg-panel)", border: "1px solid rgba(232,88,88,0.25)",
            borderRadius: 16, padding: 28, width: 400, maxWidth: "100%",
            animation: "slideUp 0.2s ease", boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>🗑️</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text-primary)", marginBottom: 10, textAlign: "center" }}>
              Delete this thread?
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, textAlign: "center", marginBottom: 22 }}>
              <strong style={{ color: "var(--text-secondary)" }}>{thread.title}</strong>
              <br />
              All contributions will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1, padding: "10px 0", background: "#E85858",
                  border: "none", borderRadius: 9, color: "#fff",
                  fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: "10px 0", background: "transparent",
                  border: "1px solid var(--border)", borderRadius: 9,
                  color: "var(--text-muted)", fontSize: 14,
                  fontFamily: "var(--font-body)", cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
