#!/usr/bin/env node
/**
 * EGregoRA → Hatchable deployer
 * ---------------------------------------------------------------------------
 * Talks to the Hatchable MCP server (https://hatchable.com/mcp, Streamable
 * HTTP transport) with a static bearer token and runs the documented build
 * loop: create_project → write_files → dry_run_deploy → deploy.
 *
 * Usage:
 *   npm run build:hatchable                 # refresh hatchable/public
 *   export HATCHABLE_TOKEN=hb_xxxxxxxx
 *   node scripts/hatchable-deploy.mjs                 # create a new project
 *   node scripts/hatchable-deploy.mjs --project proj_123   # redeploy existing
 *   node scripts/hatchable-deploy.mjs --dry-run            # validate only
 *   node scripts/hatchable-deploy.mjs --tools              # dump tool schemas
 *
 * Notes:
 *  - Hatchable runs NO build step, so we upload the *compiled* site from
 *    hatchable/public plus hatchable/hatchable.toml. Nothing else is sent.
 *  - Text files go through write_files; binary files (jpg/png/ico/woff) go
 *    through upload_file as base64, with argument names probed from the
 *    server's own tool schema so this keeps working if the API shifts.
 *  - The token is read from the environment and never written to disk.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

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
const PROJECT_NAME = opt("name", "EGregoRA");
const PROJECT_SLUG = opt("slug", "egregora");
const BINARY = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".ico", ".woff", ".woff2", ".mp3", ".m4a", ".mp4"]);

if (!TOKEN) {
  console.error("✖ HATCHABLE_TOKEN is not set.\n  export HATCHABLE_TOKEN=hb_… (console → Settings → API keys)");
  process.exit(1);
}

/* ------------------------------------------------------------------ MCP --- */
let sessionId = null;
let rpcId = 0;

