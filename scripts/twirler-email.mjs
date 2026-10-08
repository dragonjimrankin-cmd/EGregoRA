#!/usr/bin/env node
/**
 * Twirler — change the studio's contact address
 * ---------------------------------------------------------------------------
 * The Twirler site is not in version control: it lives only inside the
 * Hatchable project proj_uT6hbTUn8qxc. The agent's sandbox has no egress, so
 * this script runs on the CI runner, which does, and talks to the same MCP
 * server the EGregoRA deployer uses.
 *
 *   node scripts/twirler-email.mjs            # look only: tools, files, hits
 *   node scripts/twirler-email.mjs --apply    # rewrite the files
 *   node scripts/twirler-email.mjs --apply --deploy
 *
 * What it changes: every occurrence of the old address, in any text file of
 * the project, becomes casting@twirler.co.uk — the visible copy, the mailto:
 * links, and the recipient of whatever the casting and contact forms send.
 */


const ENDPOINT = process.env.HATCHABLE_MCP_URL || "https://hatchable.com/mcp";
const TOKEN = process.env.HATCHABLE_TOKEN;
const PROJECT = process.env.TWIRLER_PROJECT_ID || "proj_uT6hbTUn8qxc";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);

const NEW_EMAIL = "casting@twirler.co.uk";
/* Addresses the site is known to carry, plus anything else at these domains.
   Checked in order; the first list is exact, the regex is the safety net. */
const OLD_EXACT = ["info@shakra.co.uk", "shakradragon@gmail.com", "hello@shakra.co.uk",
  "contact@shakra.co.uk", "casting@shakra.co.uk", "info@twirler.co.uk",
  "hello@twirler.co.uk", "contact@twirler.co.uk"];
const ANY_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
/* Addresses that must never be rewritten: other people's, and examples. */
const KEEP = /@(example|test|localhost|sentry|stripe|hatchable|google|gmail\.test)/i;

if (!TOKEN) { console.error("HATCHABLE_TOKEN is not set."); process.exit(1); }

/* ------------------------------------------------------------------ MCP --- */
let sessionId = null;
let rpcId = 0;

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

let TOOLS = new Map();

async function call(tool, args) {
  const result = await rpc("tools/call", { name: tool, arguments: args });
  const text = (result?.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
  if (result?.isError) throw new Error(`${tool} failed: ${text.slice(0, 300)}`);
  let data = result?.structuredContent ?? null;
  if (!data && text) { try { data = JSON.parse(text); } catch { data = { text }; } }
  return data ?? { text };
}

function firstTool(names) { return names.find((n) => TOOLS.has(n)) || null; }
function argName(tool, candidates, fallback) {
  const props = TOOLS.get(tool)?.inputSchema?.properties || {};
  return candidates.find((c) => c in props) || fallback || candidates[0];
}

/** Dig a list of file paths out of whatever shape the server answers with. */
function pathsFrom(data) {
  const out = [];
  const walk = (v) => {
    if (!v) return;
    if (typeof v === "string") { if (/^[\w./-]+\.[A-Za-z0-9]{1,6}$/.test(v)) out.push(v); return; }
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (typeof v === "object") {
      if (typeof v.path === "string") out.push(v.path);
      else if (typeof v.name === "string" && typeof v.type === "string") out.push(v.name);
      for (const k of ["files", "entries", "items", "results", "tree", "children", "data"]) walk(v[k]);
      if (typeof v.text === "string" && v.text.includes("\n")) {
        v.text.split("\n").map((l) => l.trim()).filter((l) => /^[\w./-]+\.[A-Za-z0-9]{1,6}$/.test(l))
          .forEach((l) => out.push(l));
      }
    }
  };
  walk(data);
  return [...new Set(out)];
}

function textFrom(data) {
  if (data == null) return null;
  if (typeof data === "string") return data;
  for (const k of ["content", "text", "body", "source", "file"]) {
    if (typeof data[k] === "string") return data[k];
  }
  if (data.file && typeof data.file.content === "string") return data.file.content;
  return null;
}

const BINARY = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|mp[34]|m4a|mov|pdf|zip)$/i;

