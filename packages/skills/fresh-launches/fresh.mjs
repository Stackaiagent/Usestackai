#!/usr/bin/env node
// Freshly created DEX pools via GeckoTerminal (free, no key).
// Usage: node fresh.mjs [network=base] [count=10]

const network = (process.argv[2] || "base").toLowerCase();
const count = Math.min(Math.max(parseInt(process.argv[3] || "10", 10) || 10, 1), 20);

const usd = (n) => {
  if (n == null || isNaN(Number(n))) return "?";
  const v = Number(n);
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(1) + "K";
  return "$" + v.toFixed(0);
};
const ago = (iso) => {
  const s = Math.floor((Date.now() - Date.parse(iso)) / 1000);
  if (!Number.isFinite(s) || s < 0) return "?";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

try {
  const res = await fetch(
    `https://api.geckoterminal.com/api/v2/networks/${network}/new_pools?page=1`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) {
    console.error(`GeckoTerminal error: HTTP ${res.status} (check network id, e.g. base, eth, solana)`);
    process.exit(1);
  }
  const pools = (await res.json()).data || [];
  if (!pools.length) {
    console.log(`NO_DATA: no new pools for "${network}".`);
    process.exit(0);
  }
  console.log(`New pools on ${network} (top ${Math.min(count, pools.length)}):`);
  pools.slice(0, count).forEach((p, i) => {
    const a = p.attributes || {};
    console.log(
      `${String(i + 1).padStart(2)}. ${a.name || "?"} — $${a.base_token_price_usd ?? "?"} · liq ${usd(a.reserve_in_usd)} · ${ago(a.pool_created_at)} old`,
    );
  });
  console.log("New pools = freshly created. HIGH RISK — run token-safety before aping. Source: GeckoTerminal.");
} catch (err) {
  console.error(`Failed to fetch new pools: ${err?.message ?? err}`);
  process.exit(1);
}
