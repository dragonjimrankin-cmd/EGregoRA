#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import site from '../tti/src/_data/site.js';

const expectedTitle = 'The Shape of Becoming: Infinity, Gravity and Existence';
const expectedTagline = 'A speculative cosmology by Jim Rankin, UK, 2026';
const requiredLegacyRoutes = [
  '/foundations/', '/the-self/', '/dx/', '/gravity/', '/spiral/', '/skeletal-splice/',
  '/torus/', '/megatubule/', '/moebius/', '/cosmic-ledger/', '/seams/', '/stress-tests/',
  '/essays/', '/plates/', '/ask-shakdrah/'
];
const requiredNewRoutes = [
  '/entropy/', '/double-inversion/', '/accumulated-differentials/', '/little-red-dots/',
  '/little-red-dots/research-proposal/'
];

assert.equal(site.name, expectedTitle, 'the exact project title changed');
assert.equal(site.tagline, expectedTagline, 'the exact project tagline changed');
assert.equal(site.navGroups.length, 4, 'the header needs four readable navigation constellations');
assert.equal(site.navActions.length, 2, 'the plate room and ShakDrah must remain permanent actions');

const groupedItems = site.navGroups.flatMap((group) => group.items);
const headerItems = [...groupedItems, ...site.navActions];
assert.equal(headerItems.length, 20, 'the redesigned header should expose twenty destinations');
assert.equal(site.nav.length, headerItems.length, 'the flat footer navigation must retain header parity');
assert.equal(new Set(headerItems.map((item) => item.url)).size, headerItems.length,
  'header destinations must be unique');
for (const route of [...requiredLegacyRoutes, ...requiredNewRoutes]) {
  assert.ok(headerItems.some((item) => item.url === route), `header omits ${route}`);
}
for (const group of site.navGroups) {
  assert.ok(group.label && group.shortLabel && group.note, 'each navigation constellation needs full labels');
  assert.ok(group.items.length >= 3, `${group.label} is too slight to justify a grouped menu`);
  for (const item of group.items) {
    assert.ok(item.label && item.note && item.glyph, `${item.url} lacks navigation context`);
  }
}

const [headerSource, css, js] = await Promise.all([
  readFile(new URL('../tti/src/_includes/partials/header.njk', import.meta.url), 'utf8'),
  readFile(new URL('../tti/src/assets/css/main.css', import.meta.url), 'utf8'),
  readFile(new URL('../tti/src/assets/js/site.js', import.meta.url), 'utf8')
]);
assert.match(headerSource, /<details class="nav-cluster">/, 'grouped navigation is not native and keyboard-readable');
assert.match(headerSource, /class="nav-panel"/, 'header lacks contextual navigation panels');
assert.match(headerSource, /site\.navGroups/, 'header does not use the canonical grouped navigation');
assert.match(headerSource, /site\.navActions/, 'header does not expose the permanent actions');
assert.match(headerSource, /aria-controls="primary-nav"/, 'mobile navigation control is not connected');
assert.match(css, /\.site-head\s*\{[\s\S]*?position:\s*sticky;/, 'redesigned header is not sticky');
assert.match(css, /\.nav-panel\s*\{[\s\S]*?position:\s*absolute;/, 'desktop navigation panels are not layered');
assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.js-nav \.site-nav\.open/, 'mobile menu is not responsive');
assert.match(css, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  'tablet navigation does not use its available width');
assert.match(js, /classList\.add\("js-nav"\)/, 'progressive mobile navigation is not armed');
assert.match(js, /event\.key !== "Escape"/, 'Escape does not close the navigation');
assert.match(js, /cluster\.open\) closeClusters\(cluster\)/, 'navigation groups do not close their siblings');

if (process.argv.includes('--built')) {
  const fixtures = [
    ['../tti/_site/index.html', null],
    ['../tti/_site/entropy/index.html', '/entropy/'],
    ['../tti/_site/ask-shakdrah/index.html', '/ask-shakdrah/']
  ];
  for (const [relative, current] of fixtures) {
    const html = await readFile(new URL(relative, import.meta.url), 'utf8');
    const $ = cheerio.load(html);
    assert.equal($('.site-head').length, 1, `${relative} does not have one header`);
    assert.equal($('.brand-name').text().trim(), expectedTitle, `${relative} masthead title changed`);
    assert.equal($('.brand-tag').text().trim(), expectedTagline, `${relative} masthead tagline changed`);
    assert.equal($('#primary-nav .nav-cluster').length, 4, `${relative} does not expose four groups`);
    assert.equal($('#primary-nav .nav-panel').length, 4, `${relative} does not expose four panels`);
    const hrefs = $('#primary-nav a').map((_, element) => $(element).attr('href')).get();
    assert.deepEqual(hrefs, headerItems.map((item) => item.url), `${relative} navigation order drifted`);
    assert.equal(new Set(hrefs).size, 20, `${relative} duplicates a header destination`);
    assert.equal($('#primary-nav details[open]').length, 0, `${relative} ships with a menu forced open`);
    assert.equal($('.nav-toggle[aria-expanded="false"]').length, 1, `${relative} toggle state is incorrect`);
    const currentLinks = $('#primary-nav a[aria-current="page"]');
    assert.equal(currentLinks.length, current ? 1 : 0, `${relative} current-page state is incorrect`);
    if (current) assert.equal(currentLinks.attr('href'), current, `${relative} highlights the wrong destination`);
  }
}

console.log(`TTI header passed: four constellations, ${headerItems.length} unique destinations, exact identity, responsive controls and active-page state.`);
