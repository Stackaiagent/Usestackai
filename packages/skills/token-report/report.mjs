#!/usr/bin/env node
// Token market snapshot from Dexscreener (free, no API key).
// Usage: node report.mjs <0x-token-address>
// Picks the most-liquid pair across chains and prints a clean report.
// Cross-platform: uses Node 20+ global fetch, no curl/jq needed.

const addr = process.argv[2];
if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
  console.error("Usage: report.mjs <0x-token-address> (40 hex chars)");
  process.exit(2);
}

const fmt = (n) =>
  n == null || isNaN(Number(n))
    ? "?"
    : Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const usd = (n) => (n == null ? "?" : "$" + fmt(n));

try {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${addr}`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) {
    console.error(`Dexscreener error: HTTP ${res.status}`);
    process.exit(1);
  }
  const data = await res.json();
  const target = addr.toLowerCase();
  // Only keep pairs where the queried address is the BASE token, so price /
  // mcap / fdv refer to IT (not its counterpart). Dexscreener returns pairs
  // where the address is base OR quote — for a common quote currency (USDC,
  // WETH) the most-liquid pair would otherwise report the wrong token.
  const pairs = (data.pairs || [])
    .filter((p) => p.baseToken?.address?.toLowerCase() === target)
    .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
  if (!pairs.length) {
    console.log(
      "NO_PAIRS: no DEX pairs found where this address is the traded token (unlisted, no liquidity, or it's only used as a quote/pair currency).",
    );
    process.exit(0);
  }
  const p = pairs[0];
  console.log(`${p.baseToken?.name ?? "?"} (${p.baseToken?.symbol ?? "?"})`);
  console.log(`Chain: ${p.chainId} · DEX: ${p.dexId}`);
  console.log(`Price: $${p.priceUsd ?? "?"}`);
  console.log(`Market cap: ${usd(p.marketCap ?? p.fdv)}`);
  console.log(`Liquidity: ${usd(p.liquidity?.usd)}`);
  console.log(`24h volume: ${usd(p.volume?.h24)}`);
  console.log(`24h change: ${p.priceChange?.h24 ?? "?"}%`);
  console.log(`Top pair: ${p.baseToken?.symbol}/${p.quoteToken?.symbol} · ${pairs.length} pair(s) total`);
  console.log(`Chart: ${p.url ?? "?"}`);
} catch (err) {
  console.error(`Failed to fetch token data: ${err?.message ?? err}`);
  process.exit(1);
}
