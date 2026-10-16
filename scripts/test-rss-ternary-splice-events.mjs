#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-ternary-splice-events-results.json'));

assert.equal(results.analysisDate, '2026-10-14');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.allThreeMeaningsOfThreeTested, true);
assert.equal(results.verdict.allSpliceAtOneModelsRetained, true);
assert.equal(results.verdict.scenarioCount, 9);
assert.equal(results.verdict.clockScheduleCount, 2);
assert.equal(results.verdict.finiteCompletedFamiliesConstructed, true);
assert.equal(results.verdict.functionalEquationPreserved, true);
assert.equal(results.verdict.conjugationPreserved, true);
assert.equal(results.verdict.locallyUniformLimitIsXi, true);
assert.equal(results.verdict.offLineZerosDetectedThroughHeight30, false);
assert.equal(results.verdict.globalGoldenZeroBoundProved, false);
assert.equal(results.verdict.ternarySplicingForcesGlobalBound, false);
assert.deepEqual(results.ternaryEvents, [100, 666, 999]);

assert.deepEqual(results.models.threeNew.carrierCountsThrough1000,
  { zerothSeed: 13, reindexed: 14, boundaryOnly: 12 });
assert.deepEqual(results.models.threeTotal.carrierCountsThrough1000,
  { zerothSeed: 10, reindexed: 11, boundaryOnly: 9 });
assert.deepEqual(results.models.threeState.carrierCountsThrough1000,
  { zerothSeed: 5, reindexed: 7, boundaryOnly: 4 });
assert.match(results.models.threeState.fourierDecomposition, /chi/);
assert.match(results.populationConvention, /333 is not assigned/);
assert.equal(results.representationAssessment.identity, '1+omega+omega^2=0');
assert.match(results.representationAssessment.consequence, /derived coupling/);

const expectedCounts = {
  'three-new-zeroth-seed': 13,
  'three-new-reindexed-fibonacci': 14,
  'three-new-boundary-only': 12,
  'three-total-zeroth-seed': 10,
  'three-total-reindexed-fibonacci': 11,
  'three-total-boundary-only': 9,
  'three-state-zeroth-seed': 5,
  'three-state-reindexed-fibonacci': 7,
  'three-state-boundary-only': 4
};
assert.deepEqual(Object.keys(results.through1000), Object.keys(expectedCounts));
for (const [scenario, count] of Object.entries(expectedCounts)) {
  assert.equal(results.through1000[scenario].finiteCarrierCount, count);
}

for (const [scenario, schedules] of Object.entries(results.modelDiagnostics)) {
  for (const [schedule, diagnostics] of Object.entries(schedules)) {
    assert.deepEqual(diagnostics.map((entry) => entry.stage), [14, 20, 30, 40]);
    assert.deepEqual(diagnostics.map((entry) => entry.criticalLineRootCount), [2, 2, 4, 3]);
    for (const entry of diagnostics) {
      assert.equal(entry.scenario, scenario);
      assert.equal(entry.schedule, schedule);
      assert.equal(entry.ternaryEvents.length, 3);
      assert.deepEqual(entry.ternaryEvents.map((event) => event.threshold), [100, 666, 999]);
      assert.equal(entry.argumentPrinciple.zeroCount, entry.criticalLineRootCount);
      assert.equal(entry.offLineZerosDetectedInRectangle, 0);
      assert.ok(entry.argumentPrinciple.maximumBoundaryPhaseStep < 0.08);
      assert.ok(entry.argumentPrinciple.minimumBoundaryMagnitude > 1e-9);
      assert.ok(entry.maximumFunctionalSymmetryError < 1e-14);
      assert.ok(entry.maximumConjugationError < 1e-14);
      assert.equal(entry.escapingQuartetStressTest.violatesCandidateGap, true);
      assert.equal(entry.escapingQuartetStressTest.eta, 0.25);
      if (scenario.startsWith('three-state')) {
        assert.ok(entry.ternaryEvents.every((event) => event.newCarrierCount === 0));
      }
    }
  }
}

const threeNew = results.modelDiagnostics['three-new-zeroth-seed'].chronological[0];
const threeTotal = results.modelDiagnostics['three-total-zeroth-seed'].chronological[0];
assert.equal(threeNew.namedCarrierCohorts.find((cohort) => cohort.threshold === 100).cohortSize, 3);
assert.equal(threeTotal.namedCarrierCohorts.find((cohort) => cohort.threshold === 100).cohortSize, 2);
assert.deepEqual(
  threeNew.criticalLineRoots.map((root) => root.toFixed(8)),
  threeTotal.criticalLineRoots.map((root) => root.toFixed(8)),
  'late ternary carriers should be below displayed low-window sensitivity'
);

assert.equal(results.finiteCompletion.entire, true);
assert.match(results.finiteCompletion.functionalEquation, /Xi\(s\)=Xi\(1-s\)/);
assert.match(results.stressFamily.consequence, /escaping upward/);
assert.ok(results.logicalAssessment.missingConditions.some((item) => /Z_3/.test(item)));
assert.ok(results.logicalAssessment.missingConditions.some((item) => /escaping/.test(item)));

const report = await read('docs/rh/rss-ternary-splice-events.md');
for (const marker of [
  'The isolated ternary hypothesis',
  'Interpretation A — three new carriers',
  'Interpretation B — three total branches',
  'Interpretation C — three states of one carrier',
  'Finite completed functions',
  'Finite-window zero counts',
  'Why ternary symmetry does not force RH',
  'No proof of RH is obtained'
]) {
  assert.ok(report.includes(marker), `ternary-splice report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-ternary-splices"'));
assert.ok(publicSplice.includes('100, 666 and 999'));
assert.ok(publicSplice.includes('Three total branches'));
assert.ok(publicSplice.includes('\\mathbb Z_3'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-ternary-splices'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Ternary splicing changes multiplicity, not the global obstruction'));
assert.ok(consolidated.includes('rss-ternary-splice-events.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The fourteenth-stage comparison asks what it means for 100, 666 and 999 to splice into three'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-ternary-splices'));
assert.ok(oracle.includes('What does it mean if 100, 666 and 999 each splice into three?'));

console.log('Ternary splice events passed: three meanings of three, nine populations, eighteen clock paths and global obstruction verified.');
