#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import editorialGuides from "../tti/src/_data/editorialGuides.js";
import ttiAtlas from "../tti/src/_data/ttiAtlas.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const builtRoot = path.join(root, "tti", "_site");
const excludedServices = new Set(["/join/", "/account/"]);
const expectedRoutes = ttiAtlas.limbs
  .flatMap((part) => part.subs.map((document) => document.href))
  .filter((route) => !excludedServices.has(route));

assert.equal(expectedRoutes.length, 32, "editorial guide scope must cover 30 studies and two built reading rooms");
assert.deepEqual(Object.keys(editorialGuides).sort(), [...expectedRoutes].sort(),
  "editorial guides must cover every built research route exactly once");

const sourceHosts = new Set();
for (const route of expectedRoutes) {
  const guide = editorialGuides[route];
  for (const [field, minimum] of [["question", 35], ["argument", 160], ["evidence", 130], ["limit", 110], ["prompt", 55]]) {
    assert.ok(typeof guide[field] === "string" && guide[field].length >= minimum,
      `${route} needs a substantive ${field} field`);
  }
  assert.ok(guide.question.endsWith("?"), `${route} question must be written as a question`);
  assert.ok(guide.prompt.endsWith("?"), `${route} critical prompt must be written as a question`);
  assert.ok(Array.isArray(guide.sources) && guide.sources.length >= 1,
    `${route} needs at least one external bearing`);
  for (const source of guide.sources) {
    assert.ok(source.title && source.publisher && source.note, `${route} has incomplete source metadata`);
    const parsed = new URL(source.url);
    assert.equal(parsed.protocol, "https:", `${route} source must use HTTPS`);
    sourceHosts.add(parsed.hostname);
  }
}
assert.ok(sourceHosts.size >= 8, "the external bearings need genuine disciplinary breadth");

for (const route of expectedRoutes) {
  const built = path.join(builtRoot, route.slice(1), "index.html");
  assert.ok(fs.existsSync(built), `missing built document for ${route}`);
  const html = fs.readFileSync(built, "utf8");
  const $ = cheerio.load(html);
  assert.equal($(".editorial-guide").length, 1, `${route} needs exactly one clarity guide`);
  assert.equal($(".editorial-guide #t-claim-brief").length, 1, `${route} guide needs its stable heading`);
  assert.equal($(".editorial-guide-prose > p").length, 3, `${route} guide needs three prose movements`);
  assert.equal($(".editorial-guide-prompt").length, 1, `${route} guide needs one critical prompt`);
  assert.equal($(".editorial-guide-sources a[target=\"_blank\"][rel=\"noopener noreferrer\"]").length,
    editorialGuides[route].sources.length, `${route} external links need safe new-tab behaviour`);
  assert.ok(html.indexOf("<h1") < html.indexOf("id=\"t-claim-brief\""),
    `${route} clarity guide must follow the page-level H1`);
  assert.equal($("h1").length, 1, `${route} must retain one page-level H1`);
}

const archive = cheerio.load(fs.readFileSync(path.join(builtRoot, "archive", "index.html"), "utf8"));
assert.equal(archive(".editorial-manifesto").length, 1,
  "research archive needs the preserved clarity-edition reader contract");
for (const marker of ["A Reader’s Contract", "Mathematics is not used as a costume for certainty",
  "External sources are bearings, not endorsements", "A claim earns force by becoming easier to lose"]) {
  assert.ok(archive(".editorial-manifesto").text().includes(marker), `reader contract is missing: ${marker}`);
}

const foundations = fs.readFileSync(path.join(builtRoot, "foundations", "index.html"), "utf8");
for (const marker of ["does not manufacture i from π", "real-arithmetic formulations",
  "uniquely fundamental rather than representational remains debated"]) {
  assert.ok(foundations.includes(marker), `foundations correction is missing: ${marker}`);
}
const correctedPages = new Map([
  ["foundations", ["strictly larger cardinality", "mathematical necessity inside a model is not evidence"]],
  ["dx", ["does not define a smallest conscious grain"]],
  ["moebius", ["it is not a definition or derivation of colour confinement"]],
  ["megatubule", ["topology alone does not force a unique point of maximum pinch"]],
  ["little-red-dots", ["radiation-hydrodynamic simulations",
    "predicts a feature the conventional model misses", "s41586-026-10985-8"]]
]);
for (const [route, markers] of correctedPages) {
  const html = fs.readFileSync(path.join(builtRoot, route, "index.html"), "utf8");
  const normalised = html.replace(/\s+/g, " ");
  for (const marker of markers) {
    assert.ok(normalised.includes(marker), `${route} evidence correction is missing: ${marker}`);
  }
}

console.log(`TTI editorial clarity regression passed: ${expectedRoutes.length} guided documents, ${sourceHosts.size} external source hosts, one claim boundary and one critical prompt per page.`);
