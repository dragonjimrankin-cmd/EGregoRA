#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';

const expectedGroups = [
  ['g-introduction', 'Introduction', 1],
  ['g-foundations', 'Foundations', 1],
  ['g-the-self', 'The Self', 1],
  ['g-dx', 'dx', 2],
  ['g-gravity', 'Gravity', 1],
  ['g-spiral', 'The Spiral', 4],
  ['g-skeletal-splice', 'The Splice', 3],
  ['g-torus', 'Torus', 1],
  ['g-megatubule', 'The Megatubule', 3],
  ['g-moebius', 'Möbius', 1],
  ['g-cosmic-ledger', 'Cosmic Ledger', 1],
  ['g-seams', 'Seams', 1],
  ['g-essays', 'Essays', 1],
  ['g-temporal-antipodes', 'Temporal Antipodes', 1],
  ['g-entropy', 'Entropy and Integration', 1],
  ['g-double-inversion', 'Two Inversions', 1],
  ['g-accumulated-differentials', 'Accumulated Differentials', 1],
  ['g-time-and-residue', 'Time and Residue', 1],
  ['g-inverted-toruses', 'Inverted-Torus Universe', 1],
  ['g-wormholes', 'Wormholes and Inverted Tori', 1],
  ['g-out-of-phase', 'Matter and Antimatter Out of Phase', 1],
  ['g-little-red-dots', 'JWST’s Little Red Dots', 3]
];
const expectedPlateTotal = expectedGroups.reduce((total, group) => total + group[2], 0);

const [html, generator, css, js] = await Promise.all([
  readFile(new URL('../tti/_site/plates/index.html', import.meta.url), 'utf8'),
  readFile(new URL('./tti-gather-plates.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../tti/src/assets/css/main.css', import.meta.url), 'utf8'),
  readFile(new URL('../tti/src/assets/js/site.js', import.meta.url), 'utf8')
]);
const $ = cheerio.load(html);
const groups = $('.plate-accordion > .plate-accordion-group');

assert.equal(groups.length, expectedGroups.length, 'every source chapter should be one expandable heading');
assert.equal($('.plate-accordion-group[open]').length, 0, 'the plate room should load with every heading collapsed');
assert.equal($('.frame--first ul, .frame--first li').length, 0, 'the old bullet index is still present');
assert.equal($('.plate-accordion-group figure.plate').length, expectedPlateTotal,
  'the accordion does not contain all gathered plates');
assert.equal($('.plate-accordion-group[name="plate-room"]').length, expectedGroups.length,
  'the native one-open-at-a-time disclosure group is incomplete');
assert.equal($('[data-plate-accordion]').attr('aria-label'), undefined,
  'the data hook should not duplicate the labelled section semantics');
assert.equal($('.plate-accordion-wrap[aria-label="Plates grouped by source chapter"]').length, 1,
  'the grouped plate region needs its accessible label');

expectedGroups.forEach(([id, title, count], index) => {
  const group = groups.eq(index);
  assert.equal(group.attr('id'), id, `plate group ${index + 1} has the wrong stable fragment`);
  assert.equal(group.attr('name'), 'plate-room', `${title} is outside the exclusive disclosure group`);
  assert.equal(group.children('summary').length, 1, `${title} has no native disclosure control`);
  assert.equal(group.children('summary').find('h2').length, 1, `${title} is not exposed as a heading`);
  assert.equal(group.find('.plate-group-title').first().text().trim(), title, `${title} label drifted`);
  assert.equal(group.find('.plate-group-number').first().text().trim(), String(index + 1).padStart(2, '0'),
    `${title} has the wrong sequence number`);
  assert.equal(group.find('figure.plate').length, count, `${title} has the wrong plate count`);
  assert.equal(group.find('.plate-group-count').first().text().trim(), `${count} ${count === 1 ? 'plate' : 'plates'}`,
    `${title} has the wrong visible count`);
  assert.equal(group.find('.plate-group-context a[href]').length, 1, `${title} has no source-chapter link`);
});

assert.match(generator, /<details class="plate-accordion-group"[^>]+name="plate-room">/,
  'the generator no longer emits native exclusive disclosure groups');
assert.doesNotMatch(generator, /const indexItems/, 'the generator still creates the old bullet index');
assert.match(css, /\.plate-accordion-group\[open\]/, 'expanded plate headings have no visual state');
assert.match(css, /\.plate-group-toggle::after/, 'plate headings have no plus/minus affordance');
assert.match(css, /@media \(max-width: 620px\)/, 'plate accordion has no narrow-screen layout');
assert.match(css, /prefers-reduced-motion: reduce/, 'plate accordion animation ignores reduced-motion preferences');
assert.match(js, /const closePlateGroups/, 'older browsers cannot enforce one open plate group');
assert.match(js, /if \(group\.open\) closePlateGroups\(group\)/, 'opening a plate group does not close its siblings');
assert.match(js, /const openPlateFromHash/, 'stable plate-room fragment links are not restored');
assert.match(js, /openGroup\.removeAttribute\("open"\)/, 'Escape cannot close an expanded plate group');

console.log(`TTI plates passed: ${expectedGroups.length} exclusive headings contain all ${expectedPlateTotal} vector plates with no bullet index.`);
