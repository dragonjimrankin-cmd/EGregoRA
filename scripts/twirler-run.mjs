#!/usr/bin/env node
/**
 * Twirler — a hand on the studio's Hatchable project from CI
 * ---------------------------------------------------------------------------
 * The Twirler site is not in version control; it lives inside the Hatchable
 * project proj_uT6hbTUn8qxc, and the agent's sandbox has no egress. This
 * runs on the CI runner, which does, and is driven by ops/twirler-request.json:
 *
 *   {
 *     "mode": "show" | "patch" | "deploy",
 *     "show":  [ { "path": "public/index.html", "match": "swirler", "context": 4 } ],
 *     "patch": [ { "path": "public/style.css", "old": "…", "new": "…" } ]
 *   }
 *
 * "show" only reads. "patch" reads, applies every exact string swap and
 * writes the files back. "deploy" does that and then publishes. A patch whose
 * "old" is not found, or is found more than once, stops the run before
 * anything is written: nothing is ever guessed at.
 */

import { readFileSync } from "node:fs";

const ENDPOINT = process.env.HATCHABLE_MCP_URL || "https://hatchable.com/mcp";
const TOKEN = process.env.HATCHABLE_TOKEN;
const PROJECT = process.env.TWIRLER_PROJECT_ID || "proj_uT6hbTUn8qxc";
const REQ = process.argv[2] || "ops/twirler-request.json";

if (!TOKEN) { console.error("HATCHABLE_TOKEN is not set."); process.exit(1); }

let sessionId = null, rpcId = 0;

async function rpc(method, params) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    authorization: "Bearer " + TOKEN,
    "mcp-protocol-version": "2025-03-26"
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const res = await fetch(ENDPOINT, {
    method: "POST", headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, ...(params ? { params } : {}) })
  });
  const sid = res.headers.get("mcp-session-id");
  if (sid) sessionId = sid;
  const raw = await res.text();
  if (!res.ok) throw new Error(`${method} → HTTP ${res.status}: ${raw.slice(0, 300)}`);
  if (!raw.trim()) return null;
  let payload = raw;
  if (raw.startsWith("event:") || raw.includes("\ndata:") || raw.startsWith("data:")) {
    const frames = raw.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
    payload = frames[frames.length - 1] || "{}";
  }
  const json = JSON.parse(payload);
  if (json.error) throw new Error(`${method} → ${json.error.message || JSON.stringify(json.error)}`);
  return json.result;
}

async function notify(method, params = {}) {
  await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: "Bearer " + TOKEN,
      "mcp-protocol-version": "2025-03-26",
      ...(sessionId ? { "mcp-session-id": sessionId } : {})
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params })
  }).catch(() => {});
}

async function call(tool, args) {
  const result = await rpc("tools/call", { name: tool, arguments: args });
  const text = (result?.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
  if (result?.isError) throw new Error(`${tool} failed: ${text.slice(0, 400)}`);
  let data = result?.structuredContent ?? null;
  if (!data && text) { try { data = JSON.parse(text); } catch { data = { text }; } }
  return data ?? { text };
}

function textFrom(data) {
  if (data == null) return null;
  if (typeof data === "string") return data;
  for (const k of ["content", "text", "body", "source"]) if (typeof data[k] === "string") return data[k];
  if (data.file && typeof data.file.content === "string") return data.file.content;
  return null;
}

const cache = new Map();
async function readFile(path) {
  if (cache.has(path)) return cache.get(path);
  const body = textFrom(await call("read_file", { project_id: PROJECT, path }));
  if (body == null) throw new Error("could not read " + path);
  cache.set(path, body);
  return body;
}

(async () => {
  const req = JSON.parse(readFileSync(REQ, "utf8"));
  const mode = req.mode || "show";
  console.log(`▸ ${ENDPOINT} — ${PROJECT} — mode ${mode}`);

  await rpc("initialize", {
    protocolVersion: "2025-03-26", capabilities: {},
    clientInfo: { name: "twirler-run", version: "1.0.0" }
  });
  await notify("notifications/initialized");

  /* ---- show: print the lines asked for, with a little either side ------- */
  for (const s of req.show || []) {
    const body = await readFile(s.path);
    const lines = body.split("\n");
    const ctx = Number.isInteger(s.context) ? s.context : 3;
    console.log(`\n── ${s.path} (${lines.length} lines)`);
    if (s.all) { lines.forEach((l, i) => console.log(String(i + 1).padStart(5) + "  " + l)); continue; }
    const re = new RegExp(s.match, s.flags || "i");
    const wanted = new Set();
    lines.forEach((l, i) => {
      if (re.test(l)) for (let j = Math.max(0, i - ctx); j <= Math.min(lines.length - 1, i + ctx); j++) wanted.add(j);
    });
    if (!wanted.size) { console.log("   (no match for " + s.match + ")"); continue; }
    let last = -2;
    for (const i of [...wanted].sort((a, b) => a - b)) {
      if (i !== last + 1) console.log("   …");
      console.log(String(i + 1).padStart(5) + "  " + lines[i]);
      last = i;
    }
  }

  if (mode === "show") { console.log("\n▸ look only."); return; }

  /* ---- patch: every swap must match exactly once ------------------------ */
  const next = new Map();
  for (const p of req.patch || []) {
    const body = next.has(p.path) ? next.get(p.path) : await readFile(p.path);
    const count = body.split(p.old).length - 1;
    if (count !== 1) {
      console.error(`✖ ${p.path}: "${p.old.slice(0, 60)}…" matched ${count} time(s), expected 1. Nothing written.`);
      process.exit(1);
    }
    next.set(p.path, body.replace(p.old, p.new));
    console.log(`  ✓ staged ${p.path}: ${p.note || p.old.slice(0, 60)}`);
  }
  if (!next.size) { console.log("▸ nothing to patch."); return; }

  const files = [...next.entries()].map(([path, content]) => ({ path, content }));
  await call("write_files", { project_id: PROJECT, files, reason: req.reason || "Agent edit" });
  console.log(`▸ wrote ${files.map((f) => f.path).join(", ")}`);

  const dry = await call("dry_run_deploy", { project_id: PROJECT });
  console.log("▸ dry run: " + JSON.stringify(dry).slice(0, 600));
  if (dry.blockers?.length || dry.errors?.length) { console.error("✖ blockers — not deploying."); process.exit(1); }

  if (mode !== "deploy") { console.log("▸ written, not deployed."); return; }
  const out = await call("deploy", {
    project_id: PROJECT,
    intent: req.intent || "Agent edit",
    summary: req.summary || req.reason || "Agent edit to the Twirler site."
  });
  console.log("✔ " + JSON.stringify(out).slice(0, 700));
})().catch((e) => { console.error("✖ " + e.message); process.exit(1); });
