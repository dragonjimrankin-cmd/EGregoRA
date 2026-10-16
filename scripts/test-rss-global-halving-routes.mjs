#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-global-halving-routes-results.json'));

assert.equal(results.analysisDate, '2026-10-14');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.primeLedgerRouteClosed, false);
assert.equal(results.verdict.completeGenealogyRouteClosed, false);
assert.equal(results.verdict.realRootedKernelRouteClosed, false);
assert.equal(results.verdict.compactifiedSeamRouteClosed, false);
assert.equal(results.verdict.localGenealogyEstablished, true);
assert.equal(results.verdict.escapingBirthsAtInfinityExcluded, false);

assert.match(results.primeLedgerRoute.parityIdentity, /1-2\^\(-s\)/);
assert.ok(Math.abs(results.primeLedgerRoute.p2LogCurvatureAtCenter + 3.9602015607712566) < 1e-14);
assert.notEqual(results.primeLedgerRoute.p2LogCurvatureAtCenter, 0);
const accounting = results.primeLedgerRoute.residueAccounting;
assert.ok(accounting.residueExport > 0);
assert.ok(Math.abs(accounting.residueBefore - accounting.residueAfter - accounting.residueExport) < 1e-20);
assert.match(results.primeLedgerRoute.reservoirProblem, /reservoir/);
assert.match(results.primeLedgerRoute.quaternaryProblem, /conserve/);
assert.match(results.primeLedgerRoute.status, /no prime-side identity/);

assert.match(results.genealogyRoute.localTheorem, /cannot be born spontaneously/);
assert.match(results.genealogyRoute.globalFailure, /from infinity/);
assert.match(results.genealogyRoute.orderFailure, /insufficient/);
assert.deepEqual(results.genealogyRoute.localGenealogyExample.counts, {
  'zeroth-seed': [2, 2, 4, 3],
  'reindexed-fibonacci': [2, 2, 4, 3],
  'boundary-only': [4, 3, 3, 3]
});
assert.match(results.genealogyRoute.status, /global no-birth is not established/);

const blend = results.kernelRoute.positiveBlendCounterexample;
assert.deepEqual(blend.halfSumAsPolynomialInY, [1, -16.5, 101]);
assert.equal(blend.discriminant, -131.75);
assert.match(blend.consequence, /nonreal zeros/);
assert.deepEqual(results.kernelRoute.halvingDilation.checks.map((entry) => entry.rootAfterFof2z),
  [0.5, 0.25, 0.125, 0.0625]);
assert.match(results.kernelRoute.halvingDilation.consequence, /cannot converge/);
assert.equal(results.kernelRoute.source, 'https://arxiv.org/abs/1502.06844');
assert.match(results.kernelRoute.status, /do not establish Laguerre-Polya/);

assert.equal(results.compactifiedSeamRoute.samples[3].compactCoordinate, 0);
assert.ok(results.compactifiedSeamRoute.samples[0].compactCoordinate < -0.999999999999);
assert.ok(results.compactifiedSeamRoute.samples.at(-1).compactCoordinate > 0.999999999999);
for (const entry of results.compactifiedSeamRoute.seamSupremum) {
  assert.equal(entry.horizontalSupremumContribution, 0.25);
  assert.ok(entry.horizontalSupremumContribution > entry.inheritedHalvingBound);
}
assert.match(results.compactifiedSeamRoute.analyticFailure, /essential singularity/);
assert.match(results.compactifiedSeamRoute.status, /not controlled/);

assert.ok(results.combinedAssessment.blockingFacts.some((item) => /p=2/.test(item)));
assert.ok(results.combinedAssessment.blockingFacts.some((item) => /real-rooted/.test(item)));
assert.ok(results.combinedAssessment.blockingFacts.some((item) => /essential singularity/.test(item)));
assert.equal(results.combinedAssessment.narrowestNextTargets.length, 3);
assert.match(results.combinedAssessment.status, /no proof of RH/);

const report = await read('docs/rh/rss-global-halving-routes.md');
for (const marker of [
  'Route A — derive aggregate invariance from the prime ledger',
  'The natural parity operation is not invariant',
  'Route B — prove complete zero genealogy',
  'What analytic continuation gives automatically',
  'Route C — preserve real-rootedness under kernel refinement',
  'Positivity is not enough',
  'Route D — use a compactified seam supremum',
  'Why analytic regularity fails',
  'Combined assessment',
  'No proof of RH is obtained'
]) {
  assert.ok(report.includes(marker), `global-halving-routes report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-global-halving-routes"'));
assert.ok(publicSplice.includes('What happened when all four routes were tried?'));
assert.ok(publicSplice.includes('nonzero dyadic correction'));
assert.ok(publicSplice.includes('positive blend'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-global-halving-routes'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('All four global-halving routes retain a missing theorem'));
assert.ok(consolidated.includes('rss-global-halving-routes.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('Stages eighteen to twenty'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-global-halving-routes'));
assert.ok(oracle.includes('What happened when every proposed route around the halving obstruction was tried?'));

console.log('Global halving routes passed: prime correction, local genealogy, blend counterexample and seam singularity verified.');
