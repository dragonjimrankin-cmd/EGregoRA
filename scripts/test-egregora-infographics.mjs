#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';

const expected = [
  ['info-astrology', 'Astrology', 1],
  ['info-astronomy', 'Astronomy', 4],
  ['info-decoherence', 'Decoherence & the Remembered Self', 5],
  ['info-elemental-alchemy', 'Elemental Alchemy', 9],
  ['info-locality', 'Local & Non-Local Reality', 11],
  ['info-neurobiology', 'Neurobiology', 3],
  ['info-runes', 'Runes, Charms & Natural Energies', 3],
  ['info-sacred-geometry', 'Sacred Geometry', 12],
  ['info-cosmic-aether', 'The Cosmic Aether', 7],
  ['info-qabalah', 'The Hermetic Qabalah', 6],
  ['info-occult', 'The Occult', 3],
  ['info-wizardry', 'Wizardry & Rituals', 7],
  ['info-infographics', 'Infographics', 40]
];
const total = expected.reduce((sum, entry) => sum + entry[2], 0);

const [html, css, js] = await Promise.all([
  readFile(new URL('../egregora-patch/public/infographics/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../egregora-patch/public/assets/css/infographics-accordion.css', import.meta.url), 'utf8'),
  readFile(new URL('../egregora-patch/public/assets/js/infographics-accordion.js', import.meta.url), 'utf8')
]);
const $ = cheerio.load(html);
const folds = $('.info-fold[name="infographic-room"]');

assert.equal($('body').attr('data-page'), 'infographics', 'the page identity changed');
assert.equal(folds.length, expected.length, 'every infographic source must have one expandable heading');
assert.equal($('.info-accordion-row').length, expected.length, 'each heading needs one compact accordion row');
assert.equal($('.info-fold[open]').length, 0, 'all infographic headings must begin collapsed');
assert.equal($('.info-fold > summary > h2').length, expected.length, 'each disclosure must expose a real heading');
assert.equal(new Set(folds.map((_, fold) => $(fold).attr('id')).get()).size, expected.length,
  'infographic heading fragments must be unique');
assert.equal($('figure').length, total, 'the page does not contain all 111 infographics');
assert.equal(folds.find('figure').length, total, 'some infographics remain permanently expanded outside the folds');
assert.equal($('.plate-card').length, 71, 'the gathered source-page cards changed');
assert.equal($('.info-fold--own figure').length, 40, 'the forty original infographic-page plates are not folded together');
assert.equal($('.info-fold[name="infographic-room"]').length, expected.length,
  'native one-open-at-a-time grouping is incomplete');
assert.equal($('link[href="/assets/css/infographics-accordion.css?v=exclusive-folds-1"]').length, 1,
  'the scoped accordion stylesheet is not loaded');
assert.equal($('script[src="/assets/js/infographics-accordion.js?v=exclusive-folds-1"]').length, 1,
  'the accordion behaviour is not loaded');
assert.match($('.frame.illuminated').text(), /111 drawings in thirteen sections/,
  'the collection introduction does not explain the new grouped view');
assert.match($('meta[name="description"]').attr('content') || '', /One hundred and eleven illustrated plates/,
  'the infographic count in metadata is stale');
const structuredData = JSON.parse($('script[type="application/ld+json"]').first().text());
assert.match(JSON.stringify(structuredData), /One hundred and eleven illustrated plates/,
  'the infographic count in structured data is stale');

expected.forEach(([id, title, count], index) => {
  const fold = folds.eq(index);
  assert.equal(fold.attr('id'), id, `${title} has the wrong stable fragment`);
  assert.equal(fold.find('.info-fold-number').first().text().trim(), String(index + 1).padStart(2, '0'),
    `${title} has the wrong sequence number`);
  assert.equal(fold.find('.info-fold-title').first().text().trim(), title, `${title} label drifted`);
  assert.equal(fold.find('figure').length, count, `${title} has the wrong drawing count`);
  assert.equal(fold.find('.info-fold-count').first().text().trim(), `${count} ${count === 1 ? 'drawing' : 'drawings'}`,
    `${title} displays the wrong drawing count`);
});

assert.match(css, /\.info-fold\[open\]/, 'open infographic headings have no visible state');
assert.match(css, /\.info-fold-toggle::after/, 'infographic headings have no plus/minus affordance');
assert.match(css, /@media \(max-width: 620px\)/, 'infographic accordion has no mobile layout');
assert.match(css, /prefers-reduced-motion: reduce/, 'infographic accordion ignores reduced motion');
assert.match(js, /const closeFolds/, 'older browsers cannot enforce one open infographic section');
assert.match(js, /if \(fold\.open\) closeFolds\(fold\)/, 'opening one infographic section does not close its siblings');
assert.match(js, /const openFromHash/, 'stable infographic fragment links are not supported');
assert.match(js, /openFold\.removeAttribute\("open"\)/, 'Escape cannot close the expanded infographic section');

console.log(`EGregoRA infographics passed: ${expected.length} exclusive headings contain all ${total} drawings, including the forty-page collection.`);
