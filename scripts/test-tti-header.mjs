#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import * as cheerio from "cheerio";
import site from "../tti/src/_data/site.js";

const ROOT = process.cwd();
const HEADER = path.join(ROOT, "tti/src/_includes/partials/header.njk");
const BASE = path.join(ROOT, "tti/src/_includes/layouts/base.njk");
const CSS = path.join(ROOT, "tti/src/assets/css/main.css");
const R35_CSS = path.join(ROOT, "tti/src/assets/css/r35-restoration.css");
const JS = path.join(ROOT, "tti/src/assets/js/site.js");
const BUILD = path.join(ROOT, "tti/_site");
const builtMode = process.argv.includes("--built");
const expectedTitle = "The Two Infinities: Eternal Integration of the Self";
const expectedTagline = "A speculative cosmology by Jim Rankin, UK, 2026";
const expectedGroups = site.navGroups;
const expectedFocus = site.focusAreas;
const expectedArchiveRoutes = expectedGroups.flatMap((group) => group.items.map((item) => item.url));
const expectedPageLabels = new Map(expectedGroups.flatMap((group) => group.items.map((item) => [item.url,
  `Part ${group.part} — ${group.shortLabel} · ${item.kind} ${item.code} · ${item.label}`
])));
const normalise = (value) => String(value || "").replace(/\s+/g, " ").trim().replace(/’/g, "'");

if (!fs.existsSync(BUILD) && !builtMode) {
  execFileSync("npm", ["run", "build:tti"], { cwd: ROOT, stdio: "inherit" });
}

const headerSource = fs.readFileSync(HEADER, "utf8");
const baseSource = fs.readFileSync(BASE, "utf8");
const css = fs.readFileSync(CSS, "utf8");
const r35css = fs.readFileSync(R35_CSS, "utf8");
const js = fs.readFileSync(JS, "utf8");

/* Source contract: three public ideas, one keyboard-readable complete archive. */
assert.match(headerSource, /class="brand-name">The Two Infinities: Eternal Integration of the Self</,
  "exact project title is absent from the masthead");
assert.match(headerSource, /class="brand-tag">A speculative cosmology by Jim Rankin, UK, 2026</,
  "exact attribution is absent from the masthead");
assert.match(headerSource, /class="brand-sigil"[^>]*>\{% glyph "torus" %\}/,
  "r3.5 torus masthead sigil is absent");
assert.match(headerSource, /class="brand-line"/,
  "r3.5 engraved masthead line is absent");
assert.match(headerSource, /class="brand-order-text">Research edition &middot; \{\{ site\.revision \}\}/,
  "restored masthead does not identify the current research edition");
assert.match(baseSource,
  /main\.css\?v=\{\{ build\.id \}\}[\s\S]*r35-restoration\.css\?v=\{\{ build\.id \}\}/,
  "r3.5 restoration layer is not loaded after the main stylesheet");
assert.match(headerSource, /for focus in site\.focusAreas/, "header does not derive the three focus links from canonical data");
assert.match(headerSource, /class="focus-nav-link/, "fundamental-conjecture rail is absent");
assert.match(headerSource, /<details class="nav-cluster nav-archive">/,
  "complete archive is not a native keyboard-readable disclosure");
assert.match(headerSource, /for group in site\.navGroups/, "archive does not derive all Parts from canonical data");
assert.match(headerSource, /for item in group\.items/, "archive does not derive every destination from canonical data");
assert.match(headerSource, /data-archive-document/, "archive document links are not explicitly identified");
assert.match(headerSource, /href="\/archive\/"/, "archive overview is absent from the header");
assert.match(headerSource, /aria-controls="primary-nav"/, "mobile toggle is not linked to the primary navigation");

/* Compact text may wrap, but it must never be clipped or made illegible. */
assert.match(css, /\.focus-nav\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
  "desktop header is not a three-focus rail");
const focusLabelRule = [...css.matchAll(/\.focus-nav-copy strong\s*\{([^}]*)\}/g)]
  .map((match) => match[1])
  .find((rule) => /font-family:\s*var\(--title\)/.test(rule)) || "";
assert.match(focusLabelRule, /white-space:\s*normal;/,
  "focus labels do not wrap at rest");
assert.doesNotMatch(focusLabelRule, /text-overflow:\s*ellipsis;/,
  "focus labels are still truncated at rest");
assert.match(r35css, /r3\.5 — restored formatting layer/,
  "the historical formatting layer is not explicitly identified");
assert.match(r35css, /\.site-head\s*\{[^}]*position:\s*relative;[^}]*backdrop-filter:\s*blur\(6px\);/s,
  "the non-sticky r3.5 masthead was not restored");
assert.match(r35css, /\.focus-hero\s*\{[^}]*max-width:\s*var\(--maxw\);[^}]*text-align:\s*center;/s,
  "the centred r3.5 hero measure was not restored");
assert.match(r35css, /\.focus-pillar\s*\{[^}]*border:\s*1px solid rgba\(118,207,238,0\.28\);[^}]*box-shadow:/s,
  "current conjectures do not use the r3.5 framed-paper treatment");
assert.match(r35css, /font-size:\s*calc\(0\.54rem \+ 2px\);/,
  "restored desktop attribution does not retain the requested two-pixel increase");
assert.match(css, /body\s*\{[^}]*overflow-wrap:\s*normal;[^}]*word-break:\s*normal;[^}]*hyphens:\s*none;/s,
  "the site does not establish whole-word line breaking");
