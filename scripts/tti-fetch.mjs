#!/usr/bin/env node
/**
 * Pull the Two Infinities framework out of a public Google Drive folder.
 * Runs on CI, which has egress; the sandbox does not.
 *
 *   node scripts/tti-fetch.mjs <folderId> <outDir>
 *
 * Drive's folder page embeds every child's id and name in its bootstrap
 * data. We scrape those, then fetch each file through the usual
 * uc?export=download endpoint, following the confirm-token dance that
 * Drive imposes on anything large enough to virus-scan.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FOLDER = process.argv[2];
const OUT = process.argv[3] || "tti-src";
if (!FOLDER) { console.error("usage: tti-fetch.mjs <folderId> [outDir]"); process.exit(1); }

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
mkdirSync(OUT, { recursive: true });

/* The embedded folder view is plain HTML and lists every child with its id,
   which saves scraping Drive's bootstrap blob. */
async function listFolder(id) {
  const html = await (await fetch(`https://drive.google.com/embeddedfolderview?id=${id}#list`, {
    headers: { "user-agent": UA, "accept-language": "en-GB,en" }
  })).text();
  console.log(`embedded view: ${html.length} bytes`);
  const out = new Map();
  const re = /id="entry-([a-zA-Z0-9_-]{20,})"[\s\S]*?flip-entry-title">([^<]+)</g;
  let m;
  while ((m = re.exec(html))) out.set(m[1], { name: m[2].trim(), mime: "" });
  if (!out.size) {
    console.log("no entries; first 1200 bytes follow:");
    console.log(html.slice(0, 1200));
  }
  return out;
}

const found = await listFolder(FOLDER);
console.log(`${found.size} entr(ies) found`);

const cookies = new Map();
function jar(res) {
  for (const c of (res.headers.getSetCookie?.() || [])) {
    const [kv] = c.split(";");
    const i = kv.indexOf("=");
    cookies.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
  }
}
const cookieHeader = () => [...cookies].map(([k, v]) => `${k}=${v}`).join("; ");

async function grab(id, name) {
  let url = `https://drive.google.com/uc?export=download&id=${id}`;
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, { headers: { "user-agent": UA, cookie: cookieHeader() }, redirect: "follow" });
    jar(res);
    const type = res.headers.get("content-type") || "";
    if (!/text\/html/i.test(type)) return Buffer.from(await res.arrayBuffer());
    const html = await res.text();
    const form = html.match(/action="([^"]+)"[^>]*>/);
    const token = html.match(/name="confirm"\s+value="([^"]+)"/) || html.match(/confirm=([0-9A-Za-z_-]+)/);
    const uuid = html.match(/name="uuid"\s+value="([^"]+)"/);
    if (form && token) {
      const base = form[1].replace(/&amp;/g, "&");
      const q = new URLSearchParams({ id, export: "download", confirm: token[1], ...(uuid ? { uuid: uuid[1] } : {}) });
      url = base.includes("?") ? `${base}&${q}` : `${base}?${q}`;
      continue;
    }
    throw new Error(`${name}: stuck on an HTML page (${html.length} bytes)`);
  }
  throw new Error(`${name}: too many hops`);
}

const want = [...found.entries()].filter(([, f]) => /\.(pdf|jpe?g|png)$/i.test(f.name));
for (const [id, f] of want) {
  const safe = f.name.replace(/[^\w.() -]+/g, "_").replace(/^\.+/, "");
  if (/^_/.test(safe) && f.name.startsWith("._")) { console.log(`skip ${f.name} (resource fork)`); continue; }
  try {
    const bytes = await grab(id, f.name);
    writeFileSync(join(OUT, safe), bytes);
    console.log(`ok ${safe} — ${(bytes.length / 1024).toFixed(0)} KB (${f.mime})`);
  } catch (e) {
    console.log(`✖ ${f.name}: ${e.message.slice(0, 160)}`);
  }
}
console.log("done");
