#!/usr/bin/env node
/**
 * Set the contact addresses on a Hatchable project that lives only in the
 * console — no local bundle, so the edit is made in place.
 *
 *   node scripts/hatchable-contact.mjs --project proj_x            # report
 *   node scripts/hatchable-contact.mjs --project proj_x --apply    # rewrite
 *   node scripts/hatchable-contact.mjs --project proj_x --apply --deploy
 *
 * It finds every email address in the project's text, lists them with the
 * files they appear in, and on --apply rewrites the ones named in REPLACE to
 * the pair of addresses the site should actually carry. Files are read, edited
 * and written back one at a time, with a pause between calls, because this API
 * answers a burst with 429.
 */

import { fileURLToPath } from "node:url";

const ENDPOINT = process.env.HATCHABLE_MCP_URL || "https://hatchable.com/mcp";
const TOKEN = process.env.HATCHABLE_TOKEN;

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : d;
};
const PROJECT = opt("project");
const PAUSE = Number(opt("pause", "1200"));

/* The addresses that should be on the site, and what to turn into what. */
const CASTING = "casting@twirler.co.uk";
const DRAGON = "shakradragon@gmail.com";

/* Any address matching a key is replaced by its value. The pair is written as
   "casting@twirler.co.uk" where one address is wanted and both are offered
   where the markup has room; a second pass adds the dragon address beside it. */
const REPLACE = new Map([
  ["hello@shakra.co.uk", CASTING],
  ["contact@shakra.co.uk", CASTING],
  ["info@shakra.co.uk", CASTING],
  ["support@shakra.co.uk", CASTING],
  ["admin@shakra.co.uk", CASTING],
  ["hello@shakra-0ote.hatchable.site", CASTING],
  ["dragon.jim.rankin@gmail.com", DRAGON],
  ["jim@shakra.co.uk", DRAGON],
  ["ed@shakra.co.uk", DRAGON]
]);
const KEEP = new Set([CASTING, DRAGON]);

if (!TOKEN) { console.error("✖ HATCHABLE_TOKEN is not set."); process.exit(1); }
if (!PROJECT) { console.error("✖ no --project given."); process.exit(1); }

let sessionId = null, rpcId = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rpc(method, params, tries = 4) {
  for (let attempt = 1; attempt <= tries; attempt++) {
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
    if (res.status === 429) {
      const wait = 5000 * attempt;
      console.log(`   … 429, waiting ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
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
  throw new Error(`${method} → gave up after ${tries} attempts (429)`);
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

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const main = async () => {
  await rpc("initialize", {
    protocolVersion: "2025-03-26", capabilities: {},
    clientInfo: { name: "egregora-contact", version: "1.0.0" }
  });
  TOOLS = new Map(((await rpc("tools/list"))?.tools || []).map((t) => [t.name, t]));

  /* 1 — where are the addresses? One server-side grep instead of 150 reads. */
  const gArgs = {
    [argName("grep", ["project_id", "projectId", "project"])]: PROJECT,
    [argName("grep", ["pattern", "query", "q", "search"])]: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"
  };
  const hits = await call("grep", gArgs);
  const text = typeof hits === "string" ? hits : JSON.stringify(hits, null, 1);

  const perFile = new Map();
  const lines = text.split("\n");
  for (const line of lines) {
    const addrs = line.match(EMAIL) || [];
    if (!addrs.length) continue;
    const m = line.match(/"?(?:file|path)"?\s*[:=]\s*"?([^"',\s]+)/i)
      || line.match(/^\s*"?([\w./-]+\.(?:html|js|css|json|md|txt|njk|sql))"?\s*[:[]/i);
    const file = m ? m[1] : "(unknown)";
    if (!perFile.has(file)) perFile.set(file, new Set());
    addrs.forEach((a) => perFile.get(file).add(a.toLowerCase()));
  }

  const all = new Set();
  for (const set of perFile.values()) set.forEach((a) => all.add(a));
  console.log(`addresses found in the project (${all.size}):`);
  [...all].sort().forEach((a) => {
    const where = [...perFile.entries()].filter(([, s]) => s.has(a)).map(([f]) => f);
    const verdict = KEEP.has(a) ? "keep"
      : REPLACE.has(a) ? `→ ${REPLACE.get(a)}`
        : "LEAVE (not in the replace list)";
    console.log(`  ${a.padEnd(34)} ${verdict}   [${where.slice(0, 6).join(", ")}]`);
  });

  const targets = [...perFile.entries()]
    .filter(([, s]) => [...s].some((a) => REPLACE.has(a)))
    .map(([f]) => f)
    .filter((f) => f !== "(unknown)");

  console.log(`\nfiles needing a rewrite: ${targets.length}`);
  targets.forEach((f) => console.log(`  ${f}`));

  if (!flag("apply")) { console.log("\n(report only — pass --apply to rewrite)"); return; }

  /* 2 — read, edit, write back, slowly. */
  const rfP = argName("read_file", ["project_id", "projectId", "project"]);
  const rfPath = argName("read_file", ["path", "file_path", "file"]);
  const wfP = argName("write_file", ["project_id", "projectId", "project"]);
  const wfPath = argName("write_file", ["path", "file_path", "file"]);
  const wfBody = argName("write_file", ["content", "body", "text"]);

  let written = 0;
  for (const file of targets) {
    await sleep(PAUSE);
    let body;
    try {
      const r = await call("read_file", { [rfP]: PROJECT, [rfPath]: file });
      body = typeof r === "string" ? r : (r.content ?? r.text ?? r.body ?? "");
    } catch (err) { console.log(`  ! read ${file}: ${err.message}`); continue; }

    let out = body;
    for (const [from, to] of REPLACE) {
      out = out.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), to);
    }
    if (out === body) { console.log(`  = ${file} (nothing to change)`); continue; }

    await sleep(PAUSE);
    try {
      await call("write_file", { [wfP]: PROJECT, [wfPath]: file, [wfBody]: out });
      written++;
      console.log(`  ✓ ${file}`);
    } catch (err) { console.log(`  ! write ${file}: ${err.message}`); }
  }
  console.log(`\nrewrote ${written} files`);

  if (flag("deploy") && written) {
    await sleep(3000);
    const d = await call("deploy", { [argName("deploy", ["project_id", "projectId"])]: PROJECT });
    console.log(`deployed: version ${d.version ?? JSON.stringify(d).slice(0, 200)}`);
  }
};

main().catch((err) => { console.error(err.message); process.exit(1); });
