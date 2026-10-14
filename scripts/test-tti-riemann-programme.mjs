#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import site from '../tti/src/_data/site.js';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const exists = async (relative) => {
  try { return (await stat(new URL(relative, root))).isFile(); } catch { return false; }
};

const expected = [
  {
    route: '/riemann-programme/',
    source: 'tti/src/riemann-programme.njk',
    code: 'TTI-VI.01',
    title: 'The Riemann Dossier',
    status: 'Audited synthesis',
    figure: 'fig-rh-identity-gap',
    markers: ['52 documents and 916,946 bytes', 'It does not contain or claim a proof', '(\\log\\xi)\'\'(\\sigma)>0']
  },
  {
    route: '/riemann-proof-audit/',
    source: 'tti/src/riemann-proof-audit.njk',
    code: 'TTI-VI.02',
    title: 'Proof and Correction Ledger',
    status: 'Corrections required',
    figure: 'fig-rh-correction-cascade',
    markers: ['the small-\\(t\\) inequality points the wrong way', 'Unconditional complete', 'reverse implication is not proved']
  },
  {
    route: '/riemann-splice-questions/',
    source: 'tti/src/riemann-splice-questions.njk',
    code: 'TTI-VI.03',
    title: 'The Splice Questions After RH',
    status: 'No coefficient derivation',
    figure: 'fig-rh-splice-gates',
    markers: ['10:\\text{ localised gravitational source}', 'G=C_{10}', 'No independent \\(r_0\\)']
  }
];

assert.equal(site.revision, 'r3.5', 'Riemann programme must remain integrated in restored revision r3.5');
assert.equal(site.research.documentCount, 30, 'Riemann programme must add three research studies');
assert.equal(site.research.resourceCount, 4, 'reading-room resources must remain unchanged');

const part = site.navGroups.find((group) => group.part === 'VI');
assert.ok(part, 'Part VI Riemann Programme is absent');
assert.equal(part.shortLabel, 'Riemann Programme', 'Part VI has the wrong title');
assert.deepEqual(part.items.map((item) => item.url), expected.map((item) => item.route),
  'Part VI route order drifted');

const masterPath = 'docs/rh/RH_CONSOLIDATED_AUDIT.md';
assert.ok(await exists(masterPath), 'consolidated RH source audit is missing');
const master = await read(masterPath);
for (const marker of [
  '52 files, 916,946 bytes',
  'Four pairs are byte-for-byte identical',
  'Strict real-axis log-convexity',
  'no unique splice-to-action map',
  'No source document derives a spacetime action',
  'The archive does **not** answer TTI’s open splice questions'
]) {
  assert.ok(master.includes(marker), `consolidated RH audit is missing: ${marker}`);
}
assert.match(master, /RH proof \| Not achieved/, 'source audit must state the RH verdict plainly');

for (const item of expected) {
  assert.ok(await exists(item.source), `${item.source} is missing`);
  const source = await read(item.source);
  for (const marker of item.markers) {
    assert.ok(source.includes(marker), `${item.source} is missing audit marker: ${marker}`);
  }
  assert.ok(source.includes(`id="${item.figure}"`), `${item.source} is missing its infographic`);
  assert.match(source, /role="img" aria-label="[^"]+"/, `${item.source} infographic lacks an accessible description`);
  assert.match(source, /<figcaption class="plate-cap">/, `${item.source} infographic lacks a caption`);

  const record = site.researchByUrl[item.route];
  assert.ok(record, `${item.route} is absent from canonical research metadata`);
  assert.equal(record.code, item.code, `${item.route} has the wrong code`);
  assert.equal(record.label, item.title, `${item.route} has the wrong label`);
  assert.equal(record.status, item.status, `${item.route} has the wrong evidence status`);

  const builtPath = `tti/_site${item.route}index.html`;
  assert.ok(await exists(builtPath), `build TTI before testing ${item.route}`);
  const $ = cheerio.load(await read(builtPath));
  assert.equal($('h1').first().text().trim(), item.title, `${item.route} has the wrong h1`);
  assert.equal($(`#${item.figure}`).length, 1, `${item.route} did not build its infographic`);
  assert.equal($(`#${item.figure} [role="img"][aria-label]`).length, 1,
    `${item.route} built infographic is not screen-reader labelled`);
  assert.ok($('.sci, .hist, .spec, .myth').length > 0, `${item.route} lacks evidence grading`);
}

const dossier = await read('tti/src/riemann-programme.njk');
const proofAudit = await read('tti/src/riemann-proof-audit.njk');
const splice = await read('tti/src/riemann-splice-questions.njk');
assert.match(dossier, /strict log-convexity/i, 'surviving real-axis result is absent');
assert.match(proofAudit, /only\s+the\s+first\s+term\s+can\s+be\s+negative/i,
  'Bernstein threshold error is not quoted for correction');
assert.match(proofAudit, /more\s+early\s+zeros,\s+not\s+fewer/i, 'Bernstein threshold correction is absent');
assert.match(splice, /does not replace decimal splices with an arbitrary base/i,
  'literal base-ten correction is not preserved');
assert.match(splice, /no physical scale appears/i, 'G scale verdict is missing');
assert.match(splice, /numerical coupling remains underdetermined/i, 'electromagnetic normalisation verdict is missing');

console.log('TTI Riemann Programme passed: 52-file consolidation, three audited studies, accessible infographics, correction ledger and splice verdicts verified.');
