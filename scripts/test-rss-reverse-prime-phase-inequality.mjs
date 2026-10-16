#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-reverse-prime-phase-inequality-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.reverseInequalityProved, false);
assert.equal(results.verdict.independentEstablishedImplicationFound, false);
assert.equal(results.verdict.onlyEquivalentFactorisationsRecovered, true);
assert.equal(results.verdict.rigorousNearEqualityProvedFromLiterature, true);

const factorisation = results.canonicalFactorisation;
assert.match(factorisation.diskMap, /Re\(s\)>1\/2/);
assert.match(factorisation.factorisation, /Blaschke/);
assert.match(factorisation.bsyMass, /-log\|B\(1\)\|/);
assert.match(factorisation.nymanDistance, /1-exp\(-2S_BSY\)/);
assert.match(factorisation.stage33Relation, /D_2=0 iff S_BSY=0 iff B=1/);
assert.match(factorisation.logicalBarrier, /cannot prove B=1/);

assert.equal(results.candidateRoutes.length, 8);
for (const expected of [
  'Hardy/Nevanlinna canonical factorisation',
  'Balazard--Saias--Yor logarithmic integral',
  'Nyman--Beurling/Burnol Hardy projection',
  'Báez--Duarte discrete approximants',
  'de Branges--Sonine completeness and spectral synthesis',
  'Nevanlinna negative squares or an integer index',
  'conductor-operator/commutator formulae',
  'critical Chebyshev energy or subexponential Laguerre growth'
]) {
  assert.ok(results.candidateRoutes.some((row) => row.route === expected), `missing route audit: ${expected}`);
}
assert.ok(results.candidateRoutes.every((row) => row.circularityTest.length > 30));

const tail = results.verifiedTailBound;
assert.equal(tail.plattTrudgianHeight, '3000175332800');
assert.equal(tail.plattTrudgianZerosVerified, 12363153437138);
assert.match(tail.bellottiWongBound, /0\.10076log T\+0\.24460loglog T\+8\.08344/);
assert.match(tail.quartetPointwiseBound, /\(9\/2\)gamma\^-4\+\(3\/8\)gamma\^-6/);
const moment4 = Number(tail.tailMoment4.upper);
const moment6 = Number(tail.tailMoment6.upper);
const defectUpper = Number(tail.defectUpper);
assert.ok(moment4 > 2.0608e-37 && moment4 < 2.0609e-37);
assert.ok(moment6 > 2.05e-62 && moment6 < 2.051e-62);
assert.ok(Math.abs(defectUpper - (4.5 * moment4 + 0.375 * moment6)) < 1e-51);
assert.ok(defectUpper > 9.273e-37 && defectUpper < 9.274e-37);
assert.equal(tail.roundedCertifiedUpper, '9.274E-37');
assert.match(tail.nearReverseInequality, /0<=I_C\^crit-C'\/C\(2\)<9\.274e-37/);
assert.match(tail.exactCertificate.arithmetic, /exact rational intervals/);
assert.equal(tail.exactCertificate.strictComparison, 'defect upper < 9274/10^40');
assert.match(tail.doesNotImplyRh, /no known uniform positive gap/);

const collapse = results.collapsingMargin;
assert.equal(collapse.rows.length, 4);
assert.ok(collapse.rows.every((row) => Number(row.stage33Defect) > 0));
assert.ok(collapse.rows.every((row) => Number(row.bsyQuartetMass) > 0));
assert.ok(Number(collapse.rows[1].stage33Defect) < Number(collapse.rows[0].stage33Defect) / 9000);
assert.ok(Number(collapse.rows[3].stage33Defect) < Number(collapse.rows[2].stage33Defect) / 1e12);
assert.ok(Math.abs(Number(collapse.rows.at(-1).defectToBsyMassSquared) - 4.5) < 1e-10);
assert.match(collapse.highZeroAsymptotic, /18eta\^2\/gamma\^4/);

const evidence = results.evidenceAudit;
assert.equal(evidence.primaryEstablished.length, 6);
assert.ok(evidence.primaryEstablished.some((row) => /Balazard--Saias--Yor/.test(row.source)));
assert.ok(evidence.primaryEstablished.some((row) => /Platt--Trudgian/.test(row.source)));
assert.ok(evidence.primaryEstablished.some((row) => /Bellotti--Wong/.test(row.source)));
assert.equal(evidence.excludedSpeculativeClaims.length, 2);
assert.match(evidence.excludedClaimReason, /would not exclude zeros in 1\/2<Re\(s\)<=7\/8/);
assert.match(results.minimalOpenInput, /genuinely arithmetic information/);
assert.match(results.status, /RH remains open/);

const report = await read('docs/rh/rss-reverse-prime-phase-inequality.md');
for (const marker of [
  'The exact logical target',
  'The Balazard--Saias--Yor factorisation',
  'Burnol and the Nyman--Beurling obstruction',
  'Why generic outer-function theory cannot reverse the sign',
  'Other routes tested',
  'A rigorous quantitative near-reverse inequality',
  'Why the tiny tail does not close the proof',
  'Evidence classification',
  'Exact conclusion',
  '9.274\\times10^{-37}',
  'RH remains open.'
]) {
  assert.ok(report.includes(marker), `reverse-inequality report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The reverse phase inequality recovers the same inner factor'));
assert.ok(consolidated.includes('rss-reverse-prime-phase-inequality.md'));
assert.ok(consolidated.includes('Reverse prime-phase inequality search'));

const packageJson = JSON.parse(await read('package.json'));
assert.equal(
  packageJson.scripts['research:rss-reverse-prime-phase-inequality'],
  'python3 scripts/research-rss-reverse-prime-phase-inequality.py'
);
assert.match(packageJson.scripts['test:rss-reverse-prime-phase-inequality'], /test-rss-reverse-prime-phase-inequality\.mjs/);
assert.match(packageJson.scripts['audit:tti'], /test-rss-reverse-prime-phase-inequality\.mjs/);

console.log('Reverse prime-phase inequality tests passed: factorisation equivalences, circularity gates, evidence classes and certified 9.274e-37 tail bound verified.');
