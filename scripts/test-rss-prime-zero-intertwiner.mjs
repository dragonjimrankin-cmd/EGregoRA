#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const data = JSON.parse(await read('docs/rh/rss-prime-zero-intertwiner-results.json'));
const report = await read('docs/rh/rss-prime-zero-intertwiner.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.equal(data.verdict.canonicalPrimeZeroFeatureMapConstructed, true);
assert.equal(data.verdict.featureDiagonalEqualsPrimePowerLaw, true);
assert.equal(data.verdict.positiveGlobalMixtureCriterionEquivalentToRh, true);
assert.equal(data.verdict.linearPhaseAveragingProducesPositiveIntertwiner, false);
assert.equal(data.verdict.quadraticLiftRemovesOrdinatePhase, true);
assert.equal(data.verdict.coherentQuadraticLiftHasPrimePairEntries, true);
assert.equal(data.verdict.quadraticLiftRequiresPrimePairControl, false);
assert.equal(data.verdict.logarithmicDephasingRemovesOffDiagonals, true);
assert.equal(data.verdict.sameXiIntertwiningIdentityProved, false);
assert.equal(data.verdict.rhProved, false);

const feature = data.featureMap;
assert.match(feature.formula, /sqrt\(Lambda/);
assert.match(feature.diagonal, /p_eta/);
assert.equal(feature.checks.length, 5);
assert.ok(feature.checks.every((row) => Math.abs(row.featureNorm - 1) < 2e-14));
assert.ok(feature.checks.every((row) => row.maximumDiagonalProbabilityError < 1e-15));
assert.ok(feature.checks.every((row) => row.ordinateCancelsFromDiagonal));

const mixture = data.globalMixtureCriterion;
assert.match(mixture.theorem, /RH iff/);
assert.match(mixture.theorem, /bounded/);
assert.match(mixture.proof, /n\^\(2eta\)/);
assert.equal(mixture.toyComponents.length, 3);
assert.ok(Math.abs(mixture.mixtureMass - 1) < 2e-14);
assert.ok(mixture.totalVariationFromCentral > 0);
assert.ok(mixture.relativeEntropyFromCentral > 0);
assert.ok(mixture.ratioRows.at(-1).mixtureToCentralRatio > 10);
assert.ok(mixture.ratioRows.at(-1).mixtureToCentralRatio > mixture.ratioRows[0].mixtureToCentralRatio);
assert.ok(mixture.rhControlMaximumError < 1e-15);

const linear = data.linearPhaseAverageNoGo;
assert.match(linear.statement, /characteristic_mu/);
assert.ok(linear.characteristicMultiplier > 0);
assert.ok(linear.positivePrimePowers > 0);
assert.ok(linear.negativePrimePowers > 0);
assert.ok(linear.sampleRows.every((row) => row.signPreserved));
assert.match(linear.consequence, /cannot/);

const quadratic = data.quadraticLift;
assert.match(quadratic.densityOperator, /psi_rho/);
assert.match(quadratic.diagonalBenefit, /p_eta/);
assert.equal(quadratic.sampleRows.length, 4);
assert.ok(quadratic.sampleRows.some((row) => Math.abs(row.imaginaryPart) > 1e-12));
assert.match(quadratic.gate, /two-prime correlation/);
assert.equal(quadratic.dephasedDiagonalRequiresPrimePairControl, false);
assert.equal(data.bridgeAttempts.length, 6);
assert.ok(data.bridgeAttempts.some((row) => /logarithmic conjugation twirl/.test(row.attempt)));
assert.ok(data.bridgeAttempts.some((row) => /Weil/.test(row.reason)));
assert.match(data.nextNarrowTarget.weakerSufficientForm, /uniform bound/);
assert.match(data.status, /remains unproved/);

for (const marker of [
  'Fortieth-stage investigation',
  'canonical positive prime–zero',
  'Global positive-mixture rigidity',
  'Why linear phase averaging cannot establish the identity',
  'Coherent quadratic lifting creates prime pairs before dephasing',
  'P_\\xi(n)',
  'remains open'
]) {
  assert.ok(report.includes(marker), `prime-zero intertwiner report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const dissipative = await read('docs/rh/rss-prime-power-dissipative-law.md');
assert.ok(dissipative.includes('rss-prime-zero-intertwiner.md'));
const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-prime-zero-intertwiner.md'));
assert.ok(consolidated.includes('The positive intertwiner exists as a feature map, not as a proved frame identity'));

console.log('Prime-zero intertwiner passed: normalized features, RH-equivalent mixture bound, linear no-go and dephased quadratic correction verified.');