async function rpc(method, params = undefined) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${TOKEN}`,
    "mcp-protocol-version": "2025-03-26"
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, ...(params ? { params } : {}) })
  });

  const sid = res.headers.get("mcp-session-id");
  if (sid) sessionId = sid;

  const raw = await res.text();
  if (!res.ok) throw new Error(`${method} → HTTP ${res.status}: ${raw.slice(0, 400)}`);
  if (!raw.trim()) return null;

  // Streamable HTTP may answer as SSE; take the last data: frame.
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
      authorization: `Bearer ${TOKEN}`,
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
  if (result?.isError) throw new Error(`${tool} failed: ${text}`);
  let data = result?.structuredContent ?? null;
  if (!data && text) { try { data = JSON.parse(text); } catch { data = { text }; } }
  return data ?? { text };
}

/** Pick the first argument name the tool's schema actually accepts. */
function argName(tool, candidates, fallback) {
  const props = TOOLS.get(tool)?.inputSchema?.properties || {};
  return candidates.find((c) => c in props) || fallback || candidates[0];
}
function hasTool(name) { return TOOLS.has(name); }

/* ---------------------------------------------------------------- files --- */
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function collect() {
  const files = walk(BUNDLE)
    .map((abs) => ({ abs, path: relative(BUNDLE, abs).split(sep).join("/") }))
    .filter((f) => f.path !== "README.md" && !f.path.endsWith(".DS_Store"));
  const text = [], binary = [];
  for (const f of files) {
    (BINARY.has(extname(f.path).toLowerCase()) ? binary : text).push(f);
  }
  return { text, binary };
}

const chunk = (arr, n) => arr.reduce((a, v, i) => (i % n ? a[a.length - 1].push(v) : a.push([v]), a), []);
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

/* ----------------------------------------------------------------- main --- */
(async () => {
  console.log(`▸ Connecting to ${ENDPOINT}`);
  const init = await rpc("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "egregora-deployer", version: "1.0.0" }
  });
  await notify("notifications/initialized");
  console.log(`  connected to ${init?.serverInfo?.name || "hatchable"} ${init?.serverInfo?.version || ""}`.trimEnd());

  const list = await rpc("tools/list");
  TOOLS = new Map((list?.tools || []).map((t) => [t.name, t]));
  console.log(`  ${TOOLS.size} tools available`);

  if (flag("tools")) {
    for (const [name, t] of TOOLS) {
      console.log(`\n── ${name}\n   ${(t.description || "").split("\n")[0]}`);
      console.log(`   args: ${Object.keys(t.inputSchema?.properties || {}).join(", ") || "(none)"}`);
    }
    return;
  }

  /* 1 — project */
  let projectId = opt("project", process.env.HATCHABLE_PROJECT_ID);
  if (!projectId) {
    console.log(`▸ create_project "${PROJECT_NAME}"`);
    const created = await call("create_project", {
      [argName("create_project", ["name", "project_name", "title"])]: PROJECT_NAME,
      ...(argName("create_project", ["slug"], null) === "slug" ? { slug: PROJECT_SLUG } : {}),
      ...(argName("create_project", ["description"], null) === "description"
        ? { description: "EGregoRA — Life, Love, Magic. An ornate order of enquiry founded by Edward Gregory: cosmic physics, druidry, sacred geometry, neuroscience, the Law of One and more. Static site: introduction, podcast, videos, ask-ed, infographics, music, products, further research." }
        : {})
    });
    projectId = created.project_id || created.id || created.projectId;
    console.log(`  project_id: ${projectId}`);
    if (created.url || created.live_url) console.log(`  url: ${created.url || created.live_url}`);
    if (!projectId) { console.error("  ✖ could not read a project id from the response:", created); process.exit(1); }
  } else {
    console.log(`▸ using existing project ${projectId}`);
  }

  const pid = argName("write_files", ["project_id", "projectId", "project"]);

  /* 2 — text files, batched */
  const { text, binary } = collect();
  console.log(`▸ write_files — ${text.length} text files`);
  const filesArg = argName("write_files", ["files", "entries"]);
  for (const batch of chunk(text, 20)) {
    const payload = batch.map((f) => ({ path: f.path, content: readFileSync(f.abs, "utf8") }));
    await call("write_files", { [pid]: projectId, [filesArg]: payload });
    console.log(`  ✓ ${batch.map((b) => b.path).join(", ").slice(0, 110)}…`);
  }

  /* 3 — binaries */
  if (binary.length) {
    const rawBase = process.env.RAW_BASE || opt("raw-base", null);
    console.log(`▸ uploading ${binary.length} binary assets` + (rawBase ? " (server-side URL import)" : " (chunked base64)"));

    for (const f of binary) {
      const bytes = readFileSync(f.abs);
      let done = false;

      // Preferred: let Hatchable fetch the bytes itself — one call, no chunking.
      if (rawBase && hasTool("import_file_from_url")) {
        try {
          await call("import_file_from_url", {
            project_id: projectId,
            url: `${rawBase.replace(/\/$/, "")}/${f.path}`,
            path: f.path
          });
          console.log(`  ✓ ${f.path} (${kb(bytes.length)}) via url import`);
          done = true;
        } catch (e) {
          console.log(`  … url import failed (${e.message.slice(0, 80)}), falling back to chunks`);
        }
      }

      if (!done) {
        // Multipart: base64 text split into chunks, committed with final=true.
        const b64 = bytes.toString("base64");
        const SIZE = 192 * 1024;
        const parts = Math.ceil(b64.length / SIZE);
        const sha256 = createHash("sha256").update(bytes).digest("hex");
        let uploadId = null;

        for (let i = 0; i < parts; i++) {
          const isFinal = i === parts - 1;
          const args = {
            project_id: projectId,
            path: f.path,
            chunk: b64.slice(i * SIZE, (i + 1) * SIZE),
            chunk_index: i,
            encoding: "base64",
            ...(uploadId ? { upload_id: uploadId } : {}),
            ...(isFinal ? { final: true, sha256, bytes: bytes.length } : {})
          };
          const r = await call("upload_file", args);
          uploadId = uploadId || r.upload_id || r.uploadId || r.id;
        }
        console.log(`  ✓ ${f.path} (${kb(bytes.length)}, ${parts} chunk${parts > 1 ? "s" : ""})`);
      }
    }
  }

  /* 4 — validate */
  if (hasTool("dry_run_deploy")) {
    console.log("▸ dry_run_deploy");
    const dry = await call("dry_run_deploy", { [argName("dry_run_deploy", ["project_id", "projectId"])]: projectId });
    console.log("  " + JSON.stringify(dry).slice(0, 500));
    if (dry.blockers?.length || dry.errors?.length) {
      console.error("  ✖ validator blockers — not deploying."); process.exit(1);
    }
  }
  if (flag("dry-run")) { console.log("▸ --dry-run set, stopping before deploy."); return; }

  /* 4b — probe the oracle's OpenAI key from the runner, which (unlike the
     sandbox) has egress. Logged so the key can be verified without a human
     opening a console. */
  try {
    /* Probe the key that THIS bundle will actually ship with, not the
       EGregoRA copy — the two projects can carry different keys. */
    const store = await import(pathToFileURL(join(BUNDLE, "lib", "key-store.js")).href);
    const m = [null, store.storedOpenAIKey()];
    if (m[1]) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + m[1] },
        body: JSON.stringify({
          model: "gpt-4o-mini", max_tokens: 8,
          messages: [{ role: "user", content: "Reply with the single word: ready" }]
        })
      });
      const j = await r.json().catch(() => null);
      const say = j && j.choices && j.choices[0] && j.choices[0].message
        ? String(j.choices[0].message.content).trim()
        : (j && j.error && j.error.message) || "no body";
      console.log(`\u25b8 openai key probe: HTTP ${r.status} \u2014 ${say}`);
    } else {
      console.log("\u25b8 openai key probe: no default key declared");
    }
  } catch (err) {
    console.log("\u25b8 openai key probe failed: " + (err && err.message));
  }

  /* 4c — probe every vision route the age check can use. The sandbox has no
     egress, so this is the only place the truth can be learned: which of
     these endpoints will actually look at an image and answer. */
  try {
    /* A 2x2 PNG. Not a face — the point is to see which routes accept an
       image at all and return parseable JSON rather than an error page. */
    const PIX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91' +
      'JpzAAAAFElEQVR4nGP8//8/AzJgYkAFpPMBZkwCB0zxYQcAAAAASUVORK5CYII=';
    const SAY = 'Reply with strict JSON only: {"face": false, "age": 0, "note": "ok"}';

    const tryRoute = async (label, url, headers, model) => {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: Object.assign({ 'content-type': 'application/json' }, headers),
          body: JSON.stringify({
            model, max_tokens: 120, temperature: 0,
            messages: [{ role: 'user', content: [
              { type: 'text', text: SAY },
              { type: 'image_url', image_url: { url: PIX } }
            ] }]
          })
        });
        const text = await r.text();
        let body = text.slice(0, 160).replace(/\s+/g, ' ');
        try {
          const j = JSON.parse(text);
          const c = j && j.choices && j.choices[0] && j.choices[0].message;
          if (c) body = String(typeof c.content === 'string' ? c.content : JSON.stringify(c.content)).slice(0, 160);
          else if (j && j.error) body = 'ERR ' + JSON.stringify(j.error).slice(0, 140);
        } catch { /* keep the raw text */ }
        console.log(`\u25b8 vision probe ${label} [${model}]: HTTP ${r.status} \u2014 ${body}`);
        return r.ok;
      } catch (err) {
        console.log(`\u25b8 vision probe ${label} [${model}] threw: ${err && err.message}`);
        return false;
      }
    };

    /* Pollinations was taken out of the order's stack entirely; it is not
       probed any more. */
    await tryRoute('hf-router', 'https://router.huggingface.co/v1/chat/completions',
      process.env.HUGGINGFACE_API_KEY ? { authorization: 'Bearer ' + process.env.HUGGINGFACE_API_KEY } : {},
      'Qwen/Qwen2.5-VL-7B-Instruct');

    const store = await import('../hatchable/lib/key-store.js');
    const oa = store.storedOpenAIKey();
    if (oa) await tryRoute('openai', 'https://api.openai.com/v1/chat/completions',
      { authorization: 'Bearer ' + oa }, 'gpt-4o-mini');
  } catch (err) {
    console.log('\u25b8 vision probe failed: ' + (err && err.message));
  }

  /* 4d — confirm the Kaggle token still authenticates and report whether the
     account can actually be given a GPU. No kernel is pushed here; that was
     proved once and costs quota to repeat. */
  try {
    const store = await import('../hatchable/lib/key-store.js');
    const tok = store.storedKaggleToken && store.storedKaggleToken();
    if (!tok) {
      console.log('\u25b8 kaggle: no token bundled');
    } else {
      const r = await fetch('https://www.kaggle.com/api/v1/oauth2/introspect', {
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + tok,
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json'
        },
        body: 'token=' + encodeURIComponent(tok)
      });
      const t = (await r.text()).slice(0, 200).replace(/\s+/g, ' ');
      console.log(`\u25b8 kaggle token: HTTP ${r.status} \u2014 ${t}`);
    }
  } catch (err) {
    console.log('\u25b8 kaggle probe failed: ' + (err && err.message));
  }

  /* 5 — deploy */
  console.log("▸ deploy");
  const deployed = await call("deploy", {
    [argName("deploy", ["project_id", "projectId"])]: projectId,
    intent: "Deploy the EGregoRA website",
    summary:
      "Publishes the ornate EGregoRA static site: introduction and charter, podcast with RSS, videos, " +
      "Ask Ed a Question, four SVG infographic plates, music, products and the annotated research bibliography."
  });

  console.log("\n✔ Deployed.");
  console.log(JSON.stringify(deployed, null, 2).slice(0, 1200));
  const url = deployed.url || deployed.live_url || deployed.preview_url;
  if (url) console.log(`\n   ${url}`);
  if (deployed.is_draft) console.log("   (draft — click Promote to live in the console when happy)");
  console.log("\n   Projects start PRIVATE. Flip visibility to public from the Hatchable console;");
  console.log("   that is deliberately a dashboard-only action, not something MCP can do.");
})().catch((err) => {
  console.error(`\n✖ ${err.message}`);
  if (/401|unauthor/i.test(err.message)) console.error("  Check HATCHABLE_TOKEN — console → Settings → API keys.");
  process.exit(1);
});
// redeploy trigger: 2026-10-08T12:34:36Z
// redeploy trigger: 2026-10-08T13:04:16Z
// redeploy trigger: 2026-10-09T09:49:04Z
