#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import site from "../tti/src/_data/site.js";
import ttiAtlas from "../tti/src/_data/ttiAtlas.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const builtRoot = path.join(root, "tti", "_site");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

assert.equal(site.revision, "r3.5", "the restored reading room must identify revision r3.5");
assert.equal(site.edition, "Integrated r3.5 research edition", "the integrated r3.5 edition label drifted");
assert.equal(site.focusAreas.length, 3, "the public edition must retain exactly three fundamental conjectures");
assert.deepEqual(site.integratedNavGroups.map((group) => group.part), ["I", "II", "III"],
  "Parts I–III must be the integrated conjecture programmes");
assert.deepEqual(site.supportingNavGroups.map((group) => group.part), ["IV", "V", "VI"],
  "Parts IV–VI must remain the supporting research record");
assert.ok(site.focusAreas.every((focus, index) =>
  focus.part === site.integratedNavGroups[index].part &&
  focus.documents === site.integratedNavGroups[index].items),
"each conjecture must own its complete canonical research Part");
assert.equal(site.research.documentCount, 30, "research study count drifted");
assert.equal(site.research.resourceCount, 4, "project resource count drifted");
assert.match(site.research.status, /not a peer-reviewed physical theory/i,
  "the project status must not imply peer review");

const documents = ttiAtlas.limbs.flatMap((part) => part.subs);
assert.equal(documents.length, 34, "the research contents must retain all 34 destinations");
assert.equal(new Set(documents.map((document) => document.code)).size, 34,
  "research document codes must be unique");
assert.ok(documents.every((document) =>
  /^TTI-(?:I|II|III|IV|V|VI)\.\d{2}$/.test(document.code) && document.kind && document.status && document.note),
"every project destination needs a stable code, type, status and research aim");
assert.equal(Object.keys(site.researchByUrl).length, 34, "route-to-research metadata is incomplete");
assert.deepEqual(site.researchDocuments.map((document) => document.url), documents.map((document) => document.href),
  "research-document order drifted from the canonical Atlas");
assert.ok(site.researchDocuments.every((document, index) =>
  document.index === index + 1 && document.total === 34), "corpus positions are inconsistent");

const homeFile = path.join(builtRoot, "index.html");
const archiveFile = path.join(builtRoot, "archive", "index.html");
assert.ok(fs.existsSync(homeFile) && fs.existsSync(archiveFile),
  "build the introduction and archive before running the research-layout regression");
const home = cheerio.load(fs.readFileSync(homeFile, "utf8"));
const archive = cheerio.load(fs.readFileSync(archiveFile, "utf8"));
assert.equal(home("#project-contents").length, 0,
  "the concise introduction must not reproduce the six-Part table of contents");
assert.equal(home(".focus-pillar").length, 3,
  "homepage must foreground exactly three conjectural pillars");
assert.deepEqual(home(".focus-pillar h2").map((_, element) => home(element).text().trim()).get(),
  ["Eternal Integration", "The Rankin Skeletal Splice", "Seams and Return"],
  "the public conjecture sequence drifted");
assert.deepEqual(home(".focus-programme-head h3").map((_, element) => home(element).text().trim()).get(),
  ["Part I · First Principles", "Part II · Cosmic Architecture", "Part III · Seams and Return"],
  "Parts I–III are not subheadings beneath the matching conjectures");
assert.equal(home("details.focus-programme").length, 3,
  "the complete Parts beneath the conjectures must use three progressive disclosures");
assert.equal(home("details.focus-programme[open]").length, 0,
  "the homepage must begin with its restored summary rather than 21 expanded paper records");
assert.deepEqual(home(".focus-programme-summary strong").map((_, element) => home(element).text().trim()).get(),
  ["Part I · First Principles", "Part II · Cosmic Architecture", "Part III · Seams and Return"],
  "collapsed programme labels drifted from their conjectures");
assert.deepEqual(home("[data-focus-programme-document]").map((_, element) => home(element).attr("href")).get(),
  site.integratedNavGroups.flatMap((group) => group.items.map((item) => item.url)),
  "homepage integrated research programmes are incomplete or out of order");
assert.equal(home(".focus-status").text().trim(), "Working hypotheses",
  "the public research-status display must read exactly Working hypotheses");
for (const marker of [
  "The Question Physics Does Not Touch", "The Complete Public Argument",
  "The Chain of Necessity", "Everything It Puts Under One Roof",
  "Where the Framework Touches Something Testable", "Earned, Chosen, Refused",
  "Why anything exists", "Why the universe is quantum", "What consciousness is",
  "Why there is something it is like to be", "Why time has a direction", "What gravity is",
  "Why we are five percent", "Why everything is a torus", "What collapse is",
  "How any of it could be measured", "The seam and the colour charge",
  "Whether galaxies carry a rotation bias", "Dark matter as the ledger",
  "The thirty-six, the quarks and the pace", "The full six-Part programme remains open"
]) {
  assert.ok(home.html().includes(marker), `restored r3.5 homepage is missing: ${marker}`);
}
assert.ok(home('.hero-ctas a[href="#fundamental-conjectures"]').length,
  "the hero must link directly to the three conjectures");
