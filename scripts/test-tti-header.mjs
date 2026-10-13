#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import site from '../tti/src/_data/site.js';
import ttiAtlas from '../tti/src/_data/ttiAtlas.js';

const expectedTitle = 'The Shape of Becoming: Infinity, Gravity and Existence';
const expectedTagline = 'A speculative cosmology by Jim Rankin, UK, 2026';
const expectedParts = ttiAtlas.limbs;
const expectedItems = expectedParts.flatMap((part) => part.subs);

assert.equal(site.name, expectedTitle, 'the exact project title changed');
assert.equal(site.tagline, expectedTagline, 'the exact project tagline changed');
assert.equal(site.navGroups.length, 5, 'the header must list all five numbered Parts');
assert.equal(site.navActions.length, 0, 'Part V must contain the reading rooms without detached duplicate actions');

const headerItems = site.navGroups.flatMap((group) => group.items);
assert.equal(headerItems.length, 27, 'the five Parts must expose all 27 page and account-room destinations');
assert.equal(site.nav.length, headerItems.length, 'the flat footer navigation must retain header parity');
assert.equal(new Set(headerItems.map((item) => item.url)).size, headerItems.length,
  'header destinations must be unique');
assert.deepEqual(headerItems.map((item) => item.url), expectedItems.map((item) => item.href),
  'header page order must follow the Atlas table of contents');

for (const [index, group] of site.navGroups.entries()) {
  const expected = expectedParts[index];
  assert.equal(group.part, expected.num, `${expected.title} has the wrong Part number`);
  assert.equal(group.shortLabel, expected.title, `Part ${expected.num} has the wrong heading`);
  assert.equal(group.label, `Part ${expected.num} · ${expected.title}`, `Part ${expected.num} lacks its full label`);
  assert.equal(group.note, expected.note, `Part ${expected.num} has drifted from the Atlas description`);
  assert.equal(group.items.length, expected.subs.length, `Part ${expected.num} omits a page subheading`);
  for (const item of group.items) {
    assert.ok(item.label && item.note && item.glyph, `${item.url} lacks navigation context`);
  }
}
for (const route of [
  '/prime-plane/', '/temporal-antipodes/', '/time-and-residue/', '/inverted-toruses/',
  '/out-of-phase/', '/plates/', '/ask-shakdrah/', '/join/', '/account/'
]) {
  assert.ok(headerItems.some((item) => item.url === route), `header omits ${route}`);
}

const [headerSource, css, js] = await Promise.all([
  readFile(new URL('../tti/src/_includes/partials/header.njk', import.meta.url), 'utf8'),
  readFile(new URL('../tti/src/assets/css/main.css', import.meta.url), 'utf8'),
  readFile(new URL('../tti/src/assets/js/site.js', import.meta.url), 'utf8')
]);
assert.match(headerSource, /<details class="nav-cluster">/, 'Part navigation is not native and keyboard-readable');
assert.match(headerSource, /Part \{\{ group\.part \}\}/, 'the numbered Part is not visible in each header heading');
assert.match(headerSource, /class="nav-cluster-title"/, 'the Part title is absent from the header rail');
assert.match(headerSource, /class="nav-panel"/, 'header lacks page-subheading panels');
assert.match(headerSource, /site\.navGroups/, 'header does not use the canonical grouped navigation');
assert.match(headerSource, /aria-controls="primary-nav"/, 'mobile navigation control is not connected');
assert.match(css, /\.site-head\s*\{[\s\S]*?position:\s*sticky;/, 'redesigned header is not sticky');
assert.match(css, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/,
  'desktop header does not give each Part its own column');
assert.match(css, /\.nav-panel\s*\{[\s\S]*?position:\s*absolute;/, 'desktop navigation panels are not layered');
assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.js-nav \.site-nav\.open/, 'mobile menu is not responsive');
assert.match(css, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  'tablet navigation does not use its available width');
assert.match(js, /classList\.add\("js-nav"\)/, 'progressive mobile navigation is not armed');
assert.match(js, /event\.key !== "Escape"/, 'Escape does not close the navigation');
assert.match(js, /cluster\.open\) closeClusters\(cluster\)/, 'navigation Parts do not close their siblings');
assert.match(js, /runtimePartLabels/, 'runtime Join and Account page labels are not aligned');
assert.match(js, /Part V \\u2014 Reading Rooms \\u00b7 Join/, 'Join does not carry the Part V page label');
assert.match(js, /Part V \\u2014 Reading Rooms \\u00b7 Your Account/, 'Account does not carry the Part V page label');

