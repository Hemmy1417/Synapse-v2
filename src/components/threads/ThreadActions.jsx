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
      {/* ⋯ menu button */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            padding: "8px 12px",
            background: menuOpen ? "rgba(255,255,255,0.06)" : "transparent",
            border: "1px solid var(--border)",
            borderRadius: 8, color: "var(--text-muted)",
            fontSize: 18, lineHeight: 1,
            fontFamily: "var(--font-body)", cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-mid)"; }}
          onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.borderColor = "var(--border)"; }}
          title="Thread options"
        >
          ⋯
        </button>

        {menuOpen && (
          <>
            {/* Click-away backdrop */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 98 }}
            />
            {/* Dropdown */}
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 6px)",
              background: "var(--bg-panel)",
              border: "1px solid rgba(77,126,255,0.2)",
              borderRadius: 12, overflow: "hidden", zIndex: 99,
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
              minWidth: 160,
              animation: "slideUp 0.15s ease",
            }}>
              <button
                onClick={() => { setMenuOpen(false); setShowEdit(true); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "12px 16px",
                  background: "transparent", border: "none",
                  color: "var(--text-primary)", fontSize: 14,
                  fontFamily: "var(--font-body)", cursor: "pointer",
                  textAlign: "left", transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 16 }}>✏️</span> Edit Thread
              </button>
              <div style={{ height: 1, background: "var(--border)", margin: "0 12px" }} />
              <button
                onClick={() => { setMenuOpen(false); setShowConfirm(true); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "12px 16px",
                  background: "transparent", border: "none",
                  color: "#E85858", fontSize: 14,
                  fontFamily: "var(--font-body)", cursor: "pointer",
                  textAlign: "left", transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232,88,88,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 16 }}>🗑️</span> Delete Thread
              </button>
            </div>
          </>
        )}
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
            background: "var(--bg-panel)",
            border: "1px solid rgba(232,88,88,0.25)",
            borderRadius: 16, padding: 28, width: 420, maxWidth: "100%",
            animation: "slideUp 0.2s ease",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>🗑️</div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: 20,
              color: "var(--text-primary)", marginBottom: 10, textAlign: "center",
            }}>
              Delete this thread?
            </h2>
            <p style={{
              fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6,
              textAlign: "center", marginBottom: 24,
            }}>
              <strong style={{ color: "var(--text-secondary)" }}>{thread.title}</strong>
              <br />
              This will permanently delete the thread and all its contributions. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1, padding: "11px 0",
                  background: "#E85858", border: "none",
                  borderRadius: 9, color: "#fff",
                  fontSize: 14, fontWeight: 600,
                  fontFamily: "var(--font-body)", cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                Yes, delete it
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: "11px 0",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 9, color: "var(--text-muted)",
                  fontSize: 14, fontFamily: "var(--font-body)", cursor: "pointer",
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