#!/usr/bin/env node
/* ===========================================================================
   check-links — every reference inside this site points at something real
   ---------------------------------------------------------------------------
   The table of contents on the front page is generated from the limb canon
   and from sections read out of the pages themselves, so it goes stale the
   moment a heading is renamed and nothing complains. This walks the built
   site instead of trusting it:

     · every internal href resolves to a page that was actually written;
     · every #anchor exists as an id on the page it points at;
     · the contents list on the front page reaches every page of the site,
       so nothing is published that the contents does not mention.

   Fragments on the current page, mailto:, tel:, external links and
   javascript: are left alone. Exit code 1 on the first page that fails.
   ======================================================================== */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";

const ROOT = resolve("_site");
if (!existsSync(ROOT)) {
  console.error("check-links: no _site — run `npm run build:hatchable` first.");
  process.exit(1);
}

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name);
  return statSync(full).isDirectory() ? walk(full) : full.endsWith(".html") ? [full] : [];
});

const pages = walk(ROOT).sort();
const urlOf = (file) => file.slice(ROOT.length).replace(/index\.html$/, "").replace(/\\/g, "/");

/* Every id the built site offers, page by page, plus the files that exist. */
const ids = new Map();
const docs = new Map();
for (const file of pages) {
  const dom = new JSDOM(readFileSync(file, "utf8"));
  docs.set(urlOf(file), dom.window.document);
  ids.set(urlOf(file), new Set(
    [...dom.window.document.querySelectorAll("[id]")].map((el) => el.id)
      .concat([...dom.window.document.querySelectorAll("a[name]")].map((a) => a.name))
  ));
}

/* An href as the browser would resolve it: a directory url, and a fragment. */
function target(href, from) {
  if (!href) return null;
  if (/^(https?:|mailto:|tel:|javascript:|data:|#)/i.test(href)) return null;
  const [path, hash] = href.split("#");
  let url = path || from;
  if (!url.startsWith("/")) url = new URL(url, "https://x" + from).pathname;
  return { url, hash: hash || "" };
}

const asset = (url) => /\.(css|js|mjs|json|xml|txt|png|jpg|jpeg|svg|webp|ico|webmanifest|zip|mp3|mp4|pdf|woff2?)$/i.test(url);

let checked = 0, bad = 0;
for (const [from, doc] of docs) {
  for (const a of doc.querySelectorAll("a[href]")) {
    const t = target(a.getAttribute("href"), from);
    if (!t) continue;
    checked++;
    const label = (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 48);
    if (asset(t.url)) {
      if (!existsSync(join(ROOT, t.url))) {
        console.error(`  FAIL  ${from}  ->  ${a.getAttribute("href")}  (no such file)  "${label}"`);
        bad++;
      }
      continue;
    }
    if (!ids.has(t.url)) {
      console.error(`  FAIL  ${from}  ->  ${a.getAttribute("href")}  (no such page)  "${label}"`);
      bad++;
      continue;
    }
    if (t.hash && !ids.get(t.url).has(t.hash)) {
      console.error(`  FAIL  ${from}  ->  ${a.getAttribute("href")}  (no id "${t.hash}" on that page)  "${label}"`);
      bad++;
    }
  }
}

/* The contents must reach every page the site publishes. */
const home = docs.get("/");
const toc = home && home.querySelector("#contents");
if (!toc) {
  console.error("  FAIL  the front page has no #contents table of contents");
  bad++;
} else {
  const reached = new Set([...toc.querySelectorAll("a[href]")]
    .map((a) => (target(a.getAttribute("href"), "/") || {}).url)
    .filter(Boolean));
  /* A page that asks not to be indexed — a redirect stub, a private
     account page — is not part of the public contents. */
  const listed = (u) => {
    const r = docs.get(u).querySelector('meta[name="robots"]');
    return !(r && /noindex/i.test(r.getAttribute("content") || ""));
  };
  const missed = [...docs.keys()].filter((u) =>
    u !== "/" && u !== "/404.html" && listed(u) && !reached.has(u));
  for (const u of missed) {
    console.error(`  FAIL  the contents never links to ${u}`);
    bad++;
  }
}

console.log(`check-links — ${checked} internal links across ${docs.size} pages`);
if (bad) {
  console.error(`  ${bad} broken`);
  process.exit(1);
}
console.log("  every one of them lands, and the contents reaches every page");
