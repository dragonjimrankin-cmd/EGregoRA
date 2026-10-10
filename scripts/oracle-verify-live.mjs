#!/usr/bin/env node
/**
 * Verify that a deployed project really carries the current oracle corpus.
 *
 *   node scripts/oracle-verify-live.mjs
 *
 * A deploy returning exit 0 says the API accepted the files; it does not say
 * the live project can answer a question that only a new entry covers. This
 * asks the live project directly, with the server-side grep, for entry ids
 * that exist only in the newest volumes — so a stale or partial deploy shows
 * up instead of hiding behind a green checkmark.
 *
 * Exits 1 if either project is missing anything.
 */

const ENDPOINT = process.env.HATCHABLE_MCP_URL || "https://hatchable.com/mcp";
const TOKEN = process.env.HATCHABLE_TOKEN;

/* Read straight off disk so this can never drift from what we ship. */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const PROJECTS = [
  { name: "EGregoRA (Gink)", id: process.env.EGREGORA_PROJECT_ID || "proj_eiuxpFfTnwwx" },
  { name: "The Two Infinities (ShakDrah)", id: process.env.TTI_PROJECT_ID || "proj_U95i5y493z9x" }
];

/* Which local volume files hold which ids — the newest few are the ones a
   stale deploy would be missing. */
const volFiles = readdirSync(path.join(ROOT, "hatchable", "lib"))
  .filter((f) => /^oracle-corpus-.*\.js$/.test(f))
  .sort();
const newest = volFiles.slice(-5);
const wanted = [];
for (const f of newest) {
  const body = readFileSync(path.join(ROOT, "hatchable", "lib", f), "utf8");
  for (const m of body.matchAll(/E\('([a-z0-9-]+)'/g)) wanted.push({ file: f, id: m[1] });
}

if (!TOKEN) { console.error("HATCHABLE_TOKEN is not set."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let sessionId = null, rpcId = 0;

async function rpcOnce(method, params) {
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
  if (!res.ok) throw new Error(`${method} → HTTP ${res.status}: ${raw.slice(0, 200)}`);
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

async function rpc(method, params) {
  for (let attempt = 1; ; attempt++) {
    try { return await rpcOnce(method, params); }
    catch (err) {
      if (!/HTTP 429/.test(err.message) || attempt >= 6) throw err;
      const wait = 20000 * attempt;
      console.log(`   … 429 on ${method}, waiting ${wait / 1000}s`);
      await sleep(wait);
    }
  }
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
const argName = (tool, cands) => {
  const props = TOOLS.get(tool)?.inputSchema?.properties || {};
  return cands.find((c) => c in props) || cands[0];
};

const main = async () => {
  await rpc("initialize", {
    protocolVersion: "2025-03-26", capabilities: {},
    clientInfo: { name: "oracle-verify-live", version: "1.0.0" }
  });
  TOOLS = new Map(((await rpc("tools/list"))?.tools || []).map((t) => [t.name, t]));

  const pidArg = argName("grep", ["project_id", "projectId", "project"]);
  const patArg = argName("grep", ["pattern", "query", "q", "search"]);
  const rfPid = argName("read_file", ["project_id", "projectId", "project"]);
  const rfPath = argName("read_file", ["path", "file_path", "file"]);

  console.log(`checking ${wanted.length} entry ids across ${newest.length} newest volumes\n`);

  let failed = false;
  for (const proj of PROJECTS) {
    console.log(`${proj.name} — ${proj.id}`);
    let live = "";
    try {
      const r = await call("read_file", { [rfPid]: proj.id, [rfPath]: "lib/oracle-corpus.js" });
      live = typeof r === "string" ? r : (r.content ?? r.text ?? r.body ?? "");
    } catch (err) {
      console.log(`  ! could not read lib/oracle-corpus.js: ${err.message}`);
      failed = true;
      continue;
    }

    /* The aggregator must import every new volume, or the entries are on disk
       and never reach ANSWERS. */
    const missingImports = newest
      .map((f) => f.replace(/\.js$/, ""))
      .filter((stem) => !live.includes(`./${stem}.js`));
    if (missingImports.length) {
      console.log(`  ✖ aggregator does not import: ${missingImports.join(", ")}`);
      failed = true;
    } else {
      console.log(`  ✓ aggregator imports all ${newest.length} newest volumes`);
    }

    /* And the volume files themselves must be there with their entries. */
    let checked = 0, missing = [];
    for (const f of newest) {
      let body = "";
      try {
        const r = await call("read_file", { [rfPid]: proj.id, [rfPath]: `lib/${f}` });
        body = typeof r === "string" ? r : (r.content ?? r.text ?? r.body ?? "");
      } catch (err) {
        console.log(`  ✖ lib/${f}: ${err.message}`);
        failed = true;
        continue;
      }
      const ids = wanted.filter((w) => w.file === f);
      const absent = ids.filter((w) => !body.includes(`'${w.id}'`));
      checked += ids.length;
      if (absent.length) {
        missing.push(...absent.map((a) => a.id));
      } else {
        console.log(`  ✓ lib/${f}: all ${ids.length} entries present`);
      }
      await sleep(600);
    }
    if (missing.length) {
      console.log(`  ✖ ${missing.length} entries missing: ${missing.slice(0, 10).join(", ")}`);
      failed = true;
    } else {
      console.log(`  ✓ ${checked} entries verified live`);
    }
    console.log();
    await sleep(1200);
  }

  if (failed) { console.log("VERIFICATION FAILED — a project is not carrying the current corpus."); process.exit(1); }
  console.log("VERIFIED — both live projects carry the current corpus.");
};

main().catch((err) => { console.error(err.message); process.exit(1); });
