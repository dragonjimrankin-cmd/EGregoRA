#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import site from '../tti/src/_data/site.js';

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
const [source, built, atlas, guides, primePlane, skeletal, piPaper, oracle] = await Promise.all([
  read('tti/src/decimal-splice.njk'),
  read('tti/_site/decimal-splice/index.html'),
  read('tti/src/_data/ttiAtlas.js'),
  read('tti/src/_data/editorialGuides.js'),
  read('tti/src/prime-plane.njk'),
  read('tti/src/skeletal-splice.njk'),
  read('tti/src/pi-from-zero-and-one.njk'),
  read('tti/src/assets/js/oracle-knowledge.js')
]);

const record = site.researchByUrl['/decimal-splice/'];
assert.ok(record, 'decimal splice is absent from canonical research metadata');
assert.equal(record.code, 'TTI-II.06');
assert.equal(record.kind, 'Phase model');
assert.equal(record.status, 'Working hypothesis');
assert.ok(atlas.includes('page("II·vi", "The Decimal Splice", "/decimal-splice/"'));
assert.ok(guides.includes('"/decimal-splice/": guide('));

for (const marker of [
  'One Splice Reverses the Sign; Two Restore It',
  'Why Five and π/10 Appear Together',
  'This Is the Interval from Zero to Ten, Not the Shell from One to Ten',
  'Decimal Partners Carry Opposite Centred Phases',
  'Route, Orientation and Clock Are Three Different Records',
  'π/10 Selects the Five-to-Four Clock',
  'The Decimal-Splice Ledger',
  'A Phase Law Must Predict More Than Its Diagram',
  'S=e^{i\\pi}=-1',
  'S^2\\psi=e^{i2\\pi}\\psi=\\psi',
  '\\frac{\\pi}{10}\\,5=\\frac{\\pi}{2}',
  '\\Delta\\theta_{5\\to4}',
  '\\Delta\\theta_k=-\\frac{k\\pi}{10}'
]) {
  assert.ok(source.includes(marker), `decimal-splice source is missing: ${marker}`);
}
assert.doesNotMatch(source, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const $ = cheerio.load(built);
assert.equal($('h1').text().trim(), 'The Decimal Splice');
assert.equal($('.editorial-guide').length, 1);
assert.equal($('figure.plate').length, 2);
assert.equal($('#fig-decimal-phase').length, 1);
assert.equal($('#fig-decimal-holonomy').length, 1);
assert.equal($('.project-record-code').text().trim(), 'TTI-II.06');
assert.ok($('main').text().includes('One Splice Reverses the Sign'));
assert.ok($('main').text().includes('five-to-four model'));
assert.ok($('main').text().includes('does not prove RH'));

for (const [name, text] of [
  ['Prime Plane', primePlane],
  ['Skeletal Splice', skeletal],
  ['pi unit-interval paper', piPaper]
]) {
  assert.ok(text.includes('href="/decimal-splice/"'), `${name} does not link to the Decimal Splice`);
}
assert.ok(oracle.includes('id: "decimal-splice-phase"'));
assert.ok(oracle.includes('Does the decimal splice reverse sign or return periodically?'));

console.log('TTI Decimal Splice passed: pi-over-ten normalisation, five-hinge, one-pass inversion, two-pass return and five-to-four selector verified.');