assert.ok(home('.hero-ctas a[href="/archive/"]').length,
  "the hero must link directly to the complete archive");
assert.equal(archive("#project-contents .research-toc-part").length, 6,
  "archive table of contents must expose all six Parts");
assert.equal(archive("#project-contents .research-toc-part > ol > li").length, 34,
  "archive table of contents must expose all 34 documents");
assert.equal(archive("#project-contents .research-toc-code").length, 34,
  "every archive contents entry needs its stable document code");

function builtIndexFiles(directory, relative = "") {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    const childRelative = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) found.push(...builtIndexFiles(child, childRelative));
    else if (entry.name === "index.html") found.push(childRelative);
  }
  return found;
}

const indexFiles = builtIndexFiles(builtRoot)
  .filter((file) => file !== "index.html" && file !== "archive/index.html");
for (const relative of indexFiles) {
  const route = `/${path.posix.dirname(relative)}/`;
  const expected = site.researchByUrl[route];
  assert.ok(expected, `built document ${route} is absent from research metadata`);
  const $ = cheerio.load(fs.readFileSync(path.join(builtRoot, relative), "utf8"));
  assert.equal($(".project-context").length, 1, `${route} needs one research context record`);
  assert.equal($(".project-record-code").text().trim(), expected.code, `${route} has the wrong document code`);
  assert.equal($(".project-record-kind").text().trim(), expected.kind, `${route} has the wrong document type`);
  assert.equal($(".project-record-status").text().trim(), expected.status, `${route} has the wrong status`);
  assert.equal($(".project-drawer-grid > section").length, 6, `${route} contents drawer must expose six Parts`);
  assert.equal($(".project-drawer-grid a").length, 34, `${route} contents drawer must expose 34 destinations`);
  assert.equal($(".project-drawer-grid a[aria-current=\"page\"]").length, 1,
    `${route} contents drawer must identify the current document`);
  assert.equal($("[data-document-outline]").length, 1, `${route} needs a local document-outline shell`);
  assert.ok($("main > .page-head > .kicker").first().text().includes(expected.code),
    `${route} page heading must display its document code`);
  assert.ok($(".foot-citation").text().includes(expected.code), `${route} footer citation must include its code`);
}

const [base, context, header, footer, js, css] = [
  "tti/src/_includes/layouts/base.njk",
  "tti/src/_includes/partials/research-context.njk",
  "tti/src/_includes/partials/header.njk",
  "tti/src/_includes/partials/footer.njk",
  "tti/src/assets/js/site.js",
  "tti/src/assets/css/main.css"
].map(read);
assert.match(base, /partials\/research-context\.njk/, "base layout does not include research context");
assert.match(context, /data-document-outline/, "research context lacks the local outline shell");
assert.match(context, /site\.navGroups/, "document contents drawer is not generated from canonical navigation");
assert.match(header, /Research Index/, "masthead does not expose the complete research index");
assert.match(header, /item\.code/, "masthead destinations do not retain research codes for assistive technology");
assert.match(header, /site\.navGroups/, "masthead is not generated from the canonical six-Part index");
assert.match(footer, /Every page marks what is <em>earned<\/em> by argument, what is <em>chosen<\/em> as interpretation/,
  "restored r3.5 footer language drifted");
assert.match(footer, /Test everything; keep what survives\./,
  "restored r3.5 footer closing rule drifted");
assert.match(footer, /Suggested document citation/, "footer lacks a per-document citation");
assert.match(js, /Research-document outline/, "document-outline enhancement is absent");
assert.match(js, /while \(usedIds\.has\(candidate\)\)/, "generated heading IDs are not collision-safe");
for (const selector of [".focus-hero", ".focus-pillar", ".research-toc", ".project-context", ".project-drawer", ".document-outline"]) {
  assert.ok(css.includes(selector), `research layout styling is missing ${selector}`);
}
const outlineRules = [...css.matchAll(/\.document-outline ol\s*\{([^}]*)\}/g)].map((match) => match[1]);
assert.ok(outlineRules.length > 0, "document outline has no list layout rule");
assert.ok(outlineRules.every((rule) => !/grid-template-columns:\s*repeat\(/.test(rule)),
  "document outline links return to multiple horizontal columns at a breakpoint");
assert.ok(outlineRules.some((rule) => /grid-template-columns:\s*1fr;/.test(rule)),
  "document outline links are not listed vertically");
assert.match(css, /table :is\(th, td\) > a\[href\]\s*\{[^}]*display:\s*block;/s,
  "links inside tables are not forced onto separate vertical rows");

console.log(`TTI research layout regression passed: ${documents.length} indexed destinations, ${indexFiles.length} built research documents.`);
