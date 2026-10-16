#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-universal-pi-coupling-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.criticalEnergyEstimateProved, false);
assert.equal(results.verdict.universalPiCouplingAlreadyPresentInThetaCompletion, true);
assert.equal(results.verdict.sharedPiFactorIsQuantumEntanglement, false);
assert.equal(results.verdict.unitaryPiPhasesChangePositiveEnergy, false);
assert.equal(results.verdict.piCouplingMovesZerosOntoCriticalLine, false);
assert.equal(results.verdict.physicalMechanismDerived, false);

assert.match(results.literalScopeDistinction.allRealNumbers, /rescaling/);
assert.match(results.literalScopeDistinction.allIntegers, /sine product or theta lattice/);
assert.match(results.literalScopeDistinction.quantumUseOfEntangled, /nonseparable/);

const sine = results.sineLattice;
assert.match(sine.identity, /sin\(pi z\)/);
assert.match(sine.meaning, /every integer above one/);
assert.equal(sine.checks.length, 4);
for (const check of sine.checks) {
  assert.equal(check.errors.length, 3);
  assert.ok(check.errors.at(-1).absoluteError < check.errors[0].absoluteError);
}
assert.match(sine.rhEffect, /does not move zeta zeros/);

const theta = results.thetaPoissonCoupling;
assert.match(theta.identity, /x\^\(-1\/2\)theta\(1\/x\)/);
assert.match(theta.alreadyUsed, /already contain/);
assert.equal(theta.checks.length, 6);
assert.ok(theta.checks.every((check) => check.absoluteDifference < 2e-14));
assert.match(theta.whatItDoesNotGive, /critical prime-error energy/);

assert.equal(results.phaseModels.length, 5);
assert.match(results.phaseModels.find((model) => /parity/.test(model.model)).effect, /retains every nontrivial zeta zero/);
assert.match(results.phaseModels.find((model) => /logarithmic/.test(model.model)).effect, /vertical shift/);
assert.match(results.phaseModels.find((model) => /root-of-unity/.test(model.model)).effect, /not multiplicative/);
assert.equal(results.positiveEnergyInvariance.checks.length, 4);
for (const check of results.positiveEnergyInvariance.checks) {
  assert.ok(Math.abs(check.energyAfter - check.energyBefore) < 1e-14);
}

assert.match(results.archimedeanPrimeSplit.factorization, /pi\^\(-s\/2\)/);
assert.match(results.archimedeanPrimeSplit.piSector, /zero-free/);
assert.match(results.archimedeanPrimeSplit.primeSector, /critical Chebyshev-energy obstruction/);
assert.match(results.genuineTensorEntanglement.separableState, /separable/);
assert.match(results.genuineTensorEntanglement.possibleEntangledState, /pi;n/);
assert.match(results.spinColourPiCenters.spin, /2pi rotation/);
assert.match(results.spinColourPiCenters.colour, /SU\(3\) centre/);
assert.match(results.seamRole.identity, /cos\(pi eta\)/);
assert.equal(results.applicationToPreviousWork.length, 6);
assert.match(results.proofBoundary.status, /remain open/);

const report = await read('docs/rh/rss-universal-pi-coupling.md');
for (const marker of [
  'What if every number above one is entangled with π?',
  'The exact sine lattice for every integer above one',
  'The theta coupling is already in the Riemann programme',
  'Five possible π-phase assignments',
  'Why π-phases do not lower positive energy',
  'Genuine tensor entanglement with a π-register',
  'π, spin and colour centres',
  'π is already in the seam marker',
  'RH and the physical interpretation remain open'
]) {
  assert.ok(report.includes(marker), `pi-coupling report is missing: ${marker}`);
}

for (const previous of [
  'docs/rh/rss-critical-chebyshev-energy.md',
  'docs/rh/rss-energy-spin-colour.md',
  'docs/rh/rss-golden-catchup-completions.md',
  'docs/rh/rss-two-ended-seam-ledger.md'
]) {
  const source = await read(previous);
  assert.ok(source.includes('Universal-π application note'), `${previous} lacks the pi application`);
}

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-universal-pi-coupling"'));
assert.ok(splice.includes('What if every number above one is entangled with π?'));
assert.ok(splice.includes('sin(\\pi z)'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-universal-pi-coupling'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Universal π-coupling is exact but does not close prime energy'));
assert.ok(consolidated.includes('rss-universal-pi-coupling.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('Universal π-coupling supplies completion, not prime cancellation'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-universal-pi-coupling'));
assert.ok(oracle.includes('What if every number above one is entangled with π?'));

console.log('Universal pi coupling passed: sine lattice, theta duality, phase invariance and separability boundary verified.');
