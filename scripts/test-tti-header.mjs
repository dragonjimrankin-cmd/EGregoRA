#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import * as cheerio from "cheerio";
import site from "../tti/src/_data/site.js";

const ROOT = process.cwd();
const HEADER = path.join(ROOT, "tti/src/_includes/partials/header.njk");
const CSS = path.join(ROOT, "tti/src/assets/css/main.css");
const JS = path.join(ROOT, "tti/src/assets/js/site.js");
const BUILD = path.join(ROOT, "tti/_site");
const builtMode = process.argv.includes("--built");
const expectedTitle = "The Two Infinities: Eternal Integration of the Self";
const expectedTagline = "A speculative cosmology by Jim Rankin, UK, 2026";
const expectedGroups = site.navGroups;
const expectedIntegratedGroups = site.integratedNavGroups;
const expectedSupportingGroups = site.supportingNavGroups;
const expectedFocus = site.focusAreas;
const expectedResearchRoutes = expectedGroups.flatMap((group) => group.items.map((item) => item.url));
const expectedIntegratedRoutes = expectedIntegratedGroups.flatMap((group) => group.items.map((item) => item.url));
const expectedSupportingRoutes = expectedSupportingGroups.flatMap((group) => group.items.map((item) => item.url));
const expectedPageLabels = new Map(expectedGroups.flatMap((group) => group.items.map((item) => [item.url,
  `Part ${group.part} — ${group.shortLabel} · ${item.kind} ${item.code} · ${item.label}`
])));
const normalise = (value) => String(value || "").replace(/\s+/g, " ").trim().replace(/’/g, "'");

if (!fs.existsSync(BUILD) && !builtMode) {
  execFileSync("npm", ["run", "build:tti"], { cwd: ROOT, stdio: "inherit" });
}

const headerSource = fs.readFileSync(HEADER, "utf8");
const css = fs.readFileSync(CSS, "utf8");
const js = fs.readFileSync(JS, "utf8");

/* Source contract: three conjectures own Parts I–III; one disclosure carries
   supporting Parts IV–VI and links to the complete canonical archive. */
assert.match(headerSource, /class="brand-name">The Two Infinities: Eternal Integration of the Self</,
  "exact project title is absent from the masthead");
assert.match(headerSource, /class="brand-tag">A speculative cosmology by Jim Rankin, UK, 2026</,
  "exact attribution is absent from the masthead");
assert.match(headerSource, /for focus in site\.focusAreas/, "header does not derive the three focus clusters from canonical data");
assert.match(headerSource, /for item in focus\.documents/, "Parts I–III are not integrated beneath their conjectures");
assert.match(headerSource, /data-focus-document/, "integrated research documents are not explicitly identified");
assert.match(headerSource, /<details class="nav-cluster nav-archive">/,
  "supporting archive is not a native keyboard-readable disclosure");
assert.match(headerSource, /for group in site\.supportingNavGroups/,
  "supporting archive does not derive Parts IV–VI from canonical data");
assert.match(headerSource, /data-archive-document/, "supporting archive documents are not explicitly identified");
assert.match(headerSource, /data-research-document/, "header research destinations lack a shared identity");
assert.match(headerSource, /href="\/archive\/"/, "complete archive overview is absent from the header");
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
const attributionRule = css.match(/\.site-head \.brand-tag\s*\{([^}]*)\}/)?.[1] || "";
assert.match(attributionRule, /font-size:\s*calc\(0\.51rem \+ 2px\);/,
  "masthead attribution was not increased by exactly two pixels");
assert.match(css, /body\s*\{[^}]*overflow-wrap:\s*normal;[^}]*word-break:\s*normal;[^}]*hyphens:\s*none;/s,
  "the site does not establish whole-word line breaking");
assert.doesNotMatch(css,
  /(?:overflow-wrap:\s*(?:anywhere|break-word)|word-break:\s*(?:break-all|break-word)|hyphens:\s*auto)/,
  "a CSS rule can still split a word between rows");
