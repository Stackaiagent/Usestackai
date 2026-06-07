"use client";

import { useState } from "react";
import Link from "next/link";
import { UserMenu } from "@/components/user-menu";
import "./landing.css";

const NAV_LIT = new Set([1, 2, 3, 5, 6, 7]);
const MARQUEE = [
  "CLI agent", "VSCode extension", "Vibecoding", "File read/write",
  "MiMo v2.5 Pro", "1M context", "API keys", "X auth",
  "Rate limiting", "Download .zip", "CLI agent", "VSCode extension",
  "Vibecoding", "File read/write", "MiMo v2.5 Pro", "1M context",
];

export default function HomePage() {
  const [tab, setTab] = useState<"cli" | "vscode">("cli");

  return (
    <div className="landing">
      {/* NAV */}
      <nav>
        <div className="nav-logo">
          <div className="logo-icon">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={`ld ${NAV_LIT.has(i) ? "on" : "off"}`} />
            ))}
          </div>
          <span className="logo-text">
            Stack<span className="ai">AI</span>
          </span>
        </div>
        <div className="nav-mid">
          <a href="#cli">CLI</a>
          <a href="#vibecoding">Vibe Coding</a>
          <a href="#agent">Build Agent</a>
          <a href="#install">Install</a>
          <a href="https://docs.usestackai.com">Docs</a>
        </div>
        <div className="nav-right">
          <UserMenu landing />
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            Powered by Xiaomi MiMo v2.5 Pro · 1M context
          </div>
          <h1>Your code.<br />Your rules.<br /><em>AI speed.</em></h1>
          <p className="hero-sub">
            An AI coding agent that reads, writes, and edits files directly.
            Works in your terminal, editor, and browser.
          </p>
          <div className="hero-btns">
            <Link href="/install" className="btn-accent">Install CLI</Link>
            <Link href="/vibe" className="btn-outline">Try in browser</Link>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-num">1M</span>
              <span className="stat-label">Token context</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">3</span>
              <span className="stat-label">Platforms</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">50</span>
              <span className="stat-label">Free requests/day</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="t-badge"><span className="t-badge-dot" />terminal</div>
          <div className="terminal">
            <div className="t-head">
              <div className="t-dots"><div className="tdot r" /><div className="tdot y" /><div className="tdot g" /></div>
              <span className="t-label">stackai · session</span>
            </div>
            <div className="t-body">
              <div><span className="tp">$</span> <span className="tc">npm install -g stackai</span></div>
              <div className="to">Installing StackAI CLI...</div>
              <div className="tg">✓ stackai@1.0.0 installed</div>
              <div style={{ height: 6 }} />
              <div><span className="tp">$</span> <span className="tc">stackai login</span></div>
              <div className="tg">✓ Authenticated · free tier</div>
              <div style={{ height: 6 }} />
              <div><span className="tp">$</span> <span className="tc">stackai <span className="ts">&quot;refactor api.ts to async/await&quot;</span></span></div>
              <div className="to">Reading src/api.ts</div>
              <div className="to">Planning 12 changes</div>
              <div className="to">Writing files...</div>
              <div className="tg">✓ Done · 3 files modified · 0 errors <span className="cursor" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <div key={i} className="marquee-item"><span className="hl">{t}</span></div>
          ))}
        </div>
      </div>

      {/* PRODUCT 1: CLI */}
      <div className="section-border" id="cli">
        <div className="section">
          <div className="prod-grid">
            <div className="prod-left">
              <div className="s-tag">01 · Terminal / CLI</div>
              <h2 className="s-h2">Install once.<br /><em>Code anywhere.</em></h2>
              <p className="prod-desc">
                StackAI CLI turns your terminal into an AI coding agent. Point it
                at any project, describe what you want — it reads your files,
                plans the changes, and ships them. No context switching.
              </p>
              <div className="prod-pills">
                <span className="pill">Read &amp; write files</span>
                <span className="pill">Multi-file edits</span>
                <span className="pill">Git-aware</span>
                <span className="pill">Works offline</span>
              </div>
              <Link href="/install" className="btn-accent btn-cta-inline">Install CLI</Link>
            </div>
            <div className="prod-right">
              <div className="prod-num-bg">01</div>
              <div className="terminal">
                <div className="t-head">
                  <div className="t-dots"><div className="tdot r" /><div className="tdot y" /><div className="tdot g" /></div>
                  <span className="t-label">~/myproject</span>
                </div>
                <div className="t-body">
                  <div><span className="tp">$</span> <span className="tc">stackai <span className="ts">&quot;add rate limiting to all API routes&quot;</span></span></div>
                  <div className="to">Scanning project structure...</div>
                  <div className="to">Found 8 route files in src/routes/</div>
                  <div className="to">Planning changes across 8 files</div>
                  <div style={{ height: 4 }} />
                  <div className="to">Writing src/middleware/rateLimit.ts</div>
                  <div className="to">Updating src/routes/auth.ts</div>
                  <div className="to">Updating src/routes/users.ts</div>
                  <div className="to">Updating src/routes/posts.ts</div>
                  <div className="to">+ 5 more files</div>
                  <div style={{ height: 4 }} />
                  <div className="tg">✓ Done · 9 files modified · 0 errors <span className="cursor" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT 2: VIBECODING */}
      <div className="section-border" id="vibecoding">
        <div className="section">
          <div className="prod-grid prod-grid-rev">
            <div className="prod-left">
              <div className="s-tag">02 · Vibe Coding</div>
              <h2 className="s-h2">Describe it.<br /><em>Download it.</em></h2>
              <p className="prod-desc">
                Open the web app, chat with the AI, and watch your project come
                to life. When you&apos;re done, download a ready-to-run .zip file.
                No setup, no config, no boilerplate — just ship.
              </p>
              <div className="prod-pills">
                <span className="pill">Chat interface</span>
                <span className="pill">Live preview</span>
                <span className="pill">Download .zip</span>
                <span className="pill">Any stack</span>
              </div>
              <Link href="/vibe" className="btn-accent btn-cta-inline">Try Vibe Coding</Link>
            </div>
            <div className="prod-right">
              <div className="prod-num-bg">02</div>
              <div className="chat-ui">
                <div className="t-head">
                  <div className="t-dots"><div className="tdot r" /><div className="tdot y" /><div className="tdot g" /></div>
                  <span className="t-label">stackai · vibe coding</span>
                </div>
                <div className="chat-body">
                  <div className="chat-msg user">
                    <span className="msg-role">you</span>
                    <span className="msg-text">Build me a landing page for a SaaS product. Dark theme, clean design, with a hero, features section, and pricing.</span>
                  </div>
                  <div className="chat-msg ai">
                    <span className="msg-role ai-role">stackai</span>
                    <div className="msg-text">
                      <div className="ai-thinking">
                        <span className="ai-dot" />
                        <span className="ai-dot" />
                        <span className="ai-dot" />
                        Generating your project...
                      </div>
                      <div className="file-list">
                        <div className="file-item"><span className="fi-icon">▸</span> index.html</div>
                        <div className="file-item"><span className="fi-icon">▸</span> styles.css</div>
                        <div className="file-item"><span className="fi-icon">▸</span> main.js</div>
                      </div>
                      <div className="ai-done">3 files ready · <span style={{ color: "var(--accent)", cursor: "pointer" }}>Download .zip</span></div>
                    </div>
                  </div>
                  <div className="chat-input-row">
                    <div className="chat-input">Describe what to change...</div>
                    <div className="chat-send">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="12" x2="7" y2="2" /><polyline points="3,6 7,2 11,6" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT 3: BUILD AGENT */}
      <div className="section-border" id="agent">
        <div className="section">
          <div className="prod-grid">
            <div className="prod-left">
              <div className="s-tag">03 · Build Agent</div>
              <h2 className="s-h2">Give it a goal.<br /><em>Walk away.</em></h2>
              <p className="prod-desc">
                Build Agent tackles entire features autonomously. Give it a goal —
                it breaks it down, writes the code, runs tests, and iterates until
                it&apos;s done. You review the diff, not every line.
              </p>
              <div className="prod-pills">
                <span className="pill">Autonomous execution</span>
                <span className="pill">Test runner</span>
                <span className="pill">Self-correcting</span>
                <span className="pill">Diff review</span>
              </div>
              <Link href="/dashboard" className="btn-accent btn-cta-inline">Try Build Agent</Link>
            </div>
            <div className="prod-right">
              <div className="prod-num-bg">03</div>
              <div className="agent-ui">
                <div className="t-head">
                  <div className="t-dots"><div className="tdot r" /><div className="tdot y" /><div className="tdot g" /></div>
                  <span className="t-label">build agent · running</span>
                </div>
                <div className="agent-body">
                  <div className="agent-goal">
                    <span className="ag-label">Goal</span>
                    <span className="ag-text">&quot;Implement full user authentication with JWT, refresh tokens, and email verification&quot;</span>
                  </div>
                  <div className="agent-steps">
                    <div className="ag-step done"><span className="ag-status done-icon">✓</span><span>Scaffold auth module structure</span></div>
                    <div className="ag-step done"><span className="ag-status done-icon">✓</span><span>Implement JWT sign &amp; verify</span></div>
                    <div className="ag-step done"><span className="ag-status done-icon">✓</span><span>Build refresh token rotation</span></div>
                    <div className="ag-step active"><span className="ag-status spin">◌</span><span>Write email verification flow</span></div>
                    <div className="ag-step pending"><span className="ag-status pend">○</span><span>Add tests for all auth routes</span></div>
                    <div className="ag-step pending"><span className="ag-status pend">○</span><span>Update API documentation</span></div>
                  </div>
                  <div className="agent-footer">
                    <span className="af-stat"><span style={{ color: "var(--accent)" }}>12</span> files written</span>
                    <span className="af-stat"><span style={{ color: "var(--accent)" }}>3/6</span> steps done</span>
                    <span className="af-stat" style={{ color: "var(--gray6)" }}>running...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INSTALL */}
      <div className="section-border" id="install">
        <div className="section">
          <div className="s-tag">Install</div>
          <h2 className="s-h2">Up in<br /><em>30 seconds.</em></h2>
          <div className="install-wrap">
            <div className="tabs">
              <button className={`tab ${tab === "cli" ? "active" : ""}`} onClick={() => setTab("cli")}>CLI</button>
              <button className={`tab ${tab === "vscode" ? "active" : ""}`} onClick={() => setTab("vscode")}>VSCode</button>
            </div>
            <div className={`tab-panel ${tab === "cli" ? "active" : ""}`}>
              <div className="cmd-line"><span className="cmd-p">$</span><span>npm install -g <span className="cmd-hl">stackai</span></span></div>
              <div className="cmd-line"><span className="cmd-p">$</span><span>stackai <span className="cmd-hl">login</span></span></div>
              <div className="cmd-line"><span className="cmd-p">$</span><span>stackai <span className="cmd-hl">&quot;describe what you want to build&quot;</span></span></div>
            </div>
            <div className={`tab-panel ${tab === "vscode" ? "active" : ""}`}>
              <div className="cmd-line"><span>1. Extensions → search <span className="cmd-hl">StackAI</span> → Install</span></div>
              <div className="cmd-line"><span>2. Command Palette → <span className="cmd-hl">StackAI: Set API Key</span></span></div>
              <div className="cmd-line"><span>3. Press <span className="cmd-hl">Ctrl+Shift+A</span> to open the agent panel</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-banner">
        <h2>Ready to <em>ship faster?</em></h2>
        <p className="cta-sub">Free to start. No credit card. Cancel anytime.</p>
        <div className="cta-btns">
          <Link href="/login" className="btn-accent btn-cta-big">Start for free</Link>
          <a href="https://docs.usestackai.com" className="btn-outline btn-outline-big">Read the docs</a>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: "1px solid var(--gray3)" }}>
        <footer className="footer">
          <span className="f-left">© 2026 StackAI</span>
          <div className="f-links">
            <a href="https://docs.usestackai.com">Docs</a>
            <a href="https://github.com/Stackaiagent/Usestackai">GitHub</a>
            <a href="https://x.com/askstackai">X / Twitter</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
