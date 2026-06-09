#!/usr/bin/env node
// Find a token's contract address by name/symbol via Dexscreener (free, no key).
// Usage: node search.mjs <name or symbol>

const q = process.argv.slice(2).join(" ").trim();
if (!q) {
  console.error('Usage: search.mjs <name or symbol>');
  process.exit(2);
}

const usd = (n) => {
  if (n == null || isNaN(Number(n))) return "?";
  const v = Number(n);
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(1) + "K";
  return "$" + v.toFixed(0);
};

try {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) {
    console.error(`Dexscreener error: HTTP ${res.status}`);
    process.exit(1);
  }
  const pairs = ((await res.json()).pairs || [])
    .filter((p) => p.baseToken?.symbol)
    .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

  // Dedupe by token address — one row per token (most-liquid pair).
  const seen = new Set();
  const out = [];
  for (const p of pairs) {
    const addr = p.baseToken.address?.toLowerCase();
    if (!addr || seen.has(addr)) continue;
    seen.add(addr);
    out.push(p);
    if (out.length >= 8) break;
  }
  if (!out.length) {
    console.log(`NO_RESULTS: nothing found for "${q}".`);
    process.exit(0);
  }
  console.log(`Top matches for "${q}":`);
  out.forEach((p, i) => {
    console.log(
      `${i + 1}. ${p.baseToken.name} (${p.baseToken.symbol}) · ${p.chainId} · ${p.baseToken.address} · $${p.priceUsd ?? "?"} · liq ${usd(p.liquidity?.usd)}`,
    );
  });
  console.log("Tip: pass an address to token-report or token-safety for details. Source: Dexscreener.");
} catch (err) {
  console.error(`Failed to search: ${err?.message ?? err}`);
  process.exit(1);
}
