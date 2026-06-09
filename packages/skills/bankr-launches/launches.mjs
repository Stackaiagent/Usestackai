#!/usr/bin/env node
// Bankr token-launch ecosystem info via Bankr's PUBLIC API (no key, read-only).
// Usage:
//   node launches.mjs list [count]          recent token launches (default 10)
//   node launches.mjs fees <tokenAddress>   fee snapshot for a Bankr-launched token

const base = process.env.BANKR_API_URL || "https://api.bankr.bot";
const cmd = process.argv[2];

const ago = (ts) => {
  const s = Math.floor((Date.now() - Number(ts)) / 1000);
  if (!Number.isFinite(s) || s < 0) return "?";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
const short = (a) => (a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || "?");

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
}

try {
  if (cmd === "list") {
    const count = Math.min(Math.max(parseInt(process.argv[3] || "10", 10) || 10, 1), 25);
    const { ok, status, body } = await getJson(`${base}/token-launches`);
    if (!ok) { console.error(`Bankr error ${status}`); process.exit(1); }
    const launches = Array.isArray(body.launches) ? body.launches : [];
    if (!launches.length) { console.log("No recent Bankr launches found."); process.exit(0); }
    console.log(`Recent Bankr launches (top ${Math.min(count, launches.length)}):`);
    launches.slice(0, count).forEach((l, i) => {
      console.log(
        `${String(i + 1).padStart(2)}. ${l.tokenName ?? "?"} (${l.tokenSymbol ?? "?"}) · ${l.chain ?? "?"} · ${short(l.tokenAddress)} · ${l.status ?? "?"} · ${ago(l.timestamp)}`,
      );
    });
    console.log("Source: Bankr public API.");
  } else if (cmd === "fees") {
    const addr = process.argv[3];
    if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      console.error("Usage: launches.mjs fees <0x-token-address>");
      process.exit(2);
    }
    const { ok, status, body } = await getJson(`${base}/token-launches/${addr}/fees`);
    if (status === 404) { console.log("NOT_BANKR: this token was not launched via Bankr."); process.exit(0); }
    if (status === 400) { console.error("Invalid token address."); process.exit(1); }
    if (!ok) { console.error(`Bankr error ${status}`); process.exit(1); }
    // Field names aren't fully documented — collapse arrays (e.g. the daily
    // timeline) to a count and keep scalars + nested totals so output stays small.
    const out = {};
    if (body && typeof body === "object") {
      for (const [k, v] of Object.entries(body)) {
        out[k] = Array.isArray(v) ? `[${v.length} entries]` : v;
      }
    }
    console.log(JSON.stringify(out, null, 2));
    console.log("Source: Bankr public API (fees cached ~2 min).");
  } else {
    console.error('Usage: launches.mjs <list [count] | fees <0x-token-address>>');
    process.exit(2);
  }
} catch (err) {
  console.error(`Bankr request failed: ${err?.message ?? err}`);
  process.exit(1);
}
