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
const R35_BASELINE = path.join(ROOT, "tti/src/assets/css/r35-baseline.css");
const R35_INTEGRATION = path.join(ROOT, "tti/src/assets/css/r35-integration.css");
const JS = path.join(ROOT, "tti/src/assets/js/site.js");
const BUILD = path.join(ROOT, "tti/_site");
const builtMode = process.argv.includes("--built");
const expectedTitle = "The Two Infinities: Eternal Integration of the Self";
const expectedTagline = "A speculative cosmology by Jim Rankin, UK, 2026";
const expectedGroups = site.navGroups;
const expectedIntegratedGroups = site.integratedNavGroups;
const expectedSupportingGroups = site.supportingNavGroups;
const expectedResearchRoutes = expectedGroups.flatMap((group) => group.items.map((item) => item.url));
const expectedIntegratedRoutes = expectedIntegratedGroups.flatMap((group) => group.items.map((item) => item.url));
const expectedSupportingRoutes = expectedSupportingGroups.flatMap((group) => group.items.map((item) => item.url));
const expectedPageLabels = new Map(expectedGroups.flatMap((group) => group.items.map((item) => [item.url,
  `Part ${group.part} — ${group.shortLabel} · ${item.kind} ${item.code} · ${item.label}`
])));
const expectedCompactLabels = new Map(expectedGroups.flatMap((group) =>
  group.items.map((item) => [item.url, item.mastheadLabel])));
const normalise = (value) => String(value || "").replace(/\s+/g, " ").trim().replace(/’/g, "'");

if (!fs.existsSync(BUILD) && !builtMode) {
  execFileSync("npm", ["run", "build:tti"], { cwd: ROOT, stdio: "inherit" });
}

const headerSource = fs.readFileSync(HEADER, "utf8");
const baseSource = fs.readFileSync(BASE, "utf8");
const css = fs.readFileSync(CSS, "utf8");
const r35Baseline = fs.readFileSync(R35_BASELINE, "utf8");
const r35Integration = fs.readFileSync(R35_INTEGRATION, "utf8");
const allCss = [css, r35Baseline, r35Integration].join("\n");
const js = fs.readFileSync(JS, "utf8");

/* Source contract: the supplied r3.5 reference becomes the real global
   masthead, while canonical data still supplies all six Parts and 35 routes. */
assert.match(headerSource, /site-head site-head--reference/,
  "the reference-style r3.5 masthead is absent");
assert.match(headerSource, /class="brand-name">The Two Infinities</,
  "the engraved short title is absent from the masthead");
assert.match(headerSource, /class="brand-essence">Eternal Integration of the Self</,
  "the complete project identity is absent from the masthead line");
assert.match(headerSource, /class="sr-only">The Two Infinities: Eternal Integration of the Self</,
  "the masthead lacks the exact accessible project title");
assert.match(headerSource, /A Geometry <em>of<\/em> Existence[^\n]*site\.revision/,
  "the reference geometry-and-revision line is absent");
assert.match(headerSource, /class="brand-tag">A speculative cosmology by Jim Rankin, UK, 2026</,
  "exact attribution is absent from the masthead");
assert.match(headerSource, /\{% glyph "torus" %\}/,
  "the reference masthead is missing its torus sigil");
assert.match(headerSource, /class="rule rule--bottom"/,
  "the reference masthead is missing its lower illuminated rule");
assert.match(baseSource,
  /main\.css[^\n]*\n[^\n]*r35-baseline\.css[^\n]*\n[^\n]*r35-integration\.css/,
  "stylesheets do not load in current-components, complete-r3.5, integration order");
assert.match(headerSource, /for group in site\.navGroups/,
  "masthead Parts are not derived from the canonical six-Part index");
assert.match(headerSource, /for item in group\.items/,
  "masthead pages are not derived beneath their canonical Parts");
assert.match(headerSource, /reference-part-row reference-part-row--/,
  "masthead does not give every Part its own structural row");
assert.match(headerSource, /reference-part-documents/,
  "masthead does not keep each Part's papers inside its row");
assert.match(headerSource, /item\.mastheadLabel/,
  "masthead does not use purpose-written compact page labels");
assert.match(headerSource, /data-focus-document/,
  "integrated Parts I–III documents are not explicitly identified");
