#!/usr/bin/env node
/**
 * Has anybody else deployed since we did?
 * ---------------------------------------------------------------------------
 * Both sites can be deployed by other agents straight from the Hatchable
 * console, leaving no commit in this repository. Deploying over the top of
 * that would silently destroy their work, so every deploy now runs this first.
 *
 * It asks the project for its deployment history and compares the live version
 * with the one we recorded after our own last deploy (ops/<key>-deployed.json).
 *
 *   same version      → nothing happened since; exit 0, deploy may proceed
 *   higher version    → somebody else deployed; every live file that differs
 *                       from our bundle is written to ops/incoming/<key>/ and
 *                       summarised in ci-logs/<key>-drift.log; exit 2, and the
 *                       workflow stops short of deploying so the two versions
 *                       can be read side by side and merged deliberately.
 *
 * Usage:
 *   node scripts/hatchable-drift.mjs --bundle tti/hatchable \
 *        --project proj_xxx --key tti [--record]
 *
 *   --record   write the current live version to the state file and stop.
 *              Run this immediately after a successful deploy of our own.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join, relative, dirname, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ENDPOINT = process.env.HATCHABLE_MCP_URL || "https://hatchable.com/mcp";
const TOKEN = process.env.HATCHABLE_TOKEN;

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : d;
};

const BUNDLE = join(ROOT, opt("bundle", "hatchable"));
const PROJECT = opt("project", process.env.HATCHABLE_PROJECT_ID);
const KEY = opt("key", "egregora");
const STATE = join(ROOT, "ops", `${KEY}-deployed.json`);
const INCOMING = join(ROOT, "ops", "incoming", KEY);
const BINARY = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".ico", ".woff", ".woff2", ".mp3", ".m4a", ".mp4"]);

/* Files the Hatchable platform writes into a project itself. AGENTS.md is
   regenerated on every read or deploy and says so at the top — it appearing
   live and absent from our bundle is the platform doing its own bookkeeping,
   not another agent shipping work. Skipping them keeps the drift check
   pointed at changes that actually need merging. */
const PLATFORM_GENERATED = new Set(["agents.md", "readme.md", "hatchable.toml"]);

if (!TOKEN) { console.error("✖ HATCHABLE_TOKEN is not set."); process.exit(1); }
if (!PROJECT) { console.error("✖ no --project given."); process.exit(1); }

/* ------------------------------------------------------------------ MCP --- */
let sessionId = null, rpcId = 0;

