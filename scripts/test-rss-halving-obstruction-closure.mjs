#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-halving-obstruction-closure-results.json'));

assert.equal(results.analysisDate, '2026-10-14');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.pointwiseSameXiInvarianceEstablished, false);
assert.equal(results.verdict.aggregateResidueContractionDerived, true);
assert.equal(results.verdict.aggregateResidueClosureInvarianceEstablished, false);
assert.equal(results.verdict.completeFiniteZeroGenealogyWouldSuffice, true);
assert.equal(results.verdict.completeFiniteZeroGenealogyEstablished, false);
assert.equal(results.verdict.endpointNormalizationExcludesEscapingQuartet, false);
assert.equal(results.verdict.positiveKernelAloneExcludesOffLineZeros, false);
assert.equal(results.verdict.realRootedConvergentKernelRouteWouldSuffice, true);
assert.equal(results.verdict.realRootedConvergentKernelRouteEstablished, false);

assert.match(results.aggregateCentralResidue.definition, /4 eta\^2/);
assert.match(results.aggregateCentralResidue.exactHalvingRatio, /x\+12/);
assert.equal(results.aggregateCentralResidue.contractionChecks.length, 16);
for (const check of results.aggregateCentralResidue.contractionChecks) {
  assert.ok(check.directRatio > 0.25 && check.directRatio < 0.251);
  assert.ok(Math.abs(check.directRatio - check.closedRatio) < 2e-15);
}
assert.match(results.aggregateCentralResidue.conditionalFixedPointTheorem, /hence RH/);
assert.match(results.aggregateCentralResidue.missingBridge, /prime-side/);

const branches = results.branchMultiplicity.assessment;
assert.deepEqual(branches.map((entry) => entry.totalDescendants), [1, 2, 3, 4]);
assert.deepEqual(branches.map((entry) => entry.quadraticHorizontalEnergyRatio), [0.25, 0.5, 0.75, 1]);
assert.deepEqual(branches.map((entry) => entry.strictlyContractsExactResidue), [true, true, true, false]);
assert.ok(branches[3].exactCentralResidueRatio > 1);
assert.match(results.branchMultiplicity.consequence, /cannot also be assumed to multiply zero quartets/);

assert.equal(results.finiteGenealogyRoute.lineageBounds.length, 4);
assert.ok(results.finiteGenealogyRoute.lineageBounds.every((entry) => entry.escapingQuartetViolatesLineageBound));
assert.deepEqual(results.finiteGenealogyRoute.observedWindowCounts, {
  'zeroth-seed': [2, 2, 4, 3],
  'reindexed-fibonacci': [2, 2, 4, 3],
  'boundary-only': [4, 3, 3, 3]
});
assert.match(results.finiteGenealogyRoute.consequence, /Rouche-Hurwitz/);
assert.match(results.finiteGenealogyRoute.currentFailure, /nonmonotone/);

const escaping = results.escapingDetection.weightedResidues;
assert.equal(escaping.length, 4);
assert.ok(escaping.at(-1).centralResidue < escaping[0].centralResidue * 1e-20);
assert.ok(escaping.every((entry) => entry.compactifiedSupremumContribution === 0.25));
assert.match(results.escapingDetection.consequence, /supremum or compactified seam norm/);

for (const check of results.normalizedStressFamily.checks) {
  assert.ok(Math.hypot(check.positiveEndpoint[0] - 1, check.positiveEndpoint[1]) < 1e-15);
  assert.ok(Math.hypot(check.negativeEndpoint[0] - 1, check.negativeEndpoint[1]) < 1e-15);
}
assert.match(results.normalizedStressFamily.consequence, /do not exclude escape/);
assert.match(results.canonicalKernelRoute.limitation, /do not by themselves imply/);
assert.match(results.canonicalKernelRoute.sufficientTarget, /real-rooted/);
assert.equal(results.canonicalKernelRoute.source, 'https://arxiv.org/abs/1502.06844');
assert.match(results.canonicalKernelRoute.dyadicRequirement, /interlacing theorem/);
assert.match(results.logicalAssessment.status, /no proof of RH/);

const report = await read('docs/rh/rss-halving-obstruction-closure.md');
for (const marker of [
  'Replacing pointwise invariance with an aggregate fixed point',
  'The effect of branch multiplicity',
  'The complete-genealogy route',
  'Normalizing the stress factor does not remove it',
  'Why the convergent residue cannot see escape',
  'Restricting to the canonical theta class',
  'Best remaining route',
  'No proof of RH is obtained'
]) {
  assert.ok(report.includes(marker), `halving-obstruction report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-halving-obstruction"'));
assert.ok(publicSplice.includes('Can the halving obstruction be closed?'));
assert.ok(publicSplice.includes('aggregate fixed-point'));
assert.ok(publicSplice.includes('complete zero genealogy'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-halving-obstruction'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Aggregate contraction narrows the halving obstruction'));
assert.ok(consolidated.includes('rss-halving-obstruction-closure.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The seventeenth-stage attempt weakens pointwise zero invariance to an aggregate fixed-point condition'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-halving-obstruction'));
assert.ok(oracle.includes('Can the repeated-halving obstruction be overcome?'));

console.log('Halving obstruction closure passed: aggregate contraction, branch cancellation, genealogy target, normalized escape and kernel route verified.');
