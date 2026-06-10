#!/usr/bin/env node
// Virtuals Protocol ecosystem info via the public API (free, no key).
// Usage:
//   node virtuals.mjs top [count]        top agents by market cap
//   node virtuals.mjs search <query>     find an agent by name

const BASE = "https://api.virtuals.io/api/virtuals";
const cmd = process.argv[2];

const f = (n) =>
  n == null || isNaN(Number(n))
    ? "?"
    : Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
const pct = (n) =>
  n == null || isNaN(Number(n))
    ? "?"
    : (Number(n) >= 0 ? "+" : "") + Number(n).toFixed(1) + "%";

async function get(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Virtuals API HTTP ${res.status}`);
  return res.json();
}

const row = (a, i) =>
  `${i != null ? String(i + 1).padStart(2) + ". " : ""}${a.name} ($${a.symbol}) · mcap ${f(a.mcapInVirtual)} VIRTUAL · 24h ${pct(a.priceChangePercent24h)} · ${f(a.holderCount)} holders${a.category ? " · " + a.category : ""}`;

try {
  if (cmd === "top") {
    const count = Math.min(Math.max(parseInt(process.argv[3] || "10", 10) || 10, 1), 20);
    const url = `${BASE}?pagination%5BpageSize%5D=${count}&sort%5B0%5D=mcapInVirtual%3Adesc&filters%5Bstatus%5D=AVAILABLE`;
    const data = (await get(url)).data || [];
    if (!data.length) {
      console.log("No Virtuals agents found.");
      process.exit(0);
    }
    console.log(`Top Virtuals agents by market cap (top ${data.length}):`);
    data.forEach((a, i) => console.log(row(a, i)));
    console.log("mcap is in $VIRTUAL. Source: Virtuals Protocol API.");
  } else if (cmd === "search") {
    const q = process.argv.slice(3).join(" ").trim();
    if (!q) {
      console.error("Usage: virtuals.mjs search <name>");
      process.exit(2);
    }
    const url = `${BASE}?filters%5Bname%5D%5B%24containsi%5D=${encodeURIComponent(q)}&pagination%5BpageSize%5D=8&sort%5B0%5D=mcapInVirtual%3Adesc`;
    const data = (await get(url)).data || [];
    if (!data.length) {
      console.log(`NO_RESULTS: no Virtuals agent matching "${q}".`);
      process.exit(0);
    }
    console.log(`Virtuals agents matching "${q}":`);
    data.forEach((a) => console.log(`• ${row(a)}${a.tokenAddress ? " · " + a.tokenAddress : " · (pre-launch)"}`));
    console.log("Source: Virtuals Protocol API.");
  } else {
    console.error("Usage: virtuals.mjs <top [count] | search <query>>");
    process.exit(2);
  }
} catch (err) {
  console.error(`Virtuals request failed: ${err?.message ?? err}`);
  process.exit(1);
}
