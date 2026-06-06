"use client";

import { useState } from "react";

/** A terminal command line with a copy button. */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group flex items-center justify-between gap-4 border border-[#1c1c1c] bg-[#0a0a0a] px-5 py-4">
      <code className="overflow-x-auto whitespace-pre font-mono text-sm text-[#e8ff47]">
        {label && <span className="mr-2 text-[#5a5a5a]">{label}</span>}
        {code}
      </code>
      <button
        onClick={copy}
        className="shrink-0 border border-[#2a2a2a] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[#888] transition-colors hover:border-white hover:text-white"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