assert.doesNotMatch(`${css}\n${r35css}`,
  /(?:overflow-wrap:\s*(?:anywhere|break-word)|word-break:\s*(?:break-all|break-word)|hyphens:\s*auto)/,
  "a CSS rule can still split a word between rows");
assert.match(css, /\.archive-part-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/,
  "desktop archive does not expose all six Parts as columns");
assert.match(css, /@media \(max-width:\s*900px\)[\s\S]*?\.focus-nav\s*\{\s*display:\s*block;/,
  "focus navigation has no narrow-screen mode");
assert.match(css, /@media \(max-width:\s*620px\)[\s\S]*?\.archive-part-grid\s*\{\s*grid-template-columns:\s*1fr;/,
  "archive does not become a readable single column on small screens");
assert.match(js, /querySelectorAll\("\.nav-cluster"\)/,
  "archive disclosure is not managed by the shared navigation controller");
assert.match(js, /pointerenter|mouseenter/, "desktop hover does not open the archive disclosure");
assert.match(js, /pointerleave|mouseleave/, "desktop hover does not close the archive disclosure");
assert.match(js, /event\.key !== "Escape"/, "Escape does not close the archive disclosure");

const fixtures = [
  ["index.html", "/"],
  ["archive/index.html", "/archive/"],
  ["foundations/index.html", "/foundations/"],
  ["skeletal-splice/index.html", "/skeletal-splice/"],
  ["seams/index.html", "/seams/"],
  ["little-red-dots/research-proposal/index.html", "/little-red-dots/research-proposal/"],
  ["riemann-splice-questions/index.html", "/riemann-splice-questions/"],
  ["ask-shakdrah/index.html", "/ask-shakdrah/"]
];

for (const [relative, route] of fixtures) {
  const file = path.join(BUILD, relative);
  assert.ok(fs.existsSync(file), `${relative} was not built`);
  const $ = cheerio.load(fs.readFileSync(file, "utf8"));
  const stylesheets = $("link[rel='stylesheet']").map((_, element) => $(element).attr("href") || "").get();
  const mainCssIndex = stylesheets.findIndex((href) => href.startsWith("/assets/css/main.css"));
  const r35CssIndex = stylesheets.findIndex((href) => href.startsWith("/assets/css/r35-restoration.css"));
  assert.ok(mainCssIndex >= 0 && r35CssIndex > mainCssIndex,
    `${relative} does not load the r3.5 formatting layer after the main stylesheet`);

  assert.equal(normalise($(".brand-name").first().text()), expectedTitle, `${relative} has the wrong title`);
  assert.equal(normalise($(".brand-tag").first().text()), expectedTagline, `${relative} has the wrong attribution`);
  assert.equal($("#primary-nav .focus-nav-link").length, 3, `${relative} does not expose three primary conjectures`);
  $("#primary-nav .focus-nav-link").each((index, element) => {
    const expected = expectedFocus[index];
    assert.equal($(element).attr("href"), expected.url, `${relative} focus ${index + 1} has the wrong route`);
    assert.equal(normalise($(element).find("strong").text()), expected.label,
      `${relative} focus ${index + 1} has the wrong label`);
  });

  assert.equal($("#primary-nav .nav-archive").length, 1, `${relative} has no single archive disclosure`);
  assert.equal($("#primary-nav .archive-part").length, 6, `${relative} archive does not expose six Parts`);
  const archiveRoutes = $("#primary-nav [data-archive-document]").map((_, element) => $(element).attr("href")).get();
  assert.deepEqual(archiveRoutes, expectedArchiveRoutes, `${relative} archive destinations or ordering drifted`);
  assert.equal(new Set(archiveRoutes).size, expectedArchiveRoutes.length, `${relative} archive repeats a document`);

  $("#primary-nav .archive-part").each((index, element) => {
    const expected = expectedGroups[index];
    const part = $(element);
    assert.equal(normalise(part.find(".archive-part-head > span").first().text()), `Part ${expected.part}`,
      `${relative} archive Part ${index + 1} has the wrong numeral`);
    assert.equal(normalise(part.find(".archive-part-head h2").first().text()), expected.label,
      `${relative} archive Part ${index + 1} has the wrong title`);
    assert.equal(part.find("[data-archive-document]").length, expected.items.length,
      `${relative} archive Part ${index + 1} has the wrong destination count`);
  });

  assert.equal($(".nav-toggle").attr("aria-controls"), "primary-nav", `${relative} toggle target drifted`);
  assert.equal($(".nav-toggle").attr("aria-expanded"), "false", `${relative} toggle does not begin collapsed`);
  const expectedCurrent = route === "/archive/" ? "/archive/" : (expectedArchiveRoutes.includes(route) ? route : null);
  const current = $("#primary-nav [aria-current='page']").map((_, element) => $(element).attr("href")).get();
  assert.deepEqual(current, expectedCurrent ? [expectedCurrent] : [], `${relative} current archive destination is wrong`);

  const expectedPageLabel = expectedPageLabels.get(route);
  if (expectedPageLabel) {
    const actualPageLabel = normalise($("main > .page-head > .kicker").first().text());
    assert.ok(actualPageLabel.startsWith(normalise(expectedPageLabel)),
      `${relative} page label does not correspond to its archive Part`);
  }
}

console.log(`TTI focus header passed: 3 conjectures, ${expectedGroups.length} archived Parts and ${expectedArchiveRoutes.length} unique destinations.`);
