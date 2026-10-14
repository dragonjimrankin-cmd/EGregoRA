#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ttiAtlas from "../tti/src/_data/ttiAtlas.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const homeFile = "tti/_site/index.html";
const archiveFile = "tti/_site/archive/index.html";
assert.ok(exists(homeFile) && exists(archiveFile), "build tti/_site before running the Atlas regression");

const home = read(homeFile);
const archive = read(archiveFile);
const atlasJs = read("tti/src/assets/js/atlas.js");
const css = read("tti/src/assets/css/main.css");
const atlasSource = read("tti/src/_data/ttiAtlas.js");

assert.equal(ttiAtlas.limbs.length, 6, "the map must keep six TTI-specific reading paths");
assert.deepEqual(
  ttiAtlas.limbs.map((route) => route.title),
  ["First Principles", "Cosmic Architecture", "Seams and Return", "Tests and Essays", "Reading Rooms", "Riemann Programme"],
  "unexpected top-level reading paths"
);

const destinations = ttiAtlas.limbs.flatMap((route) => route.subs);
assert.equal(destinations.length, 34, "the six reading paths must contain all 34 page and account-room destinations");
assert.ok(ttiAtlas.limbs.every((route) => route.note && route.subs.length >= 3), "every path needs an explanation and at least three destinations");
assert.ok(destinations.every((item) => item.title && item.note && item.href.startsWith("/") && item.href.endsWith("/")), "every destination needs a title, note and stable absolute URL");

const mappedHrefs = destinations.map((item) => item.href);
assert.equal(new Set(mappedHrefs).size, mappedHrefs.length, "Atlas destination URLs must be unique");
for (const required of [
  "/foundations/", "/pi-from-zero-and-one/", "/prime-plane/", "/entropy-and-self-renewal/", "/cosmic-ratio-in-time/", "/gravity/", "/torus/", "/moebius/", "/entropy/",
  "/inverted-toruses/", "/wormholes/", "/double-inversion/", "/accumulated-differentials/", "/little-red-dots/",
  "/little-red-dots/research-proposal/", "/riemann-programme/", "/riemann-proof-audit/", "/riemann-splice-questions/",
  "/plates/", "/ask-shakdrah/", "/join/", "/account/"
]) {
  assert.ok(mappedHrefs.includes(required), `Atlas is missing ${required}`);
}

function builtHtmlRoutes(dir, relative = "") {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const childRelative = path.posix.join(relative, entry.name);
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...builtHtmlRoutes(child, childRelative));
    else if (entry.name === "index.html") {
      const parent = path.posix.dirname(childRelative);
      found.push(parent === "." ? "/" : `/${parent}/`);
    }
  }
  return found;
}

const staticPageRoutes = builtHtmlRoutes(path.join(root, "tti/_site"))
  .filter((route) => route !== "/" && route !== "/archive/");
for (const route of staticPageRoutes) {
  assert.ok(mappedHrefs.includes(route), `built TTI research page is absent from the Atlas: ${route}`);
}
assert.ok(!home.includes('id="atlas-box"'), "the concise introduction must not embed the complete Atlas");

for (const marker of [
  'id="atlas-box"', 'id="atlas-stage"', 'id="atlas-labels"', 'id="atlas-data"',
  'id="at-find"', 'id="at-focus"', 'id="at-spin"', 'id="at-fold"', 'id="at-home"',
  "The Atlas of Becoming", "The same map, written out", 'aria-label="Written TTI navigation map"',
  'type="module" src="/assets/js/atlas.js"'
]) {
  assert.ok(archive.includes(marker), `rendered archive is missing Atlas marker: ${marker}`);
}
assert.equal((archive.match(/data-skin=/g) || []).length, 4, "the map must retain its four visual forms");

const embeddedMatch = archive.match(/<script type="application\/json" id="atlas-data">([\s\S]*?)<\/script>/);
assert.ok(embeddedMatch, "the rendered archive must carry its Atlas JSON feed");
assert.deepEqual(JSON.parse(embeddedMatch[1]), ttiAtlas, "the rendered Atlas feed differs from its authoritative data");

const transcriptStart = archive.indexOf('aria-label="Written TTI navigation map"');
const transcriptEnd = archive.indexOf("</nav>", transcriptStart);
assert.ok(transcriptStart >= 0 && transcriptEnd > transcriptStart, "written fallback navigation is malformed");
const transcript = archive.slice(transcriptStart, transcriptEnd);
for (const href of mappedHrefs) {
  assert.ok(transcript.includes(`href="${href}"`), `written fallback is missing ${href}`);
}

for (const marker of [
  'const SAVED = "tti-atlas-skin"', 'title: "The Möbius Seam"', 'href: "/moebius/"',
  "prefers-reduced-motion: reduce", "Folded back to the six reading paths", "openOnly", "atlas--off"
]) {
  assert.ok(atlasJs.includes(marker), `Atlas engine is missing TTI marker: ${marker}`);
}
for (const forbidden of ["EGregoRA", "eleven", "Moebius", "eg-atlas-skin", "Cosmic Aether"]) {
  assert.ok(!atlasJs.includes(forbidden), `Atlas engine still contains inherited EG-specific text: ${forbidden}`);
}
assert.ok(!atlasSource.includes("Moebius"), "Atlas data must use the user-visible Möbius spelling");

for (const marker of [".atlas-grid", ".atlas-stage", ".atlas-label", ".atlas--off", "body.atlas-focused", "#atlas-box.is-focused"]) {
  assert.ok(css.includes(marker), `Atlas styling is missing ${marker}`);
}
assert.ok(exists("tti/src/assets/js/vendor/three.module.js"), "the local Three.js module is missing");
assert.ok(home.includes("The Two Infinities: Eternal Integration of the Self"), "the exact project title must remain on the introduction");
assert.ok(home.includes('<h1 class="hero-title" id="hero-title"><span>The Two Infinities:</span><br><em>Eternal Integration of the Self.</em></h1>'),
  "the restored r3.5 hero must retain the exact split project title");
assert.ok(home.includes("A speculative cosmology by Jim Rankin, UK, 2026"), "the exact masthead tagline must remain on the introduction");
assert.ok(archive.includes("The Two Infinities: Eternal Integration of the Self"), "the archive must retain the exact project title");

console.log(`TTI Atlas regression passed: ${ttiAtlas.limbs.length} paths, ${destinations.length} destinations, ${staticPageRoutes.length} built pages.`);
