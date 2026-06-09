#!/usr/bin/env node
// Crypto Fear & Greed Index via alternative.me (free, no key).
// Usage: node fng.mjs

try {
  const res = await fetch("https://api.alternative.me/fng/?limit=2", {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    console.error(`Fear & Greed error: HTTP ${res.status}`);
    process.exit(1);
  }
  const data = (await res.json()).data || [];
  const today = data[0];
  const yest = data[1];
  if (!today) {
    console.error("No Fear & Greed data returned.");
    process.exit(1);
  }
  const trend = yest
    ? Number(today.value) > Number(yest.value)
      ? "↑ rising"
      : Number(today.value) < Number(yest.value)
        ? "↓ falling"
        : "→ flat"
    : "";
  console.log("Crypto Fear & Greed Index");
  console.log(`${today.value}/100 — ${today.value_classification} ${trend}`);
  if (yest) console.log(`Yesterday: ${yest.value} (${yest.value_classification})`);
  console.log("0 = extreme fear, 100 = extreme greed. Source: alternative.me");
} catch (err) {
  console.error(`Failed to fetch Fear & Greed: ${err?.message ?? err}`);
  process.exit(1);
}
