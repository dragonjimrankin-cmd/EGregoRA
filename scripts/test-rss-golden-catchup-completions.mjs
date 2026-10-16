#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-golden-catchup-completion-results.json'));

assert.equal(results.analysisDate, '2026-10-14');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.spliceAtOneIncluded, true);
assert.equal(results.verdict.allThreeIndexingModelsTested, true);
assert.equal(results.verdict.finiteCompletedFamiliesConstructed, true);
assert.equal(results.verdict.functionalEquationPreserved, true);
assert.equal(results.verdict.conjugationPreserved, true);
assert.equal(results.verdict.locallyUniformLimitIsXi, true);
assert.equal(results.verdict.finiteWindowGoldenBoundObservedInAllModels, true);
assert.equal(results.verdict.globalGoldenZeroBoundProved, false);
assert.equal(results.verdict.spliceAtOneResolvesGlobalBound, false);

assert.match(results.correction.previousOmission, /splice at 1/);
assert.equal(results.correction.correctedThresholds, '1,10,100,1000,... = 10^ell for ell>=0');
assert.match(results.correction.unresolvedIndexing, /all three readings are tested/);
assert.equal(results.delayLaw.spliceThreshold, '10^ell');
assert.match(results.delayLaw.remainingGap, /d_ell\+k_ell/);

assert.equal(results.indexingModels.zerothSeed.carrierCountThrough1000, 5);
assert.equal(results.indexingModels.reindexedFibonacci.carrierCountThrough1000, 7);
assert.equal(results.indexingModels.boundaryOnly.carrierCountThrough1000, 4);
assert.equal(results.indexingModels.zerothSeed.preservesPublished10BasedIndexing, true);
assert.equal(results.indexingModels.reindexedFibonacci.preservesPublished10BasedIndexing, false);
assert.match(results.indexingModels.boundaryOnly.analyticConsequence, /does not alter the zeros/);

for (const [model, carrierCount] of Object.entries({
  'zeroth-seed': 5,
  'reindexed-fibonacci': 7,
  'boundary-only': 4
})) {
  assert.equal(results.at1000[model].finiteCarrierCount, carrierCount);
  assert.equal(results.at1000[model].cohorts[0].threshold, 1);
}

assert.equal(results.finiteCompletion.entire, true);
assert.match(results.finiteCompletion.delayedThetaCarrier, /active_cohorts/);
assert.match(results.finiteCompletion.functionalEquation, /Xi_\(N,k\)\(s\)=Xi_\(N,k\)\(1-s\)/);
assert.match(results.finiteCompletion.limit, /every fixed theta coefficient/);

const expectedCarrierCounts = {
  'zeroth-seed': [987, 17711, 2178309, 267914296],
  'reindexed-fibonacci': [1596, 28656, 3524577, 433494436],
  'boundary-only': [986, 17710, 2178308, 267914295]
};

for (const [model, schedules] of Object.entries(results.modelDiagnostics)) {
  for (const [schedule, diagnostics] of Object.entries(schedules)) {
    assert.deepEqual(diagnostics.map((entry) => entry.stage), [14, 20, 30, 40]);
    assert.deepEqual(diagnostics.map((entry) => entry.criticalLineRootCount), [2, 2, 4, 3]);
    assert.deepEqual(diagnostics.map((entry) => entry.finiteCarrierCount), expectedCarrierCounts[model]);
    for (const entry of diagnostics) {
      assert.equal(entry.model, model);
      assert.equal(entry.schedule, schedule);
      assert.equal(entry.cohortDelaySamples[0].threshold, 1);
      assert.equal(entry.argumentPrinciple.zeroCount, entry.criticalLineRootCount);
      assert.equal(entry.offLineZerosDetectedInRectangle, 0);
      assert.equal(entry.finiteWindowGoldenBoundPassed, true);
      assert.ok(entry.argumentPrinciple.maximumBoundaryPhaseStep < 0.08);
      assert.ok(entry.argumentPrinciple.minimumBoundaryMagnitude > 1e-9);
      assert.ok(entry.maximumFunctionalSymmetryError < 1e-14);
      assert.ok(entry.maximumConjugationError < 1e-14);
      assert.equal(entry.escapingQuartetStressTest.violatesCandidateHalfWidth, true);
      assert.equal(entry.escapingQuartetStressTest.eta, 0.25);
    }
  }
}

for (const schedules of Object.values(results.modelDiagnostics)) {
  for (const entry of schedules.chronological) {
    const carrierGaps = entry.cohortDelaySamples
      .filter((sample) => sample.cohortSize > 0)
      .map((sample) => sample.remainingGap);
    assert.ok(carrierGaps.every((gap) => Math.abs(gap - carrierGaps[0]) < 1e-18),
      'chronological schedule should synchronize carrier-bearing cohort gaps');
  }
  for (const entry of schedules['equal-local-ticks']) {
    const carrierGaps = entry.cohortDelaySamples
      .filter((sample) => sample.cohortSize > 0)
      .map((sample) => sample.remainingGap);
    assert.equal(new Set(carrierGaps).size, carrierGaps.length,
      'equal-local-ticks schedule should retain different carrier gaps');
  }
}

const seedRoots = results.modelDiagnostics['zeroth-seed'].chronological[0].criticalLineRoots;
const reindexedRoots = results.modelDiagnostics['reindexed-fibonacci'].chronological[0].criticalLineRoots;
assert.notDeepEqual(seedRoots.map((root) => root.toFixed(6)), reindexedRoots.map((root) => root.toFixed(6)),
  'splice-at-one indexing should alter finite root positions');

assert.match(results.testedSchedules.chronological, /synchronise/);
assert.match(results.testedSchedules.equalLocalTicks, /distinct gaps/);
assert.match(results.stressFamily.centeredFactor, /a=1\/4/);
assert.match(results.stressFamily.consequence, /splice at 1/);
assert.match(results.logicalAssessment.sufficientTheorem, /Rouche\/Hurwitz forces RH/);
assert.ok(results.logicalAssessment.missingConditions.some((item) => /three splice-at-one/.test(item)));
assert.ok(results.logicalAssessment.missingConditions.some((item) => /escaping/.test(item)));

const report = await read('docs/rh/rss-golden-catchup-completions.md');
for (const marker of [
  'The splice at one: three coherent readings',
  'Model A — zeroth seed splice',
  'Model B — reindex every Fibonacci splice',
  'Model C — boundary splice without a carrier',
  'Finite completed theta families',
  'Finite-window zero counts',
  'Why the splice at one cannot establish the global bound',
  'No proof of RH is obtained'
]) {
  assert.ok(report.includes(marker), `splice-at-one golden-delay report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-golden-catchup"'));
assert.ok(publicSplice.includes('splice at \\(1\\)'));
assert.ok(publicSplice.includes('Zeroth seed'));
assert.ok(publicSplice.includes('Boundary only'));
assert.ok(publicSplice.includes('escaping quartet'));

const publicAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(publicAudit.includes('/riemann-splice-questions/#t-rh-golden-catchup'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The splice at one leaves three finite completions'));
assert.ok(consolidated.includes('rss-golden-catchup-completions.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The splice at one creates an indexing choice'));

console.log('Splice-at-one completions passed: all three indexing models, independent clocks, six finite-window paths and escaping-quartet limitation verified.');
