#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import site from "../tti/src/_data/site.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const source = read("tti/src/pi-from-zero-and-one.njk");
const builtPath = path.join(root, "tti", "_site", "pi-from-zero-and-one", "index.html");
assert.ok(fs.existsSync(builtPath), "build the TTI π paper before running its regression");
const html = fs.readFileSync(builtPath, "utf8");
const $ = cheerio.load(html);

const record = site.researchByUrl["/pi-from-zero-and-one/"];
assert.ok(record, "the π paper is absent from canonical research metadata");
assert.equal(record.code, "TTI-I.02", "the π paper must follow Foundations in Part I");
assert.equal(record.kind, "Mathematical note", "the π paper has the wrong document type");
assert.match(record.status, /Established derivation/, "the exact mathematics is not identified in the status");
assert.equal(record.previous?.url, "/foundations/", "the π paper must follow Foundations");
assert.equal(record.next?.url, "/the-self/", "The Self must follow the π paper");

assert.equal($("h1").text().trim(), "Why π Appears Between Zero and One", "the π paper has the wrong heading");
assert.ok($("main > .page-head > .kicker").first().text().includes("TTI-I.02"),
  "the page heading does not expose the Part I document code");
assert.equal($("figure.plate#fig-unit-interval-pi").length, 1, "the unit-interval theorem plate is missing");
assert.equal($("#t-ledger").closest("section").find(".grid.three > .frame.card").length, 3,
  "the earned/chosen/refused ledger is incomplete");

for (const id of [
  "t-careful-claim", "t-beta-theorem", "t-change-variable", "t-arcsine-law",
  "t-checks", "t-arctangent", "t-basel-theorem", "t-non-euclidean", "t-ledger"
]) {
  assert.equal($(`#${id}`).length, 1, `the π paper is missing #${id}`);
}

for (const marker of [
  "B\\!\\left(\\frac12,\\frac12\\right)",
  "\\int_0^1\\frac{dx}{\\sqrt{x(1-x)}}",
  "\\int_{-1}^{1}\\frac{du}{\\sqrt{1-u^2}}",
  "f(x)=\\frac{1}{\\pi\\sqrt{x(1-x)}}",
  "4\\int_0^1\\frac{dx}{1+x^2}",
  "\\sum_{n=1}^{\\infty}\\frac{1}{n^2}=\\frac{\\pi^2}{6}"
]) {
  assert.ok(source.includes(marker), `the π paper is missing theorem marker: ${marker}`);
}

for (const statement of [
  "The numerals 0 and 1 alone do not force π",
  "normalised Euclidean circular closure introduces π",
  "Closure Alone Is Not Enough",
  "The theorem is exact;",
  "the cosmological reading is a proposal"
]) {
  assert.ok($("main").text().replace(/\s+/g, " ").includes(statement),
    `the established/speculative boundary is missing: ${statement}`);
}

const foundations = read("tti/src/foundations.njk");
const archive = read("tti/_site/archive/index.html");
const introduction = read("tti/_site/index.html");
for (const [name, document] of [["Foundations", foundations], ["archive", archive], ["introduction header", introduction]]) {
  assert.ok(document.includes('href="/pi-from-zero-and-one/"'), `${name} does not discover the π paper`);
}

const sitemap = read("tti/_site/sitemap.xml");
const feed = read("tti/_site/feed.xml");
assert.ok(sitemap.includes("https://the-two-infinities.hatchable.site/pi-from-zero-and-one/"),
  "the sitemap omits the π paper");
assert.ok(feed.includes("https://the-two-infinities.hatchable.site/pi-from-zero-and-one/"),
  "the Atom feed omits the π paper");

console.log("TTI π paper passed: beta integral, semicircle, arctangent and Basel routes remain exact and epistemically separated.");