assert.match(css, /\.focus-panel\s*\{[^}]*width:\s*min\(460px,/s,
  "integrated Part disclosures have no readable desktop panel");
assert.match(css, /\.archive-part-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
  "desktop supporting archive does not expose Parts IV–VI as three columns");
assert.match(css, /@media \(max-width:\s*900px\)[\s\S]*?\.focus-nav\s*\{\s*display:\s*block;/,
  "focus navigation has no narrow-screen mode");
assert.match(css, /@media \(max-width:\s*620px\)[\s\S]*?\.archive-part-grid\s*\{\s*grid-template-columns:\s*1fr;/,
  "supporting archive does not become a readable single column on small screens");
assert.match(js, /querySelectorAll\("\.nav-cluster"\)/,
  "research disclosures are not managed by the shared navigation controller");
assert.match(js, /pointerenter|mouseenter/, "desktop hover does not open research disclosures");
assert.match(js, /pointerleave|mouseleave/, "desktop hover does not close research disclosures");
assert.match(js, /event\.key !== "Escape"/, "Escape does not close research disclosures");

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

  assert.equal(normalise($(".brand-name").first().text()), expectedTitle, `${relative} has the wrong title`);
  assert.equal(normalise($(".brand-tag").first().text()), expectedTagline, `${relative} has the wrong attribution`);
  assert.equal($("#primary-nav .focus-cluster").length, 3, `${relative} does not expose three primary conjectures`);
  $("#primary-nav .focus-cluster").each((index, element) => {
    const expected = expectedFocus[index];
    const expectedGroup = expectedIntegratedGroups[index];
    const cluster = $(element);
    const summary = cluster.children("summary.focus-nav-link").first();
    assert.equal(summary.attr("data-focus-route"), expected.url,
      `${relative} focus ${index + 1} has the wrong principal route`);
    assert.equal(normalise(summary.find(".focus-nav-copy > strong").text()), expected.label,
      `${relative} focus ${index + 1} has the wrong label`);
    assert.equal(normalise(cluster.find(".focus-panel-head h2").first().text()),
      `Part ${expectedGroup.part} · ${expectedGroup.shortLabel}`,
      `${relative} focus ${index + 1} has the wrong integrated Part subheading`);
    const routes = cluster.find("[data-focus-document]").map((_, link) => $(link).attr("href")).get();
    assert.deepEqual(routes, expectedGroup.items.map((item) => item.url),
      `${relative} focus ${index + 1} does not expose its complete canonical Part`);
  });

  const integratedRoutes = $("#primary-nav [data-focus-document]").map((_, element) => $(element).attr("href")).get();
  assert.deepEqual(integratedRoutes, expectedIntegratedRoutes,
    `${relative} integrated Parts I–III destinations or ordering drifted`);

  assert.equal($("#primary-nav .nav-archive").length, 1, `${relative} has no single supporting archive disclosure`);
  assert.equal($("#primary-nav .archive-part").length, 3, `${relative} supporting archive does not expose Parts IV–VI`);
  const supportingRoutes = $("#primary-nav [data-archive-document]").map((_, element) => $(element).attr("href")).get();
  assert.deepEqual(supportingRoutes, expectedSupportingRoutes,
    `${relative} supporting archive destinations or ordering drifted`);

  $("#primary-nav .archive-part").each((index, element) => {
    const expected = expectedSupportingGroups[index];
    const part = $(element);
    assert.equal(normalise(part.find(".archive-part-head > span").first().text()), `Part ${expected.part}`,
      `${relative} supporting Part ${index + 1} has the wrong numeral`);
    assert.equal(normalise(part.find(".archive-part-head h2").first().text()), expected.label,
      `${relative} supporting Part ${index + 1} has the wrong title`);
    assert.equal(part.find("[data-archive-document]").length, expected.items.length,
      `${relative} supporting Part ${index + 1} has the wrong destination count`);
  });

  const allResearchRoutes = $("#primary-nav [data-research-document]")
    .map((_, element) => $(element).attr("href")).get();
  assert.deepEqual(allResearchRoutes, expectedResearchRoutes,
    `${relative} header does not retain all six Parts in canonical order`);
  assert.equal(new Set(allResearchRoutes).size, expectedResearchRoutes.length,
    `${relative} header repeats a research document`);

  assert.equal($(".nav-toggle").attr("aria-controls"), "primary-nav", `${relative} toggle target drifted`);
  assert.equal($(".nav-toggle").attr("aria-expanded"), "false", `${relative} toggle does not begin collapsed`);
  const expectedCurrent = route === "/archive/" ? "/archive/" : (expectedResearchRoutes.includes(route) ? route : null);
  const current = $("#primary-nav [aria-current='page']").map((_, element) => $(element).attr("href")).get();
  assert.deepEqual(current, expectedCurrent ? [expectedCurrent] : [], `${relative} current research destination is wrong`);

  const expectedPageLabel = expectedPageLabels.get(route);
  if (expectedPageLabel) {
    const actualPageLabel = normalise($("main > .page-head > .kicker").first().text());
    assert.ok(actualPageLabel.startsWith(normalise(expectedPageLabel)),
      `${relative} page label does not correspond to its canonical Part`);
  }
}

console.log(`TTI integrated header passed: 3 conjectures own Parts I–III; Parts IV–VI and all ${expectedResearchRoutes.length} destinations remain accessible.`);
