#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-pi-squared-coupling-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.criticalEnergyEstimateProved, false);
assert.equal(results.verdict.piSquaredThetaSelfDual, false);
assert.equal(results.verdict.piSquaredStripMapValidOnFullCriticalStrip, false);
assert.equal(results.verdict.doublePiChannelChangesZetaZeroLocations, false);
assert.equal(results.verdict.finiteDiagnosticsProveAsymptotic, false);

const theta = results.thetaPiSquaredTest;
assert.match(theta.generalPoissonIdentity, /pi\^2\/a/);
assert.match(theta.selfDualFixedPoint, /a=pi/);
assert.match(theta.piSquaredOutcome, /paired with a=1/);
assert.equal(theta.tests.length, 3);
const pi = theta.tests.find((entry) => entry.parameter === 'pi');
const pi2 = theta.tests.find((entry) => entry.parameter === 'piSquared');
assert.ok(Math.max(...pi.rows.map((row) => row.sameParameterSelfDualResidual)) < 3e-14);
assert.ok(Math.max(...pi2.rows.map((row) => row.sameParameterSelfDualResidual)) > 0.1);
assert.ok(pi2.rows.every((row) => Math.abs(row.dualParameter - 1) < 1e-15));
assert.ok(theta.tests.flatMap((entry) => entry.rows).every((row) => row.pairedDualResidual < 3e-14));

assert.match(results.sinePiSquaredTest.piSquaredLattice, /n\/pi/);
assert.match(results.sinePiSquaredTest.consequence, /back to pi/);
const strip = results.stripPiSquaredTest;
assert.ok(Math.abs(strip.firstFailureDisplacement - 1 / (2 * Math.PI)) < 1e-15);
assert.ok(strip.samples.some((row) => row.piSquaredRemainsInRightHalfPlane === false));
assert.match(strip.consequence, /no longer cover the full critical strip/);

const double = results.doubleChannelTest;
assert.match(double.mellinProduct, /zeta\(s\)\^2/);
assert.match(double.zeroEffect, /multiplicity two/);
assert.match(double.coefficientEffect, /radius unchanged/);
assert.match(double.integerPhaseEffect, /collapses/);

const finite = results.finitePrimeEnergyDiagnostics;
assert.equal(finite.rows.length, 11);
assert.deepEqual(Object.keys(finite.rows[0].normalizedDyadicEnergies), [
  'untwisted', 'logPi', 'logPiSquared', 'additivePiSquared'
]);
assert.ok(finite.rows.every((row) => row.scope.startsWith('finite diagnostic')));
assert.match(finite.interpretation, /No finite range certifies/);
assert.match(results.positiveNormTest.result, /preserve/);
assert.equal(results.applicationToPreviousWork.length, 5);
assert.match(results.proofBoundary.status, /no tested pi\*pi coupling/);

const report = await read('docs/rh/rss-pi-squared-coupling.md');
for (const marker of [
  'Testing π×π coupling directly',
  'The general Gaussian duality test',
  'The π² sine-lattice test',
  'The π² seam-map test',
  'Testing two π-normalized channels',
  'Direct finite prime-energy diagnostics',
  'Positive-energy invariance survives π²',
  'coupling proves critical energy or RH.'
]) {
  assert.ok(report.includes(marker), `pi-squared report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

for (const previous of [
  'docs/rh/rss-universal-pi-coupling.md',
  'docs/rh/rss-critical-chebyshev-energy.md',
  'docs/rh/rss-two-ended-seam-ledger.md'
]) {
  const source = await read(previous);
  assert.ok(source.includes('π×π direct-test note'), `${previous} lacks the direct-test application`);
}

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-pi-squared-coupling"'));
assert.ok(splice.includes('Was π×π coupling tested directly?'));
assert.ok(splice.includes('0.1591549430'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-pi-squared-coupling'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Direct π×π tests fail at canonical geometry and principal energy'));
assert.ok(consolidated.includes('rss-pi-squared-coupling.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('Direct π×π tests leave the prime-energy theorem open'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-pi-squared-coupling'));
assert.ok(oracle.includes('Was π×π coupling tested directly?'));

console.log('Pi-times-pi tests passed: Gaussian dual pair, lattice/strip failure, doubled zeros and finite energy diagnostics verified.');
