#!/usr/bin/env node
/**
 * OmniRoute reachability probe.
 *
 * OmniRoute is normally a self-hosted gateway (http://localhost:20128/v1), so
 * before wiring anything into EGregoRA we need to know whether the supplied
 * key belongs to a *hosted* endpoint we can actually reach from a server.
 *
 * Tries a list of candidate base URLs against /models (the OpenAI-compatible
 * discovery route) and reports status, latency and a short body sample.
 *
 *   OMNIROUTE_KEY=ci_live_… node scripts/omniroute-probe.mjs
 *   OMNIROUTE_BASE=https://my-gateway.example.com/v1 node scripts/omniroute-probe.mjs
 */

const KEY = process.env.OMNIROUTE_KEY || "";
const EXTRA = process.env.OMNIROUTE_BASE ? [process.env.OMNIROUTE_BASE] : [];

const CANDIDATES = [
  ...EXTRA,
  "https://omniroute.online/v1",
  "https://www.omniroute.online/v1",
  "https://api.omniroute.online/v1",
  "https://omniroute.online/api/v1",
  "https://gateway.omniroute.online/v1",
  "https://app.omniroute.online/v1",
  "https://omniroute.ai/v1",
  "https://api.omniroute.ai/v1",
  "https://api.omniroute.com/v1",
  "http://localhost:20128/v1",
  "http://localhost:11411/v1"
];

const redact = (s) => String(s).replace(/ci_live_[A-Za-z0-9]+/g, "ci_live_***").replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***");

async function probe(base) {
  const url = `${base.replace(/\/$/, "")}/models`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${KEY}`, accept: "application/json" },
      signal: AbortSignal.timeout(12000)
    });
    const body = (await res.text()).slice(0, 300);
    return { url, status: res.status, ms: Date.now() - t0, body: redact(body).replace(/\s+/g, " ") };
  } catch (e) {
    return { url, status: "ERR", ms: Date.now() - t0, body: redact(e.message) };
  }
}

const key = KEY ? `${KEY.slice(0, 8)}… (${KEY.length} chars)` : "MISSING";
console.log(`OmniRoute probe — key ${key}\n`);

const results = [];
for (const base of CANDIDATES) {
  const r = await probe(base);
  results.push(r);
  console.log(`${String(r.status).padEnd(5)} ${String(r.ms + "ms").padStart(7)}  ${r.url}`);
  if (r.body) console.log(`        ${r.body.slice(0, 220)}`);
}

const live = results.filter((r) => typeof r.status === "number" && r.status < 500);
console.log(`\n${live.length} endpoint(s) answered.`);
if (live.some((r) => r.status === 200)) {
  const ok = live.find((r) => r.status === 200);
  console.log(`USABLE: ${ok.url}`);
  process.exit(0);
}
if (live.some((r) => r.status === 401 || r.status === 403)) {
  console.log("Endpoint exists but rejected the key — wrong key or wrong gateway.");
}
process.exit(live.length ? 0 : 1);
