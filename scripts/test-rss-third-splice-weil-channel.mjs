#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-third-splice-weil-results.json'));

assert.equal(results.analysisDate, '2026-10-14');
assert.equal(results.verdict.positiveWeilIdentityDerived, false);
assert.equal(results.verdict.canonicalExistingWeightMatchesWeil, false);
assert.equal(results.verdict.conditionalBoundaryWeightHasCorrectCuspOrder, true);
assert.equal(results.verdict.exactArithmeticDeformationFromDecimalSplices, false);

const splice = results.spliceArithmetic;
assert.equal(splice.base, 10, 'the literal decimal hierarchy must be preserved');
assert.equal(splice.thirdLevel.threshold, 1000);
assert.equal(splice.thirdLevel.fibonacciMultiplicity, 2);
assert.equal(splice.thirdLevel.returners, 4);
assert.ok(Math.abs(splice.thirdLevel.deposit - 0.9442719099991587) < 1e-14);
assert.ok(Math.abs(splice.cumulativeConstant + 1.570820393249937) < 1e-14);
assert.ok(splice.maximumDepositIdentityError < 1e-12);
assert.ok(splice.maximumCumulativeIdentityError < 1e-11);

const inherited = results.independentlyInheritedWeights;
assert.ok(inherited.generationSecondMoment > 0);
assert.ok(inherited.cumulativeSecondMoment > inherited.generationSecondMoment);

const rows = results.regularityComparison;
assert.ok(rows.length >= 8);
const last = rows.at(-1);
assert.ok(Math.abs(last.generationLedgerOverTSquared - inherited.generationSecondMoment)
  / inherited.generationSecondMoment < 1e-8);
assert.ok(Math.abs(last.cumulativeLedgerOverTSquared - inherited.cumulativeSecondMoment)
  / inherited.cumulativeSecondMoment < 1e-8);
assert.ok(last.targetOverTLog > 0.9);
assert.ok(last.boundaryTowerOverTLog > 0.01 && last.boundaryTowerOverTLog < 0.03);

const boundary = results.conditionalBoundaryModel;
assert.match(boundary.addedAssumption, /codimension-one boundary/);
assert.match(boundary.weightInterpretationAssumption, /multiplicity\/intensity/);
assert.match(boundary.weightInterpretationAssumption, /amplitude would square/);
assert.ok(boundary.boundaryRatioMaximum / boundary.boundaryRatioMinimum > 1.5,
  'decimal log-periodicity must remain visible');
assert.ok(boundary.phaseOneNormalizationNeededToForceCoefficientOne > 50);
assert.ok(boundary.maximumNormalizedPhaseDefect > 0.35);
assert.ok(boundary.continuumFill.resultingCuspCoefficient > 0.01);
assert.ok(boundary.continuumFill.resultingCuspCoefficient < 0.02);
assert.ok(boundary.continuumFill.normalizationNeededForUnitCusp > 50);

assert.ok(results.arithmeticDeformation.distanceFromFirstPrimeEventToDecimalGrid > 1);
assert.match(results.arithmeticDeformation.obstruction, /preserve decimal event support/);
assert.match(results.exactWeilIdentity.suzukiEquivalence, /equivalent to RH/);
assert.match(results.exactWeilIdentity.circularityWarning, /assumes the target positivity/);

const report = await read('docs/rh/rss-third-splice-weil-channel.md');
for (const marker of [
  'A new boundary action derives the first-order weight',
  'Discrete decimal scaling leaves a permanent fingerprint',
  'Filling every decade removes oscillation, but not the coefficient gap',
  'The exact arithmetic deformation that does exist',
  'The exact Weil identity and its unavoidable condition'
]) {
  assert.ok(report.includes(marker), `third-splice report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-third-splice"'));
assert.ok(publicSplice.includes('0.0175731'));
assert.ok(publicSplice.includes('1000</text>'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The splice at 1000 derives the cusp order'));
assert.ok(consolidated.includes('rss-third-splice-weil-channel.md'));

for (const path of [
  'tti/src/accumulated-differentials.njk',
  'tti/src/essays.njk',
  'tti/src/skeletal-splice.njk',
  'tti/src/spiral.njk',
  'tti/src/assets/js/oracle-knowledge.js'
]) {
  const source = await read(path);
  assert.ok(!source.includes('1.1708n-1.618') && !source.includes('1.1708n − 1.618'),
    `${path} retains the incorrect accumulation constant`);
}

console.log('Third-splice Weil channel passed: inherited weights, boundary cusp, decimal modulation, support obstruction and exact accumulation constant verified.');
