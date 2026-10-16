#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-dual-prime-error-routes-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.squareRootPrimeErrorProved, false);
assert.equal(results.verdict.uniformLaguerreCancellationProved, false);
assert.equal(results.verdict.routesShownEquivalentAtAnalyticBoundary, true);
assert.equal(results.verdict.newUnconditionalExponentObtained, false);

const routeA = results.routeA_squareRootPrimeError;
assert.match(routeA.target, /x\^\(1\/2\)/);
assert.match(routeA.explicitFormula, /x\^rho\/rho/);
assert.equal(routeA.attemptedInputs.length, 4);
assert.ok(routeA.attemptedInputs.every((entry) => /not|no |only|does not/.test(entry.outcome)));
assert.match(routeA.blockingEquivalence, /proof of RH/);
assert.match(routeA.status, /no square-root-scale estimate/);

const routeB = results.routeB_uniformLaguerreCancellation;
assert.match(routeB.tVariableIdentity, /exp\(-2t\/3\)/);
assert.equal(routeB.kernelSamples.length, 5);
assert.equal(routeB.attemptedInputs.length, 4);
assert.match(routeB.geometricIdentity, /exactly to Re\(s\)>1\/2/);
assert.match(routeB.blockingEquivalence, /this is RH/);
assert.match(routeB.status, /no uniform signed-kernel estimate/);

const boundary = results.quantitativeBoundary;
assert.equal(boundary.table.length, 8);
assert.equal(boundary.table[0].primeErrorExponentTheta, 0.5);
assert.equal(boundary.table[0].coefficientExponentialBase, 1);
assert.equal(boundary.table[0].subexponential, true);
assert.ok(boundary.table.slice(1).every((entry) => entry.coefficientExponentialBase > 1));
assert.ok(boundary.table.slice(1).every((entry) => entry.subexponential === false));
for (const entry of boundary.table) {
  assert.ok(Math.abs(entry.guaranteedDiskRadius * entry.coefficientExponentialBase - 1) < 1e-15);
}
assert.match(boundary.interpretation, /remains exponential/);

assert.match(results.whyAveragingDoesNotClosePointwiseControl.statement, /one exceptional zero/);
assert.match(results.whyAveragingDoesNotClosePointwiseControl.consequence, /cannot replace/);
assert.match(results.strongestConditionalClosure.primeErrorPremise, /1\/2\+epsilon/);
assert.match(results.strongestConditionalClosure.laguerrePremise, /exp\(epsilon n\)/);
assert.match(results.strongestConditionalClosure.status, /equivalent in strength/);
assert.ok(results.proofBoundary.newExactInformation.some((item) => /same analytic-continuation problem/.test(item)));
assert.match(results.proofBoundary.missingTheorem, /genuinely new arithmetic inequality/);
assert.match(results.proofBoundary.status, /RH remains open/);

const report = await read('docs/rh/rss-dual-prime-error-routes.md');
for (const marker of [
  'Attempting both remaining prime-error routes',
  'Attempt A — square-root prime error',
  'Explicit-formula obstruction',
  'Attempt B — uniform signed-Laguerre cancellation',
  'Laguerre orthogonality',
  'The exact quantitative boundary',
  'Why the two attempts coincide',
  'Proof boundary',
  'RH remains open'
]) {
  assert.ok(report.includes(marker), `dual prime-error report is missing: ${marker}`);
}

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-dual-prime-error-routes"'));
assert.ok(splice.includes('Did either remaining prime-error route close the proof?'));
assert.ok(splice.includes('B_\\theta'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-dual-prime-error-routes'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Both prime-error routes meet the same critical boundary'));
assert.ok(consolidated.includes('rss-dual-prime-error-routes.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('twenty-three finds the shared boundary'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-dual-prime-error-routes'));
assert.ok(oracle.includes('Did either square-root prime error or uniform Laguerre cancellation succeed?'));

console.log('Dual prime-error routes passed: shared critical boundary, exponent-to-base map and unresolved RH-strength inputs verified.');
