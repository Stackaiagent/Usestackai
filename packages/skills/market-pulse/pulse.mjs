#!/usr/bin/env node
// Trending tokens / market pulse via GeckoTerminal (free, no key).
// Usage: node pulse.mjs [network=base] [count=10]
// Lists the trending pools on a network with price, 24h change, and volume.

const network = (process.argv[2] || "base").toLowerCase();
const count = Math.min(Math.max(parseInt(process.argv[3] || "10", 10) || 10, 1), 20);

const f = (n, d = 2) =>
  n == null || isNaN(Number(n))
    ? "?"
    : Number(n).toLocaleString("en-US", { maximumFractionDigits: d });
const usd = (n) => (n == null ? "?" : "$" + f(n));
const sign = (n) => (n == null || isNaN(Number(n)) ? "?" : (Number(n) >= 0 ? "+" : "") + f(n) + "%");

try {
  const url = `https://api.geckoterminal.com/api/v2/networks/${network}/trending_pools?page=1`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    console.error(`GeckoTerminal error: HTTP ${res.status} (check the network id, e.g. base, eth, solana)`);
    process.exit(1);
  }
  const data = await res.json();
  const pools = Array.isArray(data.data) ? data.data : [];
  if (!pools.length) {
    console.log(`NO_DATA: no trending pools for network "${network}".`);
    process.exit(0);
  }
  console.log(`Trending on ${network} (top ${Math.min(count, pools.length)}):`);
  pools.slice(0, count).forEach((p, i) => {
    const a = p.attributes || {};
    const name = a.name || "?";
    const price = a.base_token_price_usd;
    const chg = a.price_change_percentage?.h24;
    const vol = a.volume_usd?.h24;
    console.log(
      `${String(i + 1).padStart(2)}. ${name} — $${price ?? "?"} · 24h ${sign(chg)} · vol ${usd(vol)}`,
    );
  });
  console.log("Source: GeckoTerminal. Trending = momentum, not a safety signal.");
} catch (err) {
  console.error(`Failed to fetch market data: ${err?.message ?? err}`);
  process.exit(1);
}
