"use client";

import { useState, useEffect } from "react";
import { CATEGORIES } from "@/lib/constants";

export function EditThreadModal({ thread, onClose, onSave }) {
  const [title,    setTitle]    = useState(thread.title    || "");
  const [desc,     setDesc]     = useState(thread.description || "");
  const [category, setCategory] = useState(thread.category || "tech");

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const save = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: desc.trim(), category });
    onClose();
  };

  const inp = {
    width: "100%", padding: "9px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(90,120,200,0.18)",
    borderRadius: 8, color: "var(--text-primary)",
    fontSize: 14, fontFamily: "var(--font-body)",
    boxSizing: "border-box",
  };
  const lbl = {
    display: "block", fontSize: 9, fontWeight: 600,
    color: "var(--text-muted)", textTransform: "uppercase",
    letterSpacing: "0.12em", marginBottom: 5,
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(4,6,12,0.82)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div style={{
        background: "var(--bg-panel)",
        border: "1px solid rgba(77,126,255,0.2)",
        borderRadius: 16, padding: 28, width: 500, maxWidth: "100%",
        animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 19, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: 4 }}>
              Edit Thread
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Update the title, description, or category
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="What needs to be decided or debated?"
            style={inp}
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) save(); }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            placeholder="Provide context for the discussion…"
            style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Category</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button key={key} onClick={() => setCategory(key)} style={{
                padding: "5px 13px", borderRadius: 20, fontSize: 11,
                fontWeight: 500, fontFamily: "var(--font-body)", transition: "all 0.12s",
                background: category === key ? cat.color + "20" : "transparent",
                border: `1px solid ${category === key ? cat.color + "55" : "var(--border)"}`,
                color: category === key ? cat.color : "var(--text-muted)",
                cursor: "pointer",
              }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={save}
            disabled={!title.trim()}
            style={{
              flex: 1, padding: "10px 0",
              background: title.trim() ? "#4D7EFF" : "rgba(77,126,255,0.3)",
              border: "none", borderRadius: 8,
              color: "#fff", fontSize: 13, fontWeight: 600,
              fontFamily: "var(--font-body)", cursor: title.trim() ? "pointer" : "not-allowed",
            }}
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px", background: "transparent",
              border: "1px solid var(--border)", borderRadius: 8,
              color: "var(--text-muted)", fontSize: 13,
              fontFamily: "var(--font-body)", cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}