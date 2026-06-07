#!/usr/bin/env node
// Bankr wallet + agent via REST API (https://api.bankr.bot).
// Reads the key from the BANKR_API_KEY env var — the key is NEVER passed on the
// command line, so it never enters the model's context.
//
// Usage:
//   node bankr.mjs me
//   node bankr.mjs portfolio [chains]        e.g. base,solana
//   node bankr.mjs prompt "<plain-language request>"   (trade, transfer, launch, price, balance…)

const key = process.env.BANKR_API_KEY;
const base = process.env.BANKR_API_URL || "https://api.bankr.bot";
if (!key) {
  console.log(
    "NO_KEY: no Bankr key set. Run `stackai bankr set <bk_...>` (get one at bankr.bot/api-keys).",
  );
  process.exit(0);
}

const H = { "X-API-Key": key, "Content-Type": "application/json" };
const cmd = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: H });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
}

function fail(status, body) {
  if (status === 403) {
    console.error("Bankr 403: your key is read-only — re-issue it with --read-write at bankr.bot to trade/transfer/launch.");
  } else if (status === 401) {
    console.error("Bankr 401: invalid/expired key. Set a valid one with `stackai bankr set <bk_...>`.");
  } else {
    console.error(`Bankr error ${status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  process.exit(1);
}

try {
  if (cmd === "me") {
    const { ok, status, body } = await getJson(`${base}/wallet/me`);
    if (!ok) fail(status, body);
    console.log(JSON.stringify(body, null, 2));
  } else if (cmd === "portfolio") {
    const chains = process.argv[3] ? `&chains=${process.argv[3]}` : "";
    const { ok, status, body } = await getJson(`${base}/wallet/portfolio?include=pnl${chains}`);
    if (!ok) fail(status, body);
    console.log(JSON.stringify(body, null, 2));
  } else if (cmd === "prompt") {
    const prompt = process.argv.slice(3).join(" ");
    if (!prompt) { console.error('Usage: bankr.mjs prompt "<request>"'); process.exit(2); }
    const res = await fetch(`${base}/agent/prompt`, {
      method: "POST", headers: H, body: JSON.stringify({ prompt }),
    });
    const sub = await res.json().catch(() => ({}));
    if (!res.ok) fail(res.status, sub);
    const jobId = sub.jobId || sub.id || sub.job_id;
    if (!jobId) { console.error(`No job id in response: ${JSON.stringify(sub)}`); process.exit(1); }
    const start = Date.now();
    while (Date.now() - start < 110_000) {
      await sleep(2000);
      const jr = await fetch(`${base}/agent/job/${jobId}`, { headers: H });
      const job = await jr.json().catch(() => ({}));
      const st = job.status;
      if (st === "completed") { console.log(job.response ?? JSON.stringify(job, null, 2)); process.exit(0); }
      if (st === "failed" || st === "cancelled") {
        console.error(`Job ${st}: ${job.error ?? job.response ?? JSON.stringify(job)}`);
        process.exit(1);
      }
    }
    console.error("Timed out waiting for the Bankr job.");
    process.exit(1);
  } else {
    console.error('Usage: bankr.mjs <me | portfolio [chains] | prompt "<request>">');
    process.exit(2);
  }
} catch (err) {
  console.error(`Bankr request failed: ${err?.message ?? err}`);
  process.exit(1);
}
