import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import longform from '../tti/src/_data/longform.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builtRoot = path.join(root, 'tti', '_site');
const countWords = (value) => (value.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || []).length;

const integrations = [
  ['partI', 'part-i-first-principles.md', '/foundations/', 'From Nothing to a Self'],
  ['partII', 'part-ii-cosmic-architecture.md', '/gravity/', 'From Splice to Structure'],
  ['partIII', 'part-iii-seams-and-return.md', '/moebius/', 'The Universe at Its Seams'],
  ['partIV', 'part-iv-tests-and-essays.md', '/stress-tests/', 'How a Speculative Cosmology Faces Evidence'],
  ['partV', 'part-v-reading-rooms.md', '/plates/', 'The Reading Rooms'],
  ['partVI', 'part-vi-riemann-programme.md', '/riemann-programme/', 'Arithmetic, Proof and the Limits of Analogy']
];

for (const [key, filename, route, titleMarker] of integrations) {
  const sourcePath = path.join(root, 'tti', 'longform', filename);
  assert.ok(fs.existsSync(sourcePath), `${filename} is missing`);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const sourceWords = countWords(source);
  assert.ok(sourceWords >= 6000 && sourceWords <= 8000,
    `${filename} has ${sourceWords} words; expected 6000-8000`);
  assert.equal(longform[key].wordCount, sourceWords, `${key} data word count drifted`);
  assert.ok(longform[key].title.includes(titleMarker), `${key} has the wrong title`);

  const builtPath = path.join(builtRoot, route.replace(/^\//, ''), 'index.html');
  assert.ok(fs.existsSync(builtPath), `build TTI before testing ${route}`);
  const html = fs.readFileSync(builtPath, 'utf8');
  const $ = cheerio.load(html);
  const synthesis = $('.longform-synthesis.part-synthesis');
  assert.equal(synthesis.length, 1, `${route} must contain one Part synthesis`);
  assert.equal(synthesis.find('h1').length, 0, `${route} synthesis must not add a second h1`);
  assert.equal(synthesis.find('h2').first().text().includes(titleMarker), true,
    `${route} does not render the synthesis title`);
  assert.ok(countWords(synthesis.text()) >= 6000, `${route} rendered synthesis is too short`);
  assert.equal(synthesis.find('h2, h3, h4').filter((_, heading) => !$(heading).attr('id')).length, 0,
    `${route} synthesis has headings without stable IDs`);
  assert.equal(synthesis.find('.formula, math').length, 0, `${route} synthesis should minimise equations`);
  assert.ok(!/Part [IVX]+\s*[·:]\s*undefined/.test(synthesis.text()),
    `${route} synthesis contains an unresolved template value`);
}

const finalPath = path.join(root, 'tti', 'longform', 'final-synthesis.md');
const finalSource = fs.readFileSync(finalPath, 'utf8');
const finalWords = countWords(finalSource);
assert.ok(finalWords >= 10000 && finalWords <= 13000,
  `final synthesis has ${finalWords} words; expected 10000-13000`);
assert.equal(longform.final.wordCount, finalWords, 'final synthesis data word count drifted');

const homeHtml = fs.readFileSync(path.join(builtRoot, 'index.html'), 'utf8');
const home = cheerio.load(homeHtml);
assert.equal(home('.longform-synthesis.final-synthesis').length, 0,
  'homepage must not render the all-encompassing synthesis');
assert.equal(home('a[href="#longform-the-two-infinities-eternal-integration-of-the-self"]').length, 0,
  'homepage must not link to the removed all-encompassing synthesis');
assert.ok(!homeHtml.includes('A final, all-encompassing accessible synthesis'),
  'homepage still contains the all-encompassing synthesis copy');

console.log(`TTI long-form syntheses passed: six Part essays (${integrations.map(([key]) => longform[key].wordCount).join(', ')} words) remain integrated, the ${finalWords}-word final source remains preserved, and the homepage does not render it.`);
