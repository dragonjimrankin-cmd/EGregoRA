#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-quaternary-splice-at-1000-results.json'));

assert.equal(results.analysisDate, '2026-10-14');
assert.equal(results.quaternaryEvent, 1000);
assert.deepEqual(results.scopes, ['baseline-only', 'combined']);
assert.deepEqual(results.ternaryEventsInCombinedScope, [100, 666, 999]);
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.allThreeMeaningsOfFourTested, true);
assert.equal(results.verdict.baselineAndTernaryScopesCompared, true);
assert.equal(results.verdict.allSpliceAtOneModelsRetained, true);
assert.equal(results.verdict.populationScenarioCount, 36);
assert.equal(results.verdict.clockScheduleCount, 2);
assert.equal(results.verdict.diagnosticPathCount, 72);
assert.equal(results.verdict.finiteCompletedFamiliesConstructed, true);
assert.equal(results.verdict.functionalEquationPreserved, true);
assert.equal(results.verdict.conjugationPreserved, true);
assert.equal(results.verdict.locallyUniformLimitIsXi, true);
assert.equal(results.verdict.offLineZerosDetectedThroughHeight30, false);
assert.equal(results.verdict.globalGoldenZeroBoundProved, false);
assert.equal(results.verdict.quaternarySplicingForcesGlobalBound, false);

assert.deepEqual(results.models.fourNew.baselineCarrierCountsThrough1000,
  { zerothSeed: 7, reindexed: 8, boundaryOnly: 6 });
assert.deepEqual(results.models.fourTotal.baselineCarrierCountsThrough1000,
  { zerothSeed: 6, reindexed: 7, boundaryOnly: 5 });
assert.deepEqual(results.models.fourState.baselineCarrierCountsThrough1000,
  { zerothSeed: 5, reindexed: 7, boundaryOnly: 4 });
assert.match(results.models.fourTotal.reindexedCoincidence, /F_4=3/);
assert.equal(results.representationAssessment.cyclicCandidate, 'Z_4');
assert.equal(results.representationAssessment.identity, '1+i-1-i=0');
assert.match(results.representationAssessment.nonUniqueness, /Klein four group/);
assert.match(results.representationAssessment.consequence, /state-dependent coupling/);
assert.match(results.logicalAssessment.structuralFit, /F_4=3/);

const origins = ['zeroth-seed', 'reindexed-fibonacci', 'boundary-only'];
const expectedBaseline = {
  'four-new': [7, 8, 6],
  'four-total': [6, 7, 5],
  'four-state': [5, 7, 4]
};
for (const [model, counts] of Object.entries(expectedBaseline)) {
  origins.forEach((origin, index) => {
    const id = `baseline-q-${model}-${origin}`;
    assert.equal(results.through1000[id].finiteCarrierCount, counts[index]);
  });
}

const expectedCombined = new Map([
  ['three-new|four-new', [15, 15, 14]],
  ['three-new|four-total', [14, 14, 13]],
  ['three-new|four-state', [13, 14, 12]],
  ['three-total|four-new', [12, 12, 11]],
  ['three-total|four-total', [11, 11, 10]],
  ['three-total|four-state', [10, 11, 9]],
  ['three-state|four-new', [7, 8, 6]],
  ['three-state|four-total', [6, 7, 5]],
  ['three-state|four-state', [5, 7, 4]]
]);
for (const [meanings, counts] of expectedCombined) {
  const [ternary, quaternary] = meanings.split('|');
  origins.forEach((origin, index) => {
    const id = `combined-t-${ternary}-q-${quaternary}-${origin}`;
    assert.equal(results.through1000[id].finiteCarrierCount, counts[index]);
  });
}

