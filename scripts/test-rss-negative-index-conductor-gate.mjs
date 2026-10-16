#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-negative-index-conductor-gate-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.finiteSyntheticIndexTheoremProved, true);
assert.equal(results.verdict.collapsingAmplitudeAvoided, true);
assert.equal(results.verdict.multiplicityCountedByStandardWeilForm, false);
assert.equal(results.verdict.independentPrimeSideIndexFound, false);
assert.equal(results.verdict.globalConductorFredholmIndexFound, false);
assert.equal(results.verdict.sonineReflectionPositivityFound, false);
assert.equal(results.verdict.routePromoted, false);

const theorem = results.finiteTheorem;
assert.match(theorem.reflection, /-conjugate/);
assert.match(theorem.inertiaFormula, /\(f\+p,p,0\)/);
assert.match(theorem.fullQuartet, /inertia \(2,2,0\)/);
assert.equal(theorem.configurations.length, 5);

const byName = Object.fromEntries(theorem.configurations.map((row) => [row.name, row]));
assert.deepEqual(byName['four simple critical-line nodes'].inertia, { positive: 4, negative: 0, zero: 0 });
assert.deepEqual(byName['one simple off-line quartet'].inertia, { positive: 2, negative: 2, zero: 0 });
assert.deepEqual(byName['two simple off-line quartets'].inertia, { positive: 4, negative: 4, zero: 0 });
assert.deepEqual(byName['one quartet at displacement 10^-6'].inertia, { positive: 2, negative: 2, zero: 0 });
assert.deepEqual(byName['one quartet at ordinate 10^6'].inertia, { positive: 2, negative: 2, zero: 0 });
assert.ok(Number(theorem.nearLineVandermondeRatio) < 1e-19);
assert.match(theorem.collisionAtEtaZero, /index jump occurs exactly at collision/);

assert.equal(results.multiplicityAudit.length, 4);
for (const row of results.multiplicityAudit) {
  assert.deepEqual(row.standardQuartetInertia, { positive: 2, negative: 2, zero: 0 });
  assert.equal(row.confluentJetLiftInertia.negative, 2 * row.multiplicity);
  assert.match(row.warning, /not supplied by the ordinary/);
}

assert.equal(results.arithmeticPromotionGates.length, 4);
assert.ok(results.arithmeticPromotionGates.some((row) => row.outcome === 'fails'));
assert.ok(results.arithmeticPromotionGates.some((row) => /Weil positivity/.test(row.detail)));
assert.equal(results.conductorCommutatorGates.length, 5);
assert.ok(results.conductorCommutatorGates.some((row) => /supertrace/.test(row.detail)));
assert.ok(results.conductorCommutatorGates.some((row) => /Fredholm/.test(row.gate + row.detail)));
assert.equal(results.sonineReflectionGate.promotionDecision, 'closed as another exact detector');
assert.match(results.stopRuleApplied, /route was stopped/);
assert.match(results.status, /RH remains open/);

const report = await read('docs/rh/rss-negative-index-conductor-gate.md');
for (const marker of [
  'The finite reflection form',
  'The quartet census',
  'Pullback through interpolation',
  'Multiplicity does not come for free',
  'Contact with the Weil form',
  'Conductor-commutator gate',
  'Sonine reflection gate',
  'Fail-fast conclusion',
  'RH remains open.',
  'rss-relational-synchronisation-combinations.md'
]) {
  assert.ok(report.includes(marker), `negative-index report missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The integer negative-square detector closes at Weil positivity'));
assert.ok(consolidated.includes('rss-negative-index-conductor-gate.md'));
assert.ok(consolidated.includes('Negative-index/conductor gate'));

console.log('Negative-index gate passed: exact mirror-cycle inertia, near-line stability, multiplicity limitation, Weil-equivalence stop and conductor/Sonine closure verified.');
