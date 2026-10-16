#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-splice-at-one-halving-results.json'));

assert.equal(results.analysisDate, '2026-10-14');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.allThreeMeaningsTested, true);
assert.equal(results.verdict.sameXiAndFiniteStageScopesCompared, true);
assert.equal(results.verdict.sameXiHorizontalContractionWouldProveRh, true);
assert.equal(results.verdict.sameXiHorizontalContractionDerivedByTti, false);
assert.equal(results.verdict.literalWeightHalvingRetainsXiLimit, false);
assert.equal(results.verdict.remainingIntervalHalvingRetainsXiLimit, true);
assert.equal(results.verdict.finiteInheritedHalvingExcludesNewEscapingZeros, false);
assert.equal(results.verdict.offLineZerosDetectedThroughHeight30InDeficitModel, false);

assert.match(results.sameXiZeroContraction.map, /beta-1\/2/);
assert.match(results.sameXiZeroContraction.iteration, /2\^\(-n\)/);
assert.match(results.sameXiZeroContraction.identityTheoremArgument, /finite point/);
assert.match(results.sameXiZeroContraction.status, /equivalent to RH/);
assert.equal(results.sameXiZeroContraction.sampleIterations[0].horizontalDisplacement, 0.25);
assert.ok(results.sameXiZeroContraction.sampleIterations.at(-1).horizontalDisplacement < 1e-4);

assert.match(results.finiteStageZeroContraction.conditionalTheorem, /Rouche-Hurwitz/);
assert.match(results.finiteStageZeroContraction.trackedOnlyLimitation, /newly created zeros/);
for (const stress of results.finiteStageZeroContraction.escapingQuartet) {
  assert.equal(stress.horizontalDisplacement, 0.25);
  assert.equal(stress.violatesInheritedHalvingBound, true);
  assert.ok(stress.maximumCompactFactorError < 1e-4);
}

assert.match(results.downstreamWeightHalving.literalAdmittedWeights, /does not tend to xi/);
assert.match(results.downstreamWeightHalving.integerPopulation, /odd Fibonacci cohorts/);
assert.match(results.downstreamWeightHalving.remainingDeficits, /preserves the xi limit/);
assert.match(results.remainingIntervalHalving.equivalence, /exactly remaining-deficit halving/);
assert.match(results.remainingIntervalHalving.zeroConsequence, /no horizontal zero contraction/);

const expectedCounts = {
  'zeroth-seed': [2, 2, 4, 3],
  'reindexed-fibonacci': [2, 2, 4, 3],
  'boundary-only': [4, 3, 3, 3]
};
for (const [origin, schedules] of Object.entries(results.finiteDeficitHalvingDiagnostics)) {
  for (const [schedule, diagnostics] of Object.entries(schedules)) {
    assert.deepEqual(diagnostics.map((entry) => entry.stage), [14, 20, 30, 40]);
    assert.deepEqual(diagnostics.map((entry) => entry.criticalLineRootCount), expectedCounts[origin]);
    for (const entry of diagnostics) {
      assert.equal(entry.originModel, origin);
      assert.equal(entry.schedule, schedule);
      assert.equal(entry.repeatedSpliceCount, entry.stage);
      assert.equal(entry.downstreamRemainingFactor, 2 ** (-entry.stage));
      assert.equal(entry.argumentPrinciple.zeroCount, entry.criticalLineRootCount);
      assert.equal(entry.offLineZerosDetectedInRectangle, 0);
      assert.ok(entry.argumentPrinciple.maximumBoundaryPhaseStep < 0.08);
      assert.ok(entry.argumentPrinciple.minimumBoundaryMagnitude > 1e-9);
      assert.ok(entry.maximumFunctionalSymmetryError < 1e-14);
      assert.ok(entry.maximumConjugationError < 1e-14);
      for (const cohort of entry.cohortsThrough1000.filter((item) => item.threshold > 1)) {
        assert.equal(cohort.spliceAtOneHalvingFactor, 2 ** (-entry.stage));
        assert.ok(cohort.remainingGap < cohort.baseRemainingGap);
      }
    }
  }
}

const boundaryRoots = results.finiteDeficitHalvingDiagnostics['boundary-only'].chronological.at(-1).criticalLineRoots;
assert.deepEqual(boundaryRoots.map((rootValue) => rootValue.toFixed(8)),
  ['14.13472514', '21.02203964', '25.01085760']);
assert.equal(results.finiteCompletion.entire, true);
assert.match(results.finiteCompletion.functionalEquation, /Xi_N\(s\)=Xi_N\(1-s\)/);
assert.match(results.logicalAssessment.strongConditionalResult, /prove RH/);
assert.ok(results.logicalAssessment.missingConditions.some((item) => /every xi zero/.test(item)));
assert.ok(results.logicalAssessment.missingConditions.some((item) => /escaping quartets/.test(item)));

const report = await read('docs/rh/rss-splice-at-one-halving.md');
for (const marker of [
  'Two scopes that must not be conflated',
  'Horizontal zero halving',
  'Same-xi halving lemma',
  'Why a half-turn is not yet a half-distance',
  'Literal downstream weight or population halving',
  'Remaining-interval or deficit halving',
  'Finite deficit-halving completions',
  'A finite-stage theorem that would be sufficient',
  'The escaping-zero loophole',
  'No proof of RH is obtained'
]) {
  assert.ok(report.includes(marker), `splice-at-one halving report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-splice-one-halving"'));
assert.ok(publicSplice.includes('What if every splice at 1 halves everything else?'));
assert.ok(publicSplice.includes('Same-xi halving'));
assert.ok(publicSplice.includes('remaining deficit'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-splice-one-halving'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Same-xi halving is RH-equivalent, not yet derived'));
assert.ok(consolidated.includes('rss-splice-at-one-halving.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The sixteenth-stage investigation tests the stronger proposal that every return through the splice at 1 halves everything downstream'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-splice-one-halving'));
assert.ok(oracle.includes('Would RH follow if every splice at 1 halves everything else?'));

console.log('Splice-at-one halving passed: same-xi equivalence, finite-stage limitation, weight/deficit distinction and escaping obstruction verified.');
