"use client";

import { useState } from "react";
import { linkTelegram } from "./actions";

export function LinkButton({ code }: { code: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  async function onClick() {
    setLoading(true);
    setResult(await linkTelegram(code));
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <button
        onClick={onClick}
        disabled={loading || result?.ok}
        className="bg-[#e8ff47] px-5 py-2.5 font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Linking…" : result?.ok ? "Linked ✓" : "Connect Telegram"}
      </button>
      {result?.message && (
        <p className={result.ok ? "text-[#e8ff47]" : "text-red-400"}>
          {result.message}
        </p>
      )}
    </div>
  );
}
