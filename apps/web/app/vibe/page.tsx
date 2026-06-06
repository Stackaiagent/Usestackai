"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import JSZip from "jszip";
import { UserMenu } from "@/components/user-menu";

interface GeneratedFile {
  path: string;
  content: string;
}
interface Msg {
  role: "user" | "assistant";
  text: string;
  files?: GeneratedFile[];
}
interface Session {
  id: string;
  title: string;
  messages: Msg[];
  files: GeneratedFile[];
  pinned?: boolean;
}
interface VibeResponse {
  reply: string;
  files: GeneratedFile[] | null;
}

const KEY_LS = "stackai_vibe_key";
const SESS_LS = "stackai_vibe_sessions";
const CUR_LS = "stackai_vibe_current";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const THINKING = [
  "Thinking…",
  "Planning the build…",
  "Writing code…",
  "Assembling files…",
];

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}
function freshSession(): Session {
  return { id: uid(), title: "New chat", messages: [], files: [] };
}

/** Inline linked CSS/JS into index.html for a sandboxed iframe preview. */
function buildPreview(files: GeneratedFile[]): string {
  if (files.length === 0) return "";
  const norm = (p: string) => p.replace(/^\.?\//, "");
  const find = (name: string) =>
    files.find((f) => norm(f.path) === norm(name))?.content;
  let html =
    files.find((f) => /(^|\/)index\.html$/i.test(f.path))?.content ??
    files.find((f) => f.path.endsWith(".html"))?.content ??
    "<!doctype html><html><body>No index.html</body></html>";
  html = html.replace(
    /<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi,
    (m, href: string) => {
      const css = find(href);
      return css ? `<style>\n${css}\n</style>` : m;
    },
  );
  html = html.replace(
    /<script[^>]*src=["']([^"']+\.js)["'][^>]*>\s*<\/script>/gi,
    (m, src: string) => {
      const js = find(src);
      return js ? `<script>\n${js}\n</script>` : m;
    },
  );
  return html;
}

export default function VibePage() {
  const [ready, setReady] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [view, setView] = useState<"preview" | "code">("preview");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkIdx, setThinkIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ── load persisted state ──────────────────────────────
  useEffect(() => {
    const k = localStorage.getItem(KEY_LS);
    if (k) setApiKey(k);
    let sess: Session[] = [];
    try {
      sess = JSON.parse(localStorage.getItem(SESS_LS) ?? "[]");
    } catch {
      sess = [];
    }
    if (!Array.isArray(sess) || sess.length === 0) sess = [freshSession()];
    setSessions(sess);
    const cur = localStorage.getItem(CUR_LS);
    setCurrentId(cur && sess.some((s) => s.id === cur) ? cur : sess[0]!.id);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(SESS_LS, JSON.stringify(sessions));
  }, [sessions, ready]);
  useEffect(() => {
    if (ready && currentId) localStorage.setItem(CUR_LS, currentId);
  }, [currentId, ready]);

  // ── thinking cycler ───────────────────────────────────
  useEffect(() => {
    if (!loading) return;
    setThinkIdx(0);
    const t = setInterval(
      () => setThinkIdx((i) => (i + 1) % THINKING.length),
      2500,
    );
    return () => clearInterval(t);
  }, [loading]);

  const current = sessions.find((s) => s.id === currentId) ?? sessions[0];
  const files = current?.files ?? [];
  const preview = useMemo(() => buildPreview(files), [files]);
  const hasProject = files.length > 0;
  const activeContent = files.find((f) => f.path === activeFile)?.content ?? "";

  function patchCurrent(patch: Partial<Session>) {
    setSessions((prev) =>
      prev.map((s) => (s.id === currentId ? { ...s, ...patch } : s)),
    );
  }

  async function connect() {
    const key = keyInput.trim();
    if (!key) return;
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await fetch(`${API_BASE}/api/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) throw new Error("Invalid API key");
      localStorage.setItem(KEY_LS, key);
      setApiKey(key);
      setKeyInput("");
    } catch {
      setConnectError(
        "Invalid API key. Create one in your Dashboard and try again.",
      );
    } finally {
      setConnecting(false);
    }
  }

  function disconnect(msg?: string) {
    localStorage.removeItem(KEY_LS);
    setApiKey(null);
    if (msg) setConnectError(msg);
  }

  function newChat() {
    const s = freshSession();
    setSessions((prev) => [s, ...prev]);
    setCurrentId(s.id);
    setActiveFile(null);
    setError(null);
  }

  function openSession(id: string) {
    setCurrentId(id);
    const s = sessions.find((x) => x.id === id);
    setActiveFile(s?.files[0]?.path ?? null);
    setView("preview");
    setError(null);
  }

  function togglePin(id: string) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)),
    );
  }

  function deleteSession(id: string) {
    if (!confirm("Delete this chat? This can't be undone.")) return;
    const next = sessions.filter((s) => s.id !== id);
    if (next.length === 0) {
      const f = freshSession();
      setSessions([f]);
      setCurrentId(f.id);
      setActiveFile(null);
      return;
    }
    setSessions(next);
    if (id === currentId) {
      setCurrentId(next[0]!.id);
      setActiveFile(next[0]!.files[0]?.path ?? null);
      setView("preview");
    }
  }

  // Pinned chats float to the top.
  const orderedSessions = [...sessions].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0),
  );

  async function send() {
    const text = prompt.trim();
    if (!text || loading || !apiKey || !current) return;
    setError(null);
    setLoading(true);
    setPrompt("");

    const history = current.messages.map((m) => ({ role: m.role, text: m.text }));
    const title =
      current.messages.length === 0
        ? text.slice(0, 40)
        : current.title;
    patchCurrent({
      title,
      messages: [...current.messages, { role: "user", text }],
    });

    try {
      const res = await fetch(`${API_BASE}/api/vibe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: text,
          files: files.length ? files : undefined,
          history,
        }),
      });
      if (res.status === 401) {
        disconnect("API key invalid or revoked. Please reconnect.");
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(body?.message ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as VibeResponse;
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentId) return s;
          const assistant: Msg = {
            role: "assistant",
            text: data.reply,
            ...(data.files ? { files: data.files } : {}),
          };
          return {
            ...s,
            messages: [...s.messages, assistant],
            files: data.files && data.files.length ? data.files : s.files,
          };
        }),
      );
      if (data.files && data.files.length) {
        setActiveFile(data.files[0]!.path);
        setView("preview");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      patchCurrent({
        messages: [
          ...current.messages,
          { role: "user", text },
          { role: "assistant", text: `⚠ ${msg}` },
        ],
      });
    } finally {
      setLoading(false);
    }
  }

  async function downloadZip() {
    const zip = new JSZip();
    for (const f of files) zip.file(f.path, f.content);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stackai-project.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!ready) {
    return (
      <main className="flex h-screen items-center justify-center bg-black text-[#888]">
        <span className="font-mono text-xs">Loading…</span>
      </main>
    );
  }

  // ── Connect screen ────────────────────────────────────
  if (!apiKey) {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-5 bg-black px-6 text-white">
        <Link href="/" className="font-mono text-sm font-bold">
          Stack<span className="text-[#e8ff47]">AI</span> · Vibe
        </Link>
        <p className="text-center text-sm text-[#888]">
          Connect your API key to start. Create one in your{" "}
          <Link href="/dashboard" className="text-[#e8ff47] underline">
            Dashboard
          </Link>
          .
        </p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connect()}
            placeholder="Paste your API key (sk_live_…)"
            autoComplete="off"
            className="border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 font-mono text-sm outline-none focus:border-[#e8ff47]"
          />
          <button
            onClick={connect}
            disabled={connecting || !keyInput.trim()}
            className="bg-[#e8ff47] py-3 font-mono text-xs font-semibold uppercase tracking-wider text-black disabled:opacity-50"
          >
            {connecting ? "Connecting…" : "Connect"}
          </button>
          {connectError && (
            <p className="font-mono text-xs text-red-400">{connectError}</p>
          )}
        </div>
        <div className="mt-2">
          <UserMenu />
        </div>
      </main>
    );
  }

  // ── Main app ──────────────────────────────────────────
  return (
    <main className="flex h-screen flex-col bg-black text-white">
      <header className="flex items-center gap-4 border-b border-[#1c1c1c] px-5 py-3">
        <Link href="/" className="font-mono text-sm font-bold">
          Stack<span className="text-[#e8ff47]">AI</span> · Vibe
        </Link>

        {/* Preview/Code toggle — always visible */}
        <div className="flex border border-[#2a2a2a]">
          {(["preview", "code"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 font-mono text-xs uppercase ${
                view === v
                  ? "bg-[#e8ff47] text-black"
                  : "text-[#888] hover:text-white"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {hasProject && (
          <button
            onClick={downloadZip}
            className="bg-[#e8ff47] px-3 py-1 font-mono text-xs font-semibold uppercase text-black"
          >
            .zip
          </button>
        )}

        <button
          onClick={() => disconnect()}
          className="ml-auto font-mono text-[11px] uppercase tracking-wider text-[#888] hover:text-red-400"
          title="Forget API key"
        >
          Disconnect
        </button>
        <UserMenu />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: sessions + chat */}
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-[#1c1c1c]">
          {/* Sessions */}
          <div className="border-b border-[#1c1c1c] p-2">
            <div className="mb-1 flex items-center justify-between px-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5a5a5a]">
                Chats
              </span>
              <button
                onClick={newChat}
                className="bg-[#e8ff47] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-black"
              >
                + New
              </button>
            </div>
            <div className="max-h-28 space-y-0.5 overflow-y-auto">
              {orderedSessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-1 px-2 py-1 font-mono text-xs ${
                    s.id === currentId
                      ? "bg-[#1c1c1c] text-[#e8ff47]"
                      : "text-[#b0b0b0] hover:bg-[#0f0f0f]"
                  }`}
                >
                  <button
                    onClick={() => openSession(s.id)}
                    className="flex-1 truncate text-left hover:text-white"
                  >
                    {s.title || "New chat"}
                  </button>
                  <button
                    onClick={() => togglePin(s.id)}
                    title={s.pinned ? "Unpin chat" : "Pin chat"}
                    className={`shrink-0 px-1 ${
                      s.pinned
                        ? "text-[#e8ff47] opacity-100"
                        : "text-[#5a5a5a] opacity-0 hover:text-[#e8ff47] group-hover:opacity-100"
                    }`}
                  >
                    📌
                  </button>
                  <button
                    onClick={() => deleteSession(s.id)}
                    title="Delete chat"
                    className="shrink-0 px-1 text-[#5a5a5a] opacity-0 hover:text-red-400 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {current && current.messages.length === 0 && (
              <p className="font-mono text-xs leading-relaxed text-[#888]">
                Chat with StackAI — ask for ideas, or describe what to build.
                It generates a live project you can keep refining.
              </p>
            )}
            {current?.messages.map((m, i) => (
              <div key={i} className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#5a5a5a]">
                  {m.role === "user" ? "You" : "StackAI"}
                </p>
                <p
                  className={`whitespace-pre-wrap text-sm ${
                    m.role === "user" ? "text-white" : "text-[#b0b0b0]"
                  }`}
                >
                  {m.text}
                </p>
                {/* Collapsible file references */}
                {m.files?.map((f) => {
                  const k = `${currentId}:${i}:${f.path}`;
                  const open = expanded[k];
                  return (
                    <div key={f.path} className="mt-1">
                      <button
                        onClick={() =>
                          setExpanded((e) => ({ ...e, [k]: !e[k] }))
                        }
                        className="font-mono text-xs text-[#e8ff47] hover:underline"
                      >
                        {open ? "▾" : "▸"} {f.path}
                      </button>
                      {open && (
                        <pre className="mt-1 max-h-48 overflow-auto border border-[#1c1c1c] bg-[#050505] p-2 font-mono text-[11px] text-[#d4d4d4]">
                          {f.content}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {loading && (
              <p className="font-mono text-xs text-[#e8ff47]">
                ● {THINKING[thinkIdx]}
              </p>
            )}
            {error && <p className="font-mono text-xs text-red-400">{error}</p>}
          </div>

          {/* Input */}
          <div className="border-t border-[#1c1c1c] p-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={3}
              placeholder={
                hasProject ? "Refine it…" : "Ask, or describe what to build…"
              }
              className="w-full resize-none border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 font-mono text-sm outline-none focus:border-[#e8ff47]"
            />
            <button
              onClick={send}
              disabled={loading || !prompt.trim()}
              className="mt-2 w-full bg-[#e8ff47] py-2 font-mono text-xs font-semibold uppercase text-black disabled:opacity-50"
            >
              {loading ? "Working…" : "Send"}
            </button>
          </div>
        </aside>

        {/* Right: preview / code */}
        <section className="flex flex-1 overflow-hidden">
          {!hasProject ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="font-mono text-sm text-[#5a5a5a]">
                Your live preview will appear here.
              </p>
            </div>
          ) : view === "preview" ? (
            <iframe
              title="preview"
              srcDoc={preview}
              sandbox="allow-scripts allow-modals allow-forms"
              className="h-full w-full border-0 bg-white"
            />
          ) : (
            <div className="flex flex-1 overflow-hidden">
              <div className="w-52 shrink-0 overflow-y-auto border-r border-[#1c1c1c] p-2">
                {files.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setActiveFile(f.path)}
                    className={`block w-full truncate px-2 py-1.5 text-left font-mono text-xs ${
                      activeFile === f.path
                        ? "bg-[#1c1c1c] text-[#e8ff47]"
                        : "text-[#b0b0b0] hover:text-white"
                    }`}
                  >
                    {f.path}
                  </button>
                ))}
              </div>
              <pre className="flex-1 overflow-auto bg-[#050505] p-4 font-mono text-xs text-[#d4d4d4]">
                {activeContent}
              </pre>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