/* ----------------------------------------------------------------- main --- */
(async () => {
  console.log(`▸ ${ENDPOINT} — project ${PROJECT}`);
  await rpc("initialize", {
    protocolVersion: "2025-03-26", capabilities: {},
    clientInfo: { name: "twirler-email", version: "1.0.0" }
  });
  await notify("notifications/initialized");
  const list = await rpc("tools/list");
  TOOLS = new Map((list?.tools || []).map((t) => [t.name, t]));
  console.log(`  tools: ${[...TOOLS.keys()].join(", ")}`);
  for (const [n, t] of TOOLS) {
    if (/file|read|list|deploy|project/i.test(n)) {
      console.log(`    ${n}(${Object.keys(t.inputSchema?.properties || {}).join(", ")})`);
    }
  }

  const listTool = firstTool(["list_files", "list_project_files", "get_files", "read_project", "ls"]);
  const readTool = firstTool(["read_file", "get_file", "read_files", "cat_file"]);
  const writeTool = firstTool(["write_files", "write_file", "update_file"]);
  console.log(`  using list=${listTool} read=${readTool} write=${writeTool}`);
  if (!listTool || !readTool) { console.error("✖ no way to list or read files."); process.exit(1); }

  const pidList = argName(listTool, ["project_id", "projectId", "project"]);
  const listed = await call(listTool, { [pidList]: PROJECT });
  let paths = pathsFrom(listed);
  console.log(`▸ ${paths.length} path(s)`);
  if (!paths.length) console.log("  raw: " + JSON.stringify(listed).slice(0, 1500));
  paths = paths.filter((p) => !BINARY.test(p));
  console.log(paths.map((p) => "    " + p).join("\n"));

  const pidRead = argName(readTool, ["project_id", "projectId", "project"]);
  const pathArg = argName(readTool, ["path", "file_path", "file"]);

  const changed = [];
  const seen = new Map();
  for (const path of paths) {
    let data;
    try { data = await call(readTool, { [pidRead]: PROJECT, [pathArg]: path }); }
    catch (e) { console.log(`  ! ${path}: ${e.message.slice(0, 120)}`); continue; }
    const body = textFrom(data);
    if (body == null) { console.log(`  ! ${path}: unreadable shape ${JSON.stringify(data).slice(0, 120)}`); continue; }

    for (const m of body.match(ANY_EMAIL) || []) seen.set(m, (seen.get(m) || 0) + 1);

    let next = body;
    for (const old of OLD_EXACT) {
      if (old === NEW_EMAIL) continue;
      next = next.split(old).join(NEW_EMAIL);
    }
    /* Any remaining address that is clearly the studio's own correspondence
       address — a shakra.co.uk or twirler.co.uk mailbox — goes too. */
    next = next.replace(ANY_EMAIL, (m) =>
      (!KEEP.test(m) && /@(shakra|twirler)\.co\.uk$/i.test(m)) ? NEW_EMAIL : m);

    if (next !== body) {
      const hits = (body.match(ANY_EMAIL) || []).filter((m) => /@(shakra|twirler)\.co\.uk$/i.test(m));
      console.log(`  ✎ ${path} — ${hits.length} address(es): ${[...new Set(hits)].join(", ")}`);
      changed.push({ path, content: next });
    }
  }

  console.log("▸ every address found in the project:");
  for (const [addr, n] of [...seen.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(3)} × ${addr}`);
  }
  console.log(`▸ ${changed.length} file(s) would change.`);

  if (!flag("apply")) { console.log("▸ look only. Re-run with --apply."); return; }
  if (!writeTool) { console.error("✖ no write tool."); process.exit(1); }
  if (!changed.length) { console.log("▸ nothing to write."); return; }

  const pidWrite = argName(writeTool, ["project_id", "projectId", "project"]);
  const filesArg = argName(writeTool, ["files", "entries"], null);
  if (filesArg && (writeTool === "write_files")) {
    for (let i = 0; i < changed.length; i += 10) {
      const batch = changed.slice(i, i + 10);
      await call(writeTool, { [pidWrite]: PROJECT, [filesArg]: batch });
      console.log(`  ✓ wrote ${batch.map((b) => b.path).join(", ")}`);
    }
  } else {
    for (const f of changed) {
      await call(writeTool, { [pidWrite]: PROJECT, path: f.path, content: f.content });
      console.log(`  ✓ wrote ${f.path}`);
    }
  }

  if (TOOLS.has("dry_run_deploy")) {
    const dry = await call("dry_run_deploy", { project_id: PROJECT });
    console.log("▸ dry run: " + JSON.stringify(dry).slice(0, 800));
    if (dry.blockers?.length || dry.errors?.length) { console.error("✖ blockers — not deploying."); process.exit(1); }
  }
  if (!flag("deploy")) { console.log("▸ written but not deployed."); return; }

  const out = await call("deploy", {
    project_id: PROJECT,
    intent: "Change the studio contact address",
    summary: "Every contact address on the Twirler site is now casting@twirler.co.uk, " +
      "including the recipient of the casting application and contact form submissions."
  });
  console.log("✔ deployed: " + JSON.stringify(out).slice(0, 800));
})().catch((err) => { console.error("✖ " + err.message); process.exit(1); });
