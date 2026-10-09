#!/usr/bin/env node
/**
 * Look at what is on Hatchable, and pull a project down into the repo.
 * ---------------------------------------------------------------------------
 * Not every project was created from here. This lists them, and can clone one
 * into a working folder so it can be edited and redeployed like the others.
 *
 *   node scripts/hatchable-inspect.mjs                      # list all projects
 *   node scripts/hatchable-inspect.mjs --project proj_x     # list its files
 *   node scripts/hatchable-inspect.mjs --project proj_x --pull shakra/hatchable
 *
 * --pull writes every text file into the given folder, preserving paths, so a
 * later `hatchable-deploy.mjs --bundle <folder> --project proj_x` can put the
 * edited version back. Binary files are listed but not fetched.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ENDPOINT = process.env.HATCHABLE_MCP_URL || "https://hatchable.com/mcp";
const TOKEN = process.env.HATCHABLE_TOKEN;

const argv = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : d;
};
const PROJECT = opt("project");
const PULL = opt("pull");
const BINARY = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".ico", ".woff", ".woff2",
  ".mp3", ".m4a", ".mp4", ".pdf", ".zip"]);

if (!TOKEN) { console.error("✖ HATCHABLE_TOKEN is not set."); process.exit(1); }

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

const main = async () => {
  await rpc("initialize", {
    protocolVersion: "2025-03-26", capabilities: {},
    clientInfo: { name: "egregora-inspector", version: "1.0.0" }
  });
  TOOLS = new Map(((await rpc("tools/list"))?.tools || []).map((t) => [t.name, t]));

  if (!PROJECT) {
    const out = await call("list_projects", {});
    const rows = out.projects || out.items || out.data || (Array.isArray(out) ? out : []);
    console.log(`${rows.length} projects on this account\n`);
    for (const p of rows) {
      console.log(`── ${p.name || p.title || "(unnamed)"}`);
      console.log(`   id:         ${p.id || p.project_id}`);
      console.log(`   slug:       ${p.slug || "—"}`);
      console.log(`   url:        ${p.url || p.site_url || "—"}`);
      console.log(`   visibility: ${p.visibility || "—"}   version: ${p.version ?? "—"}`);
      console.log(`   updated:    ${p.updated_at || p.updatedAt || "—"}`);
    }
    if (!rows.length) console.log(JSON.stringify(out).slice(0, 2000));
    return;
  }

  const meta = await call("get_project", { [argName("get_project", ["project_id", "projectId", "id"])]: PROJECT });
  console.log(JSON.stringify(meta, null, 2).slice(0, 2500));

  const lfArg = argName("list_files", ["project_id", "projectId", "project"]);
  const listed = await call("list_files", { [lfArg]: PROJECT });
  const names = (listed.files || listed.items || listed.data || [])
    .map((f) => (typeof f === "string" ? f : f.path || f.name)).filter(Boolean);
  console.log(`\n${names.length} files`);
  names.forEach((n) => console.log(`   ${n}`));

  if (!PULL) return;

  const rfArg = argName("read_file", ["project_id", "projectId", "project"]);
  const pathArg = argName("read_file", ["path", "file_path", "file"]);
  let got = 0, skipped = 0;
  for (const name of names) {
    if (BINARY.has(extname(name).toLowerCase())) { skipped++; continue; }
    try {
      const r = await call("read_file", { [rfArg]: PROJECT, [pathArg]: name });
      const body = typeof r === "string" ? r : (r.content ?? r.text ?? r.body ?? "");
      const dest = join(ROOT, PULL, name);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, body);
      got++;
    } catch (err) {
      console.log(`   ! ${name}: ${err.message}`);
    }
  }
  console.log(`\npulled ${got} text files into ${PULL}/ (${skipped} binary files left behind)`);
};

main().catch((err) => { console.error(err.message); process.exit(1); });