assert.match(headerSource, /data-archive-document/,
  "supporting Parts IV–VI documents are not explicitly identified");
assert.match(headerSource, /data-research-document/,
  "masthead research destinations lack a shared identity");
assert.match(headerSource, /href="\/archive\/#project-contents"/, "full Table of Contents is absent from the masthead");
assert.match(headerSource, /aria-controls="primary-nav"/, "mobile toggle is not linked to the primary navigation");

/* The desktop index mirrors the reference while assigning every Part and its
   papers to one deliberate, left-aligned row. The two overview destinations
   sit at the right. Hover feedback must not resize a link or reflow its row. */
assert.match(r35Integration,
  /\.site-head--reference \.reference-nav-list\s*\{[^}]*display:\s*grid;/s,
  "reference masthead does not establish one-dimensional Part rows");
assert.match(r35Integration,
  /\.site-head--reference \.reference-nav-overview-row > ul\s*\{[^}]*justify-content:\s*flex-end;/s,
  "Summary and Research Index are not aligned to the right");
assert.match(r35Integration,
  /\.site-head--reference \.reference-part-row\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*flex-start;/s,
  "each desktop Part is not left-aligned on a row of its own");
assert.match(r35Integration,
  /\.site-head--reference \.reference-part-documents\s*\{[^}]*flex:\s*0 1 auto;[^}]*justify-content:\s*flex-start;[^}]*flex-wrap:\s*nowrap;/s,
  "a desktop Part's paper links are not kept left-aligned on one row");
const linkRule = r35Integration.match(/\.site-head--reference \.reference-nav-list a\s*\{([^}]*)\}/)?.[1] || "";
assert.match(linkRule, /text-overflow:\s*clip;/, "masthead labels may still be truncated");
assert.match(linkRule, /white-space:\s*nowrap;/, "desktop masthead labels are not kept whole");
const hoverRule = r35Integration.match(/\.site-head--reference \.reference-nav-list a:hover,[\s\S]*?\{([^}]*)\}/)?.[1] || "";
assert.match(hoverRule, /background:/, "masthead links lack visible hover feedback");
assert.doesNotMatch(hoverRule, /(?:padding|letter-spacing|font-size|width|margin)\s*:/,
  "masthead hover feedback changes link geometry and can displace neighboring links");
assert.match(r35Integration,
  /\.site-head--reference \.reference-nav-list i\s*\{[^}]*width:\s*17px;[^}]*height:\s*17px;/s,
  "reference masthead lacks compact glyph-led destinations");
assert.match(r35Integration,
  /@media \(max-width:\s*900px\)[\s\S]*?\.site-head--reference \.reference-part-documents\s*\{[^}]*grid-template-columns:\s*repeat\(2,/,
  "Part rows have no readable narrow-screen paper layout");
const attributionRule = r35Integration.match(/\.site-head--reference \.brand-tag\s*\{([^}]*)\}/)?.[1] || "";
assert.match(attributionRule, /font-size:\s*calc\(0\.39rem \+ 2px\);/,
  "masthead attribution does not retain its two-pixel increase");
assert.match(r35Baseline, /\.hero\s*\{[\s\S]*?text-align:\s*center;/,
  "the complete r3.5 hero system is absent");
assert.match(r35Baseline, /\.frame::before[\s\S]*?\.frame::after/,
  "the complete r3.5 illuminated frame system is absent");
assert.match(r35Integration, /body \*\s*\{[^}]*overflow-wrap:\s*normal;[^}]*word-break:\s*normal;[^}]*hyphens:\s*none;/s,
  "the integrated edition does not establish whole-word line breaking");
assert.doesNotMatch(allCss,
  /(?:overflow-wrap:\s*(?:anywhere|break-word)|word-break:\s*(?:break-all|break-word)|hyphens:\s*auto)/,
  "a CSS rule can still split a word between rows");
assert.match(js, /nav\.classList\.toggle\("open"\)/,
  "mobile navigation toggle no longer controls the complete index");
