#!/usr/bin/env node
// Token safety / rug check via GoPlus Security API (free, no key).
// Usage: node check.mjs <0x-token-address> [chainId=8453]   (8453 = Base)
// Reports honeypot status, buy/sell tax, ownership risks, holder
// concentration, and LP lock — plus a rough flag summary.

const addr = process.argv[2];
const chainId = process.argv[3] || "8453"; // Base by default
if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
  console.error("Usage: check.mjs <0x-token-address> [chainId=8453]");
  process.exit(2);
}

const pct = (v) => (v == null || v === "" ? null : Number(v) * 100);
const f = (n, d = 2) =>
  n == null || isNaN(Number(n))
    ? "?"
    : Number(n).toLocaleString("en-US", { maximumFractionDigits: d });

try {
  const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${addr}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    console.error(`GoPlus error: HTTP ${res.status}`);
    process.exit(1);
  }
  const data = await res.json();
  const t = data.result?.[addr.toLowerCase()];
  if (!t || Object.keys(t).length === 0) {
    console.log(`NO_DATA: GoPlus has no security data for this token on chain ${chainId}.`);
    process.exit(0);
  }

  const honeypot = t.is_honeypot === "1";
  const buyTax = pct(t.buy_tax);
  const sellTax = pct(t.sell_tax);
  const openSource = t.is_open_source === "1";
  const mintable = t.is_mintable === "1";
  const proxy = t.is_proxy === "1";
  const hiddenOwner = t.hidden_owner === "1";
  const canTakeBack = t.can_take_back_ownership === "1";
  const holderCount = t.holder_count;

  // Top-10 holder concentration
  const holders = Array.isArray(t.holders) ? t.holders : [];
  const top10 = holders
    .slice(0, 10)
    .reduce((s, h) => s + (Number(h.percent) || 0), 0) * 100;

  // LP locked/burned %
  const lps = Array.isArray(t.lp_holders) ? t.lp_holders : [];
  const lpLocked = lps
    .filter(
      (l) =>
        l.is_locked === 1 ||
        l.is_locked === "1" ||
        /0x0+(dead)?$/i.test(l.address || ""),
    )
    .reduce((s, l) => s + (Number(l.percent) || 0), 0) * 100;

  const flags = [];
  if (honeypot) flags.push("🔴 HONEYPOT — sells appear blocked");
  if (buyTax != null && buyTax > 10) flags.push(`🔴 high buy tax ${f(buyTax)}%`);
  if (sellTax != null && sellTax > 10) flags.push(`🔴 high sell tax ${f(sellTax)}%`);
  if (!openSource) flags.push("⚠️ contract not open-source / unverified");
  if (mintable) flags.push("⚠️ mintable (supply can increase)");
  if (canTakeBack) flags.push("⚠️ owner can reclaim ownership");
  if (hiddenOwner) flags.push("⚠️ hidden owner");
  if (proxy) flags.push("⚠️ proxy contract (logic can change)");
  if (top10 > 50) flags.push(`⚠️ top-10 holders hold ${f(top10)}%`);
  if (lps.length && lpLocked < 50) flags.push(`⚠️ only ${f(lpLocked)}% of LP locked/burned`);

  console.log(`Safety check (chain ${chainId})`);
  console.log(`Honeypot: ${honeypot ? "YES 🔴" : "no"}`);
  console.log(`Buy tax: ${buyTax == null ? "?" : f(buyTax) + "%"} · Sell tax: ${sellTax == null ? "?" : f(sellTax) + "%"}`);
  console.log(`Open source: ${openSource ? "yes" : "NO"} · Mintable: ${mintable ? "yes" : "no"} · Proxy: ${proxy ? "yes" : "no"}`);
  console.log(`Owner can reclaim: ${canTakeBack ? "yes" : "no"} · Hidden owner: ${hiddenOwner ? "yes" : "no"}`);
  console.log(`Holders: ${f(holderCount, 0)} · Top-10 concentration: ${holders.length ? f(top10) + "%" : "?"}`);
  console.log(`LP locked/burned: ${lps.length ? f(lpLocked) + "%" : "?"}`);
  console.log(`Flags: ${flags.length ? flags.length : "none"}`);
  for (const fl of flags) console.log(`  - ${fl}`);
  console.log("Note: informational only, not financial advice — always DYOR.");
} catch (err) {
  console.error(`Failed to fetch safety data: ${err?.message ?? err}`);
  process.exit(1);
}