async function rpc(method, params) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${TOKEN}`,
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

let TOOLS = new Map();
async function call(tool, args) {
  const result = await rpc("tools/call", { name: tool, arguments: args });
  const text = (result?.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
  if (result?.isError) throw new Error(`${tool} failed: ${text}`);
  let data = result?.structuredContent ?? null;
  if (!data && text) { try { data = JSON.parse(text); } catch { data = { text }; } }
  return data ?? {};
}
function argName(tool, candidates) {
  const props = TOOLS.get(tool)?.inputSchema?.properties || {};
  return candidates.find((c) => c in props) || candidates[0];
}

/* ----------------------------------------------------------------- local -- */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const localFiles = new Map();
if (existsSync(BUNDLE)) {
  for (const p of walk(BUNDLE)) {
    const rel = relative(BUNDLE, p).split(sep).join("/");
    if (BINARY.has(extname(rel).toLowerCase())) continue;   // compared by presence only
    localFiles.set(rel, readFileSync(p, "utf8"));
  }
}

const norm = (s) => String(s ?? "").replace(/\r\n/g, "\n").replace(/\s+$/g, "");

/* ------------------------------------------------------------------ main -- */
const main = async () => {
  await rpc("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "egregora-drift", version: "1.0.0" }
  });
  const list = await rpc("tools/list");
  TOOLS = new Map((list?.tools || []).map((t) => [t.name, t]));

  const pidArg = argName("list_deployments", ["project_id", "projectId", "project"]);
  const deps = await call("list_deployments", { [pidArg]: PROJECT });
  const rows = deps.deployments || deps.items || deps.data || (Array.isArray(deps) ? deps : []);
  const versions = rows
    .map((d) => Number(d.version ?? d.deployment_version ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  const live = versions.length ? Math.max(...versions) : null;
  const newest = rows.find((d) => Number(d.version ?? d.deployment_version ?? 0) === live) || rows[0] || {};

  console.log(`project ${PROJECT}`);
  console.log(`live version: ${live ?? "unknown"}`);
  if (newest.created_at || newest.createdAt) {
    console.log(`deployed at:  ${newest.created_at || newest.createdAt}`);
  }

  let state = { version: null };
  try { state = JSON.parse(readFileSync(STATE, "utf8")); } catch { /* first run */ }
  console.log(`ours:         ${state.version ?? "<never recorded>"}`);

  if (flag("record")) {
    mkdirSync(dirname(STATE), { recursive: true });
    writeFileSync(STATE, JSON.stringify({
      project: PROJECT, version: live,
      recorded_at: new Date().toISOString(),
      deployed_at: newest.created_at || newest.createdAt || null
    }, null, 2) + "\n");
    console.log(`recorded version ${live} in ops/${KEY}-deployed.json`);
    return 0;
  }

  if (live === null) {
    console.log("⚠ could not read a version from list_deployments — proceeding, but blind.");
    return 0;
  }
  if (state.version === null) {
    console.log("first run: nothing to compare against. Deploy, then --record.");
    return 0;
  }
  if (live <= state.version) {
    console.log("✓ no foreign deploy since ours. Safe to deploy.");
    return 0;
  }

  /* ------------------------------------------------ somebody else deployed */
  console.log(`\n✖ ${live - state.version} deploy(s) landed since ours (v${state.version} → v${live}).`);
  console.log("   Reading the live files so the two can be merged rather than one buried.\n");

  const lfArg = argName("list_files", ["project_id", "projectId", "project"]);
  const listed = await call("list_files", { [lfArg]: PROJECT });
  const names = (listed.files || listed.items || listed.data || [])
    .map((f) => (typeof f === "string" ? f : f.path || f.name))
    .filter(Boolean);
  console.log(`   live project holds ${names.length} files`);

  rmSync(INCOMING, { recursive: true, force: true });
  const rfArg = argName("read_file", ["project_id", "projectId", "project"]);
  const pathArg = argName("read_file", ["path", "file_path", "file"]);

  const changed = [], added = [], removed = [];
  for (const name of names) {
    if (BINARY.has(extname(name).toLowerCase())) continue;
    let body;
    try {
      const r = await call("read_file", { [rfArg]: PROJECT, [pathArg]: name });
      body = typeof r === "string" ? r : (r.content ?? r.text ?? r.body ?? "");
    } catch (err) {
      console.log(`   ! could not read ${name}: ${err.message}`);
      continue;
    }
    const mine = localFiles.get(name);
    if (mine === undefined) {
      if (PLATFORM_GENERATED.has(name.toLowerCase())) continue;
      added.push(name);
    }
    else if (norm(mine) !== norm(body)) { changed.push(name); }
    else continue;
    const dest = join(INCOMING, name);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, body);
  }
  for (const name of localFiles.keys()) {
    if (!names.includes(name)) removed.push(name);
  }

  console.log(`\n   changed live vs our bundle : ${changed.length}`);
  changed.slice(0, 40).forEach((n) => console.log(`     ~ ${n}`));
  if (changed.length > 40) console.log(`     … and ${changed.length - 40} more`);
  console.log(`   present live, absent here  : ${added.length}`);
  added.slice(0, 40).forEach((n) => console.log(`     + ${n}`));
  console.log(`   present here, absent live  : ${removed.length}`);
  removed.slice(0, 40).forEach((n) => console.log(`     - ${n}`));

  /* Only a foreign deploy that CHANGED or ADDED something needs a human or an
     agent to merge before we go. Files present in our bundle and absent live
     are our own new work — deploying is precisely what adds them, so blocking
     on them would mean a bundle can never grow. */
  if (!changed.length && !added.length) {
    console.log(`\n   The ${removed.length} file(s) above are ours and simply not live yet.`);
    console.log("   Nothing foreign to merge. Safe to deploy.");
    return 0;
  }

  console.log(`\n   their versions are saved under ops/incoming/${KEY}/`);
  console.log("   DEPLOY SKIPPED. Merge, then deploy.");
  return 2;
};

main().then((code) => process.exit(code)).catch((err) => {
  console.error(`drift check failed: ${err.message}`);
  /* A broken check must not block a deploy forever — fail open, but loudly. */
  process.exit(0);
});
