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

/* The addresses that should be on the site, and the ones being retired. */
const CASTING = "casting@twirler.co.uk";
const DRAGON = "shakradragon@gmail.com";
const OLD = ["info@shakra.co.uk", "hello@shakra.co.uk", "contact@shakra.co.uk",
  "support@shakra.co.uk", "admin@shakra.co.uk", "dragon.jim.rankin@gmail.com"];
const KEEP = new Set([CASTING, DRAGON]);

/**
 * Rewrite one file's worth of text.
 *
 * Where a line is addressing an envelope — a mailto: href, or a `to:` field in
 * a mail call — only one address can go in, and that is the casting address on
 * the real domain. Everywhere the address is being *shown* to a reader, both
 * are shown, because both are the site's contact addresses.
 */
function rewrite(body) {
  let out = body;
  for (const old of OLD) {
    const esc = old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`mailto:${esc}`, "gi"), `mailto:${CASTING}`);
    out = out.replace(new RegExp(`(\\bto\\s*:\\s*['"\`])${esc}`, "gi"), `$1${CASTING}`);
    out = out.replace(new RegExp(`(['"\`])${esc}\\1`, "gi"), `$1${CASTING}$1`);
    out = out.replace(new RegExp(esc, "gi"), `${CASTING} or ${DRAGON}`);
  }
  /* Never let the pair double up if a file is processed twice. */
  out = out.replace(
    new RegExp(`${CASTING.replace(/\./g, "\\.")} or ${DRAGON.replace(/\./g, "\\.")} or ${DRAGON.replace(/\./g, "\\.")}`, "gi"),
    `${CASTING} or ${DRAGON}`);
  return out;
}

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
  console.log(`grep args: ${Object.keys(gArgs).join(", ")}`);
  console.log(`grep schema: ${Object.keys(TOOLS.get("grep")?.inputSchema?.properties || {}).join(", ")}`);

  /* Try the regex, then plain "mailto:", then a bare "@" — whichever the
     server's grep understands and actually answers. */
  let text = "";
  for (const pat of [
    "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",
    "mailto:",
    "@gmail.com",
    "@"
  ]) {
    const args = { ...gArgs, output_mode: "content", "-n": true, head_limit: 500 };
    args[argName("grep", ["pattern", "query", "q", "search"])] = pat;
    let hits;
    try { hits = await call("grep", args); }
    catch (err) { console.log(`  grep "${pat}" failed: ${err.message}`); continue; }
    const t = typeof hits === "string" ? hits : JSON.stringify(hits, null, 1);
    console.log(`  grep "${pat}" → ${t.length} chars`);
    if (t.length > 40) { text = t; break; }
    await sleep(800);
  }
  console.log(`raw grep reply (first 2500 chars):\n${text.slice(0, 2500)}\n--- end ---`);

  const perFile = new Map();
  const lines = text.split("\n");
  for (const line of lines) {
    const addrs = line.match(EMAIL) || [];
    if (!addrs.length) continue;
    const m = line.match(/([\w./@-]+\.(?:html|js|mjs|css|json|md|txt|njk|sql|toml|webmanifest|xml))\s*:\s*\d+\s*:/i)
      || line.match(/"?(?:file|path)"?\s*[:=]\s*"?([^"',\s]+)/i)
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
      : OLD.includes(a) ? `→ ${CASTING} / ${DRAGON}`
        : "LEAVE (not a site contact address)";
    console.log(`  ${a.padEnd(34)} ${verdict}   [${where.slice(0, 6).join(", ")}]`);
  });

  const targets = [...perFile.entries()]
    .filter(([, s]) => [...s].some((a) => OLD.includes(a)))
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

    const out = rewrite(body);
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
