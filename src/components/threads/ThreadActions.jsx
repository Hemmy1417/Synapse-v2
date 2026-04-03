"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditThreadModal } from "@/components/threads/EditThreadModal";
import useStore from "@/store/useStore";

export function ThreadActions({ thread }) {
  const router       = useRouter();
  const editThread   = useStore((s) => s.editThread);
  const deleteThread = useStore((s) => s.deleteThread);

  const [showEdit,    setShowEdit]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  const handleSave = (updates) => {
    editThread(thread.id, updates);
    setShowEdit(false);
  };

  const handleDelete = () => {
    deleteThread(thread.id);
    router.push("/");
  };

  return (
    <>
      <div style={{ position: "relative" }}>
        {/* Button — shows ⋯ and "Options" label */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 14px",
            background: menuOpen ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${menuOpen ? "var(--border-mid)" : "var(--border)"}`,
            borderRadius: 9, color: "var(--text-muted)",
            fontSize: 14, fontFamily: "var(--font-body)", cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            if (!menuOpen) {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.color = "var(--text-muted)";
            }
          }}
          title="Thread options"
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>⋯</span>
        </button>

        {menuOpen && (
          <>
            {/* Click-away */}
            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />

            {/* Dropdown */}
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 6px)",
              background: "var(--bg-panel)",
              border: "1px solid rgba(77,126,255,0.2)",
              borderRadius: 12, overflow: "hidden", zIndex: 99,
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              minWidth: 170,
              animation: "slideUp 0.15s ease",
            }}>
              <button
                onClick={() => { setMenuOpen(false); setShowEdit(true); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "12px 16px",
                  background: "transparent", border: "none",
                  color: "var(--text-primary)", fontSize: 14,
                  fontFamily: "var(--font-body)", cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                ✏️ &nbsp;Edit Thread
              </button>

              <div style={{ height: 1, background: "var(--border)", margin: "0 12px" }} />

              <button
                onClick={() => { setMenuOpen(false); setShowConfirm(true); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "12px 16px",
                  background: "transparent", border: "none",
                  color: "#E85858", fontSize: 14,
                  fontFamily: "var(--font-body)", cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232,88,88,0.07)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                🗑️ &nbsp;Delete Thread
              </button>
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <EditThreadModal thread={thread} onClose={() => setShowEdit(false)} onSave={handleSave} />
      )}

      {/* Delete confirm modal */}
      {showConfirm && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(4,6,12,0.88)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div style={{
            background: "var(--bg-panel)",
            border: "1px solid rgba(232,88,88,0.3)",
            borderRadius: 18, padding: "32px 28px", width: 440, maxWidth: "100%",
            animation: "slideUp 0.2s ease",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: 36, marginBottom: 14, textAlign: "center" }}>🗑️</div>

            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: 22,
              color: "var(--text-primary)", marginBottom: 12, textAlign: "center",
            }}>
              Delete this thread?
            </h2>

            <div style={{
              padding: "12px 16px", marginBottom: 20,
              background: "rgba(232,88,88,0.06)",
              border: "1px solid rgba(232,88,88,0.18)",
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, textAlign: "center" }}>
                {thread.title}
              </div>
            </div>

            <p style={{
              fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65,
              textAlign: "center", marginBottom: 24,
            }}>
              This will permanently remove the thread and all contributions.
              <br />
              <strong style={{ color: "#E85858" }}>This cannot be undone.</strong>
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: "12px 0",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 10, color: "var(--text-muted)",
                  fontSize: 14, fontFamily: "var(--font-body)", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1, padding: "12px 0",
                  background: "#E85858", border: "none",
                  borderRadius: 10, color: "#fff",
                  fontSize: 14, fontWeight: 700,
                  fontFamily: "var(--font-body)", cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                Yes, delete it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}