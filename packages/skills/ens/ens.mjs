#!/usr/bin/env node
// Resolve an ENS name <-> address via ensideas (free, no key).
// Usage: node ens.mjs <name.eth | 0xaddress>

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: ens.mjs <name.eth | 0xaddress>");
  process.exit(2);
}

try {
  const res = await fetch(
    `https://api.ensideas.com/ens/resolve/${encodeURIComponent(arg)}`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) {
    console.error(`ENS lookup error: HTTP ${res.status}`);
    process.exit(1);
  }
  const j = await res.json();
  if (!j.address) {
    console.log(`NOT_FOUND: no ENS resolution for "${arg}".`);
    process.exit(0);
  }
  console.log(j.displayName || j.name || arg);
  console.log(`Address: ${j.address}`);
  if (j.name) console.log(`ENS: ${j.name}`);
  if (j.avatar) console.log(`Avatar: ${j.avatar}`);
  console.log("Source: ENS / ensideas.");
} catch (err) {
  console.error(`Failed to resolve ENS: ${err?.message ?? err}`);
  process.exit(1);
}