assert.match(js, /event\.key !== "Escape"/,
  "Escape no longer closes navigation disclosures retained elsewhere in the application");

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

  assert.equal(normalise($(".brand-name").first().text()), "The Two Infinities",
    `${relative} has the wrong engraved short title`);
  assert.equal(normalise($(".brand-essence").first().text()), "Eternal Integration of the Self",
    `${relative} has the wrong identity continuation`);
  assert.equal(normalise($(".brand .sr-only").first().text()), expectedTitle,
    `${relative} has the wrong accessible project title`);
  assert.equal(normalise($(".brand-tag").first().text()), expectedTagline,
    `${relative} has the wrong attribution`);
  const partRows = $("#primary-nav .reference-nav-list > .reference-part-row");
  assert.equal(partRows.length, 6,
    `${relative} does not give all six Parts a row of their own`);
  assert.equal($("#primary-nav .reference-part-label").length, 6,
    `${relative} does not display all six Part labels`);
  assert.deepEqual($("#primary-nav .reference-part-label").map((_, element) =>
    normalise($(element).find("a").attr("aria-label"))).get(),
  expectedGroups.map((group) => `Part ${group.part} — ${group.shortLabel}`),
  `${relative} Part headings drifted from the canonical index`);
  partRows.each((index, element) => {
    const row = $(element);
    const group = expectedGroups[index];
    const label = row.children(".reference-part-label");
    const papers = row.children(".reference-part-documents");
    assert.equal(label.length, 1, `${relative} Part ${group.part} row has no unique heading`);
    assert.equal(papers.length, 1, `${relative} Part ${group.part} row has no paper list`);
    assert.equal(papers.children(".reference-nav-item").length, group.items.length,
      `${relative} Part ${group.part} papers escaped their own row`);
    assert.deepEqual(papers.find("[data-research-document]").map((_, link) => $(link).attr("href")).get(),
      group.items.map((item) => item.url), `${relative} Part ${group.part} row ordering drifted`);
  });

  const integratedRoutes = $("#primary-nav [data-focus-document]").map((_, element) => $(element).attr("href")).get();
  assert.deepEqual(integratedRoutes, expectedIntegratedRoutes,
    `${relative} integrated Parts I–III destinations or ordering drifted`);
  const supportingRoutes = $("#primary-nav [data-archive-document]").map((_, element) => $(element).attr("href")).get();
  assert.deepEqual(supportingRoutes, expectedSupportingRoutes,
    `${relative} supporting Parts IV–VI destinations or ordering drifted`);

  const links = $("#primary-nav [data-research-document]");
  const allResearchRoutes = links.map((_, element) => $(element).attr("href")).get();
  assert.deepEqual(allResearchRoutes, expectedResearchRoutes,
    `${relative} masthead does not retain all six Parts in canonical order`);
  assert.equal(new Set(allResearchRoutes).size, expectedResearchRoutes.length,
    `${relative} masthead repeats a research document`);
  links.each((_, element) => {
    const link = $(element);
    const routeForLink = link.attr("href");
    const visibleLabel = normalise(link.children("span:not(.sr-only)").first().text());
    assert.equal(visibleLabel, expectedCompactLabels.get(routeForLink),
      `${relative} compact label drifted for ${routeForLink}`);
    assert.ok(normalise(link.attr("title")).startsWith("Part "),
      `${relative} ${routeForLink} has no complete Part-and-paper title`);
  });

  assert.equal($(".nav-toggle").attr("aria-controls"), "primary-nav", `${relative} toggle target drifted`);
  assert.equal($(".nav-toggle").attr("aria-expanded"), "false", `${relative} toggle does not begin collapsed`);
  const expectedCurrent = route === "/" ? "/" : route === "/archive/" ? "/archive/#project-contents" :
    (expectedResearchRoutes.includes(route) ? route : null);
  const current = $("#primary-nav [aria-current='page']").map((_, element) => $(element).attr("href")).get();
  assert.deepEqual(current, expectedCurrent ? [expectedCurrent] : [], `${relative} current destination is wrong`);

  const expectedPageLabel = expectedPageLabels.get(route);
  if (expectedPageLabel) {
    const actualPageLabel = normalise($("main > .page-head > .kicker").first().text());
    assert.ok(actualPageLabel.startsWith(normalise(expectedPageLabel)),
      `${relative} page label does not correspond to its canonical Part`);
  }
}

console.log(`TTI reference masthead passed: six Parts and all ${expectedResearchRoutes.length} destinations remain visible, ordered and accessible.`);
