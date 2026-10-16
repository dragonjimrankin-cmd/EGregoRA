#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-third-density-splice-events-results.json'));

assert.equal(results.analysisDate, '2026-10-14');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.allThreeInternalSpliceModelsTested, true);
assert.equal(results.verdict.allCompatibleSpliceAtOneModelsRetained, true);
assert.equal(results.verdict.scenarioCount, 7);
assert.equal(results.verdict.clockScheduleCount, 2);
assert.equal(results.verdict.finiteCompletedFamiliesConstructed, true);
assert.equal(results.verdict.functionalEquationPreserved, true);
assert.equal(results.verdict.conjugationPreserved, true);
assert.equal(results.verdict.locallyUniformLimitIsXi, true);
assert.equal(results.verdict.offLineZerosDetectedThroughHeight30, false);
assert.equal(results.verdict.globalGoldenZeroBoundProved, false);
assert.equal(results.verdict.internalSplicesForceGlobalBound, false);
assert.deepEqual(results.internalStations, [333, 666, 999]);

assert.deepEqual(results.models.additionalOneCarrier.carrierCountsThrough1000,
  { zerothSeed: 8, reindexed: 10, boundaryOnly: 7 });
assert.equal(results.models.everyEventFibonacci.carrierCountThrough1000, 33);
assert.deepEqual(results.models.sharedFaces.carrierCountsThrough1000,
  { zerothSeed: 5, reindexed: 7, boundaryOnly: 4 });
assert.match(results.models.sharedFaces.specialObservation, /F_4=3/);
assert.match(results.models.everyEventFibonacci.effect, /seventh splice event/);

const expectedCounts = {
  'extra-one-zeroth-seed': 8,
  'extra-one-reindexed-fibonacci': 10,
  'extra-one-boundary-only': 7,
  'every-event-fibonacci': 33,
  'shared-faces-zeroth-seed': 5,
  'shared-faces-reindexed-fibonacci': 7,
  'shared-faces-boundary-only': 4
};
assert.deepEqual(Object.keys(results.through1000), Object.keys(expectedCounts));
for (const [scenario, count] of Object.entries(expectedCounts)) {
  assert.equal(results.through1000[scenario].finiteCarrierCount, count);
}

for (const [scenario, schedules] of Object.entries(results.modelDiagnostics)) {
  assert.deepEqual(Object.keys(schedules), ['chronological', 'equal-local-ticks']);
  for (const [schedule, diagnostics] of Object.entries(schedules)) {
    assert.deepEqual(diagnostics.map((entry) => entry.stage), [14, 20, 30, 40]);
    assert.deepEqual(diagnostics.map((entry) => entry.criticalLineRootCount), [2, 2, 4, 3]);
    for (const entry of diagnostics) {
      assert.equal(entry.scenario, scenario);
      assert.equal(entry.schedule, schedule);
      assert.equal(entry.argumentPrinciple.zeroCount, entry.criticalLineRootCount);
      assert.equal(entry.offLineZerosDetectedInRectangle, 0);
      assert.ok(entry.internalSpliceDiagnostics.length > 0);
      assert.ok(entry.argumentPrinciple.maximumBoundaryPhaseStep < 0.08);
      assert.ok(entry.argumentPrinciple.minimumBoundaryMagnitude > 1e-9);
      assert.ok(entry.maximumFunctionalSymmetryError < 1e-14);
      assert.ok(entry.maximumConjugationError < 1e-14);
      assert.equal(entry.escapingQuartetStressTest.violatesCandidateGap, true);
      assert.equal(entry.escapingQuartetStressTest.eta, 0.25);
    }
  }
}

const shared = results.modelDiagnostics['shared-faces-reindexed-fibonacci'].chronological[0]
  .internalSpliceDiagnostics;
assert.equal(shared.length, 1);
assert.equal(shared[0].sources.length, 3);
assert.deepEqual(shared[0].sources.map((source) => source.threshold), [333, 666, 999]);

const allEvent = results.modelDiagnostics['every-event-fibonacci'].chronological[0];
assert.equal(allEvent.internalSpliceDiagnostics.length, 3);
const origin = results.modelDiagnostics['extra-one-zeroth-seed'].chronological[0];
assert.notDeepEqual(
  allEvent.criticalLineRoots.map((root) => root.toFixed(6)),
  origin.criticalLineRoots.map((root) => root.toFixed(6)),
  'Fibonacci indexing at every event should move finite roots'
);

assert.equal(results.finiteCompletion.entire, true);
assert.match(results.finiteCompletion.functionalEquation, /Xi\(s\)=Xi\(1-s\)/);
assert.match(results.stressFamily.consequence, /do not imply/);
assert.match(results.logicalAssessment.modelSelection, /does not choose/);
assert.ok(results.logicalAssessment.missingConditions.some((item) => /escaping/.test(item)));

const report = await read('docs/rh/rss-third-density-splice-events.md');
for (const marker of [
  'Why these stations are plausible but not automatic splices',
  'Model A — add one carrier at each internal splice',
  'Model B — apply Fibonacci to every ordered event',
  'Model C — three delayed faces of one 1000 cohort',
  'Finite completed functions',
  'Finite-window zero counts',
  'Why extra internal splices still do not imply contraction',
  'No proof of RH is obtained'
]) {
  assert.ok(report.includes(marker), `internal-splice report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-internal-splices"'));
assert.ok(publicSplice.includes('333, 666 and 999'));
assert.ok(publicSplice.includes('Thirty-three carriers'));
assert.ok(publicSplice.includes('three delayed faces'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-internal-splices'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Internal stations admit three splice models'));
assert.ok(consolidated.includes('rss-third-density-splice-events.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('A thirteenth-stage test promotes 333, 666 and 999 to possible splice events'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-internal-splices'));
assert.ok(oracle.includes('Do 333, 666 and 999 behave as additional splices?'));

console.log('Internal third-density splice events passed: seven population scenarios, fourteen clock paths, bounded-window counts and global obstruction verified.');
