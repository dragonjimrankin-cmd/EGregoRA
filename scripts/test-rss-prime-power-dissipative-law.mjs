#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const data = JSON.parse(await read('docs/rh/rss-prime-power-dissipative-law-results.json'));
const report = await read('docs/rh/rss-prime-power-dissipative-law.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.equal(data.verdict.arithmeticDissipativeLawDerived, true);
assert.equal(data.verdict.usesVonMangoldtPrimePowers, true);
assert.equal(data.verdict.naturalGradientIsEtaDotMinusEta, true);
assert.equal(data.verdict.goldenTimeRecovered, true);
assert.equal(data.verdict.positiveMixtureRigidityProvedForFiniteLedgers, true);
assert.equal(data.verdict.actualXiZeroLedgerFollowsLaw, false);
assert.equal(data.verdict.sameXiIntertwinerDerived, false);
assert.equal(data.verdict.rhProved, false);

const family = data.primePowerFamily;
assert.match(family.vonMangoldtMoment, /-zeta'\/zeta/);
assert.match(family.probability, /Lambda\(n\)/);
assert.match(family.relativeEntropy, /A\(2\)-A\(a\)/);
assert.match(family.fisherMetric, /Var_eta/);
assert.equal(family.naturalGradient, 'deta/dt=-I_eta^(-1)dD/deta=-eta');
assert.match(family.dissipation, /<0/);
assert.match(family.goldenTime, /phi/);

const computation = data.finiteComputation;
assert.equal(computation.cutoff, 200000);
assert.equal(computation.primePowers, 18120);
assert.equal(computation.rows.length, 6);
for (const row of computation.rows) {
  assert.ok(Math.abs(row.naturalGradientVelocity + row.eta) < 2e-15);
  assert.ok(row.relativeEntropyToCentral > 0);
  assert.ok(row.fisherMetricEta > 0);
  assert.ok(row.dissipationRate < 0);
  assert.equal(row.goldenStepStrictlyDissipates, true);
  assert.ok(row.relativeEntropyAtGoldenTime < row.relativeEntropyToCentral);
}

const rigidity = data.positiveMixtureRigidity;
assert.match(rigidity.statement, /forces every eta=0/);
assert.equal(rigidity.rows.length, 3);
assert.ok(rigidity.rows.every((row) => row.totalVariationFromCentral > 0));
assert.ok(rigidity.rows.every((row) => row.relativeEntropyFromCentral > 0));
assert.ok(rigidity.rows.every((row) => row.equalsCentralLedger === false));
assert.ok(rigidity.rows.at(-1).tailRatioAtLargestPrimePower > 1000);
assert.match(rigidity.conditionalRhClosure, /force RH/);

const signed = data.signedExplicitFormulaGate;
assert.match(signed.rawQuartetCarrier, /cosh/);
assert.match(signed.rawQuartetCarrier, /cos/);
assert.ok(signed.positivePrimePowersThroughCutoff > 0);
assert.ok(signed.negativePrimePowersThroughCutoff > 0);
assert.ok(signed.sampleRows.some((row) => row.sign === 'positive'));
assert.ok(signed.sampleRows.some((row) => row.sign === 'negative'));
assert.match(signed.conclusion, /not an identity/);

assert.equal(data.bridgeGates.length, 5);
assert.ok(data.bridgeGates.some((row) => /prime-pair/.test(row.failure)));
assert.match(data.heatBathAlternative.property, /unique stationary/);
assert.match(data.heatBathAlternative.gate, /not the zeros/);
assert.match(data.nextNarrowTarget.knownObstruction, /signed/);
assert.match(data.status, /RH remains open/);

for (const marker of [
  'Thirty-ninth-stage investigation',
  'A genuine arithmetic dissipative law has been found',
  'Derivation from the Euler product',
  'Positive reflection mixtures are rigid',
  'The signed explicit-formula gate',
  'Why squaring does not immediately repair it',
  'Arithmetic dissipation is proved; same-'
]) {
  assert.ok(report.includes(marker), `prime-power dissipative report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const annihilation = await read('docs/rh/rss-global-annihilation-proof-search.md');
assert.ok(annihilation.includes('rss-prime-power-dissipative-law.md'));
const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-prime-power-dissipative-law.md'));
assert.ok(consolidated.includes('Prime-power arithmetic supplies dissipation but not the xi intertwiner'));

console.log('Prime-power dissipative law passed: von-Mangoldt exponential family, exact natural gradient, golden entropy decay, positive-mixture rigidity and signed explicit-formula gate verified.');
