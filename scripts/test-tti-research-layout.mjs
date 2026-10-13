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

assert.equal(site.revision, "r4.10", "the research-project layout must carry revision r4.10");
assert.equal(site.edition, "Working research edition", "the edition label drifted");
assert.equal(site.research.documentCount, 25, "research study count drifted");
assert.equal(site.research.resourceCount, 4, "project resource count drifted");
assert.match(site.research.status, /not a peer-reviewed physical theory/i,
  "the project status must not imply peer review");

const documents = ttiAtlas.limbs.flatMap((part) => part.subs);
assert.equal(documents.length, 29, "the research contents must retain all 29 destinations");
assert.equal(new Set(documents.map((document) => document.code)).size, 29,
  "research document codes must be unique");
assert.ok(documents.every((document) =>
  /^TTI-(?:I|II|III|IV|V)\.\d{2}$/.test(document.code) && document.kind && document.status && document.note),
"every project destination needs a stable code, type, status and research aim");
assert.equal(Object.keys(site.researchByUrl).length, 29, "route-to-research metadata is incomplete");
assert.deepEqual(site.researchDocuments.map((document) => document.url), documents.map((document) => document.href),
  "research-document order drifted from the canonical Atlas");
assert.ok(site.researchDocuments.every((document, index) =>
  document.index === index + 1 && document.total === 29), "corpus positions are inconsistent");

const homeFile = path.join(builtRoot, "index.html");
assert.ok(fs.existsSync(homeFile), "build tti/_site before running the research-layout regression");
const home = cheerio.load(fs.readFileSync(homeFile, "utf8"));
assert.equal(home("#project-contents .research-toc-part").length, 5,
  "homepage table of contents must expose all five Parts");
assert.equal(home("#project-contents .research-toc-part > ol > li").length, 29,
  "homepage table of contents must expose all 29 documents");
assert.equal(home("#project-contents .research-toc-code").length, 29,
  "every homepage contents entry needs its stable document code");
for (const marker of [
  "Project Table of Contents", "Geometry, Integration and the Conditions of Return",
  "Independent research project", "<dt>Research status</dt><dd>Working hypotheses</dd>",
  "Derive, distinguish, compare, expose failure conditions"
]) {
  assert.ok(home.html().includes(marker), `homepage research record is missing: ${marker}`);
}
assert.ok(home('.hero-ctas a[href="#project-contents"]').length,
  "the hero must link directly to the project table of contents");
assert.ok(home('.hero-ctas a[href="#project-abstract"]').length,
  "the hero must link directly to the project abstract");

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

const indexFiles = builtIndexFiles(builtRoot).filter((file) => file !== "index.html");
for (const relative of indexFiles) {
  const route = `/${path.posix.dirname(relative)}/`;
  const expected = site.researchByUrl[route];
  assert.ok(expected, `built document ${route} is absent from research metadata`);
  const $ = cheerio.load(fs.readFileSync(path.join(builtRoot, relative), "utf8"));
  assert.equal($(".project-context").length, 1, `${route} needs one research context record`);
  assert.equal($(".project-record-code").text().trim(), expected.code, `${route} has the wrong document code`);
  assert.equal($(".project-record-kind").text().trim(), expected.kind, `${route} has the wrong document type`);
  assert.equal($(".project-record-status").text().trim(), expected.status, `${route} has the wrong status`);
  assert.equal($(".project-drawer-grid > section").length, 5, `${route} contents drawer must expose five Parts`);
  assert.equal($(".project-drawer-grid a").length, 29, `${route} contents drawer must expose 29 destinations`);
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
assert.match(header, /Project contents/, "masthead does not expose project contents");
assert.match(header, /item\.code/, "masthead destinations do not display research codes");
assert.match(footer, /Suggested document citation/, "footer lacks a per-document citation");
assert.match(js, /Research-document outline/, "document-outline enhancement is absent");
assert.match(js, /while \(usedIds\.has\(candidate\)\)/, "generated heading IDs are not collision-safe");
for (const selector of [".project-abstract", ".research-toc", ".project-context", ".project-drawer", ".document-outline"]) {
  assert.ok(css.includes(selector), `research layout styling is missing ${selector}`);
}

console.log(`TTI research layout regression passed: ${documents.length} indexed destinations, ${indexFiles.length} built research documents.`);