assert.equal(Object.keys(results.modelDiagnostics).length, 36);
for (const [scenario, schedules] of Object.entries(results.modelDiagnostics)) {
  assert.deepEqual(Object.keys(schedules), ['chronological', 'equal-local-ticks']);
  for (const [schedule, diagnostics] of Object.entries(schedules)) {
    assert.deepEqual(diagnostics.map((entry) => entry.stage), [14, 20, 30, 40]);
    assert.deepEqual(diagnostics.map((entry) => entry.criticalLineRootCount), [2, 2, 4, 3]);
    for (const entry of diagnostics) {
      assert.equal(entry.scenario, scenario);
      assert.equal(entry.schedule, schedule);
      assert.equal(entry.quaternaryEvent.threshold, 1000);
      assert.equal(entry.quaternaryEvent.branchCount, 4);
      assert.equal(entry.argumentPrinciple.zeroCount, entry.criticalLineRootCount);
      assert.equal(entry.offLineZerosDetectedInRectangle, 0);
      assert.ok(entry.argumentPrinciple.maximumBoundaryPhaseStep < 0.08);
      assert.ok(entry.argumentPrinciple.minimumBoundaryMagnitude > 1e-9);
      assert.ok(entry.maximumFunctionalSymmetryError < 1e-14);
      assert.ok(entry.maximumConjugationError < 1e-14);
      assert.equal(entry.escapingQuartetStressTest.violatesCandidateGap, true);
      assert.equal(entry.escapingQuartetStressTest.eta, 0.25);
      if (entry.quaternaryMeaning === 'four-new') {
        assert.equal(entry.quaternaryCarrierCohort.cohortSize, 4);
      } else if (entry.quaternaryMeaning === 'four-total') {
        assert.equal(entry.quaternaryCarrierCohort.cohortSize, 3);
      }
      if (entry.scope === 'baseline-only') {
        assert.equal(entry.ternaryMeaning, null);
        assert.deepEqual(entry.ternaryEvents, []);
      } else {
        assert.equal(entry.ternaryEvents.length, 3);
      }
    }
  }
}

const reindexedFourTotal = results.modelDiagnostics['baseline-q-four-total-reindexed-fibonacci'].chronological[0];
const reindexedFourState = results.modelDiagnostics['baseline-q-four-state-reindexed-fibonacci'].chronological[0];
assert.equal(reindexedFourTotal.quaternaryCarrierCohort.cohortSize, 3);
assert.equal(reindexedFourState.quaternaryCarrierCohort.cohortSize, 3);
assert.deepEqual(reindexedFourTotal.criticalLineRoots, reindexedFourState.criticalLineRoots,
  'F_4=3 should make the reindexed four-total and uncoupled four-state scalar completions coincide');

const baselineRoots = origins.map((origin) =>
  results.modelDiagnostics[`baseline-q-four-new-${origin}`].chronological[0].criticalLineRoots
    .map((rootValue) => rootValue.toFixed(8)));
assert.deepEqual(baselineRoots, [
  ['14.76039167', '16.80619230'],
  ['14.45533746', '17.69711280'],
  ['14.76039167', '16.80619230']
]);

assert.equal(results.finiteCompletion.entire, true);
assert.match(results.finiteCompletion.functionalEquation, /Xi\(s\)=Xi\(1-s\)/);
assert.match(results.stressFamily.consequence, /escaping upward/);
assert.ok(results.logicalAssessment.missingConditions.some((item) => /Klein four/.test(item)));
assert.ok(results.logicalAssessment.missingConditions.some((item) => /escaping quartets/.test(item)));

const report = await read('docs/rh/rss-quaternary-splice-at-1000.md');
for (const marker of [
  'Two scopes',
  'Interpretation A — four new carriers',
  'Interpretation B — four total branches',
  'Interpretation C — four internal states',
  'Independent depth and clock at 1000',
  'Finite completed functions',
  'Finite-window zero comparison',
  'The escaping-quartet test',
  'F_4=3=4-1',
  'does not prove RH'
]) {
  assert.ok(report.includes(marker), `quaternary-splice report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-quaternary-splice"'));
assert.ok(publicSplice.includes('What if 1000 splices into four?'));
assert.ok(publicSplice.includes('Four total branches'));
assert.ok(publicSplice.includes('\\mathbb Z_4'));
assert.ok(publicSplice.includes('F_4=3'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-quaternary-splice'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('A four-way fork fits the reindexed 1000 cohort'));
assert.ok(consolidated.includes('rss-quaternary-splice-at-1000.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The fifteenth-stage test asks whether 1000 splices into four'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-quaternary-splice'));
assert.ok(oracle.includes('What if the event at 1000 splices into four?'));

console.log('Quaternary splice at 1000 passed: three meanings, two scopes, 36 populations, 72 clock paths and global obstruction verified.');
