#!/usr/bin/env node
// DeFi overview via DeFiLlama (free, no key).
// Usage: node overview.mjs [chain=Base] [count=10]
// Shows the chain's TVL, top protocols on it, and the top chains by TVL.

const chain = process.argv[2] || "Base";
const count = Math.min(Math.max(parseInt(process.argv[3] || "10", 10) || 10, 1), 20);

const usd = (n) => {
  if (n == null || isNaN(Number(n))) return "?";
  const v = Number(n);
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(2) + "K";
  return "$" + v.toFixed(0);
};

try {
  const [chainsRes, protRes] = await Promise.all([
    fetch("https://api.llama.fi/v2/chains", { headers: { accept: "application/json" } }),
    fetch("https://api.llama.fi/protocols", { headers: { accept: "application/json" } }),
  ]);
  if (!chainsRes.ok || !protRes.ok) {
    console.error(`DeFiLlama error: HTTP ${chainsRes.status}/${protRes.status}`);
    process.exit(1);
  }
  const chains = await chainsRes.json();
  const protocols = await protRes.json();

  const target = chains.find((c) => c.name?.toLowerCase() === chain.toLowerCase());
  const chainKey = target?.name ?? chain;

  // Top protocols on the chain — prefer per-chain TVL, fall back to total tvl.
  const onChain = protocols
    .map((p) => {
      const tvl =
        p.chainTvls && p.chainTvls[chainKey] != null
          ? p.chainTvls[chainKey]
          : Array.isArray(p.chains) && p.chains.includes(chainKey)
            ? p.tvl
            : null;
      return tvl == null ? null : { name: p.name, category: p.category, tvl };
    })
    .filter(Boolean)
    .sort((a, b) => b.tvl - a.tvl);

  const topChains = [...chains].sort((a, b) => (b.tvl || 0) - (a.tvl || 0)).slice(0, 5);
  const totalTvl = chains.reduce((s, c) => s + (c.tvl || 0), 0);

  console.log(`DeFi overview`);
  console.log(`Total DeFi TVL (all chains): ${usd(totalTvl)}`);
  console.log(`${chainKey} TVL: ${target ? usd(target.tvl) : "chain not found"}`);
  console.log("");
  console.log(`Top protocols on ${chainKey}:`);
  if (!onChain.length) {
    console.log("  (none found)");
  } else {
    onChain.slice(0, count).forEach((p, i) => {
      console.log(`${String(i + 1).padStart(2)}. ${p.name} — ${usd(p.tvl)}${p.category ? " · " + p.category : ""}`);
    });
  }
  console.log("");
  console.log(`Top chains by TVL:`);
  topChains.forEach((c, i) => console.log(`${i + 1}. ${c.name} — ${usd(c.tvl)}`));
  console.log("Source: DeFiLlama.");
} catch (err) {
  console.error(`Failed to fetch DeFi data: ${err?.message ?? err}`);
  process.exit(1);
}
