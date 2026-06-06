"use client";

import { useState, useTransition } from "react";
import { createKey, revokeKey } from "./actions";

export interface KeyView {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  usedToday: number;
  limit: number | null;
}

export function KeysClient({ initialKeys }: { initialKeys: KeyView[] }) {
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function onCreate() {
    startTransition(async () => {
      const result = await createKey(name);
      setNewKey(result.fullKey);
      setName("");
    });
  }

  function onRevoke(id: string) {
    startTransition(async () => {
      await revokeKey(id);
    });
  }

  function copy() {
    if (!newKey) return;
    void navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section>
      {/* Create */}
      <div className="mb-8 flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. Laptop)"
          className="flex-1 border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-2.5 font-mono text-sm outline-none focus:border-[#e8ff47]"
        />
        <button
          onClick={onCreate}
          disabled={pending}
          className="bg-[#e8ff47] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-black disabled:opacity-50"
        >
          {pending ? "..." : "Create key"}
        </button>
      </div>

      {/* One-time reveal */}
      {newKey && (
        <div className="mb-8 border border-[#e8ff47]/40 bg-[#e8ff47]/5 p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-[#e8ff47]">
            Copy this key now — it won&apos;t be shown again
          </p>
          <div className="mt-3 flex items-center gap-3">
            <code className="flex-1 break-all font-mono text-sm">{newKey}</code>
            <button
              onClick={copy}
              className="border border-[#2a2a2a] px-3 py-1.5 font-mono text-xs uppercase hover:border-white"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <ul className="space-y-3">
        {initialKeys.length === 0 && (
          <li className="font-mono text-sm text-[#888]">No keys yet.</li>
        )}
        {initialKeys.map((k) => (
          <li
            key={k.id}
            className="border border-[#1c1c1c] bg-[#0a0a0a] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{k.name}</p>
                <p className="mt-1 font-mono text-xs text-[#888]">
                  {k.prefix}**** · last used{" "}
                  {k.lastUsedAt
                    ? new Date(k.lastUsedAt).toLocaleDateString()
                    : "never"}
                </p>
              </div>
              <button
                onClick={() => onRevoke(k.id)}
                disabled={pending}
                className="font-mono text-xs uppercase tracking-wider text-[#888] hover:text-red-400 disabled:opacity-50"
              >
                Revoke
              </button>
            </div>

            {/* Usage bar */}
            <div className="mt-3">
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-[#888]">
                <span>Usage today</span>
                <span>
                  {k.usedToday}
                  {k.limit === null ? "" : ` / ${k.limit}`}
                </span>
              </div>
              <div className="mt-1 h-1 w-full bg-[#1c1c1c]">
                <div
                  className="h-1 bg-[#e8ff47]"
                  style={{
                    width:
                      k.limit === null
                        ? "8%"
                        : `${Math.min(100, (k.usedToday / k.limit) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
