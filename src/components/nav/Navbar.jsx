"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { shortAddress, formatSynapse } from "@/lib/web3";

const NAV_LINKS = [
  { href: "/",            label: "Threads"     },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/wallet",      label: "Dashboard"   },
  { href: "/transactions", label: "History"     },
];

export function Navbar() {
  const pathname   = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  const {
    isConnected, address, synapseBalance,
    connect, disconnect, isOnCorrectChain, addGenLayerChain, pendingTx,
  } = useWallet();

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <Link href="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <div className="logo-icon">◈</div>
          <div>
            <div className="logo-name">Synapse</div>
            <div className="logo-tag">Decision Intelligence</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="nav-links">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? "nav-link-active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="nav-right">
          {/* Network pill */}
          <div className="network-pill">
            <span className="network-dot" />
            <span className="pill-text">GenLayer Bradbury</span>
          </div>

          {/* Wrong chain warning */}
          {isConnected && !isOnCorrectChain && (
            <button className="btn-warning btn-sm" onClick={addGenLayerChain}>
              ⚠ Switch
            </button>
          )}

          {/* Wallet connected */}
          {isConnected ? (
            <div style={{ position: "relative" }} ref={dropRef}>
              <button
                onClick={() => setDropOpen((o) => !o)}
                className="wallet-badge-btn"
              >
                <span className="synapse-bal">◈ {formatSynapse(synapseBalance)}</span>
                <span className="wallet-addr">{shortAddress(address)}</span>
                {pendingTx && (
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#C8943A", animation: "pulse 1s infinite", flexShrink: 0,
                  }} />
                )}
                <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 2 }}>
                  {dropOpen ? "▲" : "▼"}
                </span>
              </button>

              {/* Dropdown */}
              {dropOpen && (
                <div className="wallet-dropdown">
                  {/* Address */}
                  <div className="wd-section">
                    <div className="wd-label">Connected Wallet</div>
                    <div className="wd-address">{shortAddress(address)}</div>
                  </div>

                  {/* Synapse Points */}
                  <div className="wd-section wd-green">
                    <div className="wd-label">Synapse Points</div>
                    <div className="wd-big" style={{ color: "#3DD68C" }}>
                      {formatSynapse(synapseBalance)}
                      <span className="wd-unit">PTS</span>
                    </div>
                    <div className="wd-hint">
                      Earned by contributing, voting, and reaching consensus
                    </div>
                    <div style={{
                      display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap",
                    }}>
                      {[
                        { label: "Contributing", pts: "+10 pts" },
                        { label: "Consensus",    pts: "+25 pts" },
                        { label: "Voted right",  pts: "+5 pts"  },
                      ].map(({ label, pts }) => (
                        <div key={label} style={{
                          flex: 1, minWidth: 70,
                          background: "rgba(61,214,140,0.07)",
                          border: "1px solid rgba(61,214,140,0.15)",
                          borderRadius: 8, padding: "6px 8px", textAlign: "center",
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#3DD68C", fontFamily: "var(--font-mono)" }}>{pts}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="wd-section" style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                    <Link href="/wallet" className="wd-action-link" onClick={() => setDropOpen(false)}>
                      View full dashboard
                    </Link>
                    <button
                      onClick={() => { disconnect(); setDropOpen(false); }}
                      className="wd-disconnect"
                    >
                      Disconnect wallet
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-connect" onClick={connect}>Connect Wallet</button>
          )}

          {/* Hamburger */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className={`ham-line ${menuOpen ? "ham-open-1" : ""}`} />
            <span className={`ham-line ${menuOpen ? "ham-open-2" : ""}`} />
            <span className={`ham-line ${menuOpen ? "ham-open-3" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`mobile-nav-link ${pathname === href ? "mobile-nav-active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}

          {!isConnected ? (
            <div style={{ padding: "10px 20px" }}>
              <button
                className="btn-connect"
                style={{ width: "100%", padding: "12px", fontSize: 16 }}
                onClick={() => { connect(); setMenuOpen(false); }}
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Address */}
              <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {shortAddress(address)}
              </div>

              {/* Synapse Points */}
              <div style={{
                background: "rgba(61,214,140,0.07)", border: "1px solid rgba(61,214,140,0.18)",
                borderRadius: 10, padding: "10px 14px",
              }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                  Synapse Points
                </div>
                <div style={{ fontSize: 22, color: "#3DD68C", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                  ◈ {formatSynapse(synapseBalance)} <span style={{ fontSize: 13, opacity: 0.6 }}>PTS</span>
                </div>
              </div>

              {!isOnCorrectChain && (
                <button className="btn-warning" style={{ width: "100%", padding: "10px" }}
                  onClick={() => { addGenLayerChain(); setMenuOpen(false); }}>
                  ⚠ Add GenLayer Bradbury
                </button>
              )}
              <Link href="/wallet" className="btn-connect"
                style={{ display: "block", textAlign: "center", padding: "10px", textDecoration: "none" }}
                onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <button className="btn-disconnect" onClick={() => { disconnect(); setMenuOpen(false); }}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}