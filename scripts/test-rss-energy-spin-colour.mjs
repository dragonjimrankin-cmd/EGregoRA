#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-energy-spin-colour-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.criticalEnergyAppliedConditionally, true);
assert.equal(results.verdict.criticalEnergyEstimateProved, false);
assert.equal(results.verdict.spinColourClosesCriticalEnergy, false);
assert.equal(results.verdict.internalDegeneracyChangesCoefficientRadius, false);
assert.equal(results.verdict.sixDescendantSeamContractionUniform, false);
assert.equal(results.verdict.physicalSpinColourCouplingDerived, false);

const applications = results.conditionalApplicationMap;
assert.equal(applications.length, 9);
for (const marker of [
  'prime-Laguerre controller p_n',
  'two-ended seam determinant',
  'central horizontal residue',
  'ordinate projection and exact Weil kernel',
  'finite theta completions and splice clocks',
  'physical action, G, charge normalization and halo scale'
]) {
  assert.ok(applications.some((entry) => entry.previousObject === marker), `missing application: ${marker}`);
}
assert.match(applications.find((entry) => entry.previousObject === 'prime-Laguerre controller p_n').energyConsequence, /exp\(o\(n\)\)/);
assert.match(applications.find((entry) => entry.previousObject === 'finite theta completions and splice clocks').status, /not supplied/);

const state = results.spinColourStateSpace;
assert.match(state.spinRepresentation, /C\^2/);
assert.match(state.colourRepresentation, /C\^3/);
assert.match(state.combinedRepresentation, /dimension 6/);
assert.match(state.operatorDecomposition, /1\+3\+8\+24=36/);
assert.match(state.scalarVisibility, /singlet/);
assert.match(state.existingTernaryRelation, /does not derive/);
assert.match(state.existingQuaternaryRelation, /do not derive spin/);

const singlet = results.singletBottleneck;
assert.match(singlet.hilbertSchmidtIdentity, /d\|E\|\^2/);
assert.match(singlet.candidateMatrixTheorem, /I_6/);
assert.match(singlet.consequence, /implies the scalar/);
assert.match(singlet.difficulty, /stronger, not weaker/);

assert.equal(results.coefficientMultiplicity.length, 4);
assert.ok(results.coefficientMultiplicity.every((row) => row.changesRadiusOfConvergence === false));
assert.deepEqual(results.coefficientMultiplicity.map((row) => row.internalDimension), [1, 2, 3, 6]);
assert.match(results.spinPhaseAndSupertrace.supertrace, /indefinite/);

const seam = results.seamMultiplicityAudit;
assert.ok(Math.abs(seam.etaOneQuarter.parentDefect - Math.log(2)) < 1e-14);
assert.ok(seam.etaOneQuarter.fourDescendantTotal < seam.etaOneQuarter.parentDefect);
assert.ok(seam.etaOneQuarter.sixDescendantTotal > seam.etaOneQuarter.parentDefect);
assert.equal(seam.etaOneQuarter.sixDescendantsContract, false);
assert.ok(Math.abs(seam.sixDescendantThreshold - 0.4241411958556915) < 1e-12);
assert.equal(seam.table.length, 8);
for (const count of [1, 2, 3, 4]) {
  assert.equal(seam.table.find((row) => row.descendantCount === count).uniformContractionForAllNonzeroStripDisplacements, true);
}
assert.equal(seam.table.find((row) => row.descendantCount === 6).uniformContractionForAllNonzeroStripDisplacements, false);

assert.match(results.twistedEulerProducts.singletPersistence, /unchanged/);
assert.match(results.twistedEulerProducts.strength, /stronger than RH/);
assert.match(results.proofBoundary.status, /do not prove/);

const report = await read('docs/rh/rss-energy-spin-colour.md');
for (const marker of [
  'Applying critical energy and testing spin–colour channels',
  'Applying critical energy to the previous programme',
  'What critical energy does not supply',
  'What “spin and colour” could mean mathematically',
  'The singlet bottleneck',
  'Internal degeneracy versus spectral descendants',
  'Could colour-weighted primes create a new route?',
  'six-way spectral branching cannot support a uniform contraction proof',
  'RH remains open'
]) {
  assert.ok(report.includes(marker), `spin-colour report is missing: ${marker}`);
}

for (const previous of [
  'docs/rh/rss-arithmetic-seam-control.md',
  'docs/rh/rss-two-ended-seam-ledger.md',
  'docs/rh/rss-ordinate-projection-splice-mobius.md',
  'docs/rh/rss-golden-catchup-completions.md',
  'docs/rh/rss-halving-obstruction-closure.md'
]) {
  const source = await read(previous);
  assert.ok(source.includes('Critical-energy application note'), `${previous} lacks the conditional application`);
}

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-energy-spin-colour"'));
assert.ok(splice.includes('Can spin and colour close the critical-energy theorem?'));
assert.ok(splice.includes('0.424141'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-energy-spin-colour'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Critical energy applied; spin and colour audited'));
assert.ok(consolidated.includes('rss-energy-spin-colour.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('Spin–colour channels leave the singlet bottleneck unchanged'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-energy-spin-colour'));
assert.ok(oracle.includes('Can spin and colour close the critical-energy theorem?'));

console.log('Energy/spin-colour application passed: conditional closures, singlet bottleneck and six-descendant obstruction verified.');