if (process.argv.includes('--built')) {
  const fixtures = [
    ['../tti/_site/index.html', null],
    ['../tti/_site/temporal-antipodes/index.html', '/temporal-antipodes/'],
    ['../tti/_site/ask-shakdrah/index.html', '/ask-shakdrah/']
  ];
  for (const [relative, current] of fixtures) {
    const html = await readFile(new URL(relative, import.meta.url), 'utf8');
    const $ = cheerio.load(html);
    assert.equal($('.site-head').length, 1, `${relative} does not have one header`);
    assert.equal($('.brand-name').text().trim(), expectedTitle, `${relative} masthead title changed`);
    assert.equal($('.brand-tag').text().trim(), expectedTagline, `${relative} masthead tagline changed`);
    assert.equal($('#primary-nav .nav-cluster').length, 5, `${relative} does not expose five Parts`);
    assert.equal($('#primary-nav .nav-panel').length, 5, `${relative} does not expose five page panels`);
    assert.equal($('#primary-nav .nav-actions').length, 0, `${relative} retains detached duplicate actions`);

    $('#primary-nav .nav-cluster').each((index, element) => {
      const expected = expectedParts[index];
      const cluster = $(element);
      assert.equal(cluster.find('.nav-cluster-index').first().text().trim(), `Part ${expected.num}`,
        `${relative} mislabels Part ${expected.num}`);
      assert.equal(cluster.find('.nav-cluster-title').first().text().trim(), expected.title,
        `${relative} misnames Part ${expected.num}`);
      assert.deepEqual(
        cluster.find('.nav-panel a').map((_, link) => $(link).attr('href')).get(),
        expected.subs.map((item) => item.href),
        `${relative} drifts within Part ${expected.num}`
      );
    });

    const hrefs = $('#primary-nav a').map((_, element) => $(element).attr('href')).get();
    assert.deepEqual(hrefs, headerItems.map((item) => item.url), `${relative} navigation order drifted`);
    assert.equal(new Set(hrefs).size, 27, `${relative} duplicates a header destination`);
    assert.equal($('#primary-nav details[open]').length, 0, `${relative} ships with a menu forced open`);
    assert.equal($('.nav-toggle[aria-expanded="false"]').length, 1, `${relative} toggle state is incorrect`);
    const currentLinks = $('#primary-nav a[aria-current="page"]');
    assert.equal(currentLinks.length, current ? 1 : 0, `${relative} current-page state is incorrect`);
    if (current) assert.equal(currentLinks.attr('href'), current, `${relative} highlights the wrong destination`);
  }

  for (const [partIndex, part] of expectedParts.entries()) {
    const group = site.navGroups[partIndex];
    for (const item of group.items) {
      if (item.url === '/join/' || item.url === '/account/') continue;
      const html = await readFile(new URL(`../tti/_site${item.url}index.html`, import.meta.url), 'utf8');
      const $ = cheerio.load(html);
      const visible = $('main > .page-head > .kicker').first().text().replace(/\s+/g, ' ').trim().replace(/’/g, "'");
      const expected = `Part ${part.num} — ${part.title} · ${item.label}`.replace(/’/g, "'");
      assert.ok(visible.startsWith(expected),
        `${item.url} page label is ${visible || 'missing'}, expected it to begin ${expected}`);
    }
  }
}

console.log(`TTI header passed: five numbered Parts, ${headerItems.length} unique page subheadings, matching page labels, exact identity, responsive controls and active-page state.`);
