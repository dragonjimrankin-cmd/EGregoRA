#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-prime-laguerre-growth-proof-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.subexponentialGrowthProved, false);
assert.equal(results.verdict.continuousMainTermCancelledExactly, true);
assert.equal(results.verdict.remainderReducedToChebyshevPrimeError, true);
assert.equal(results.verdict.positivityRouteAvailable, false);
assert.equal(results.verdict.finiteVerificationSufficient, false);
assert.equal(results.verdict.knownPntScaleSufficient, false);

const cancellation = results.exactMainTermCancellation;
assert.match(cancellation.laguerreIntegral, /1-\(-2\)\^n/);
assert.match(cancellation.endpointTerm, /1-\(-2\)\^n/);
assert.equal(cancellation.checks.length, 20);
assert.ok(cancellation.checks.every((entry) => entry.exactMatch));
for (const entry of cancellation.checks) {
  assert.equal(entry.laplaceIntegral, entry.endpointTerm);
}

const identity = results.primeErrorIdentity;
assert.match(identity.definitions, /E_tilde\(x\)=psi\(x\)-\(x-1\)/);
assert.match(identity.stieltjesForm, /dE_tilde/);
assert.match(identity.integratedForm, /L_\(n-2\)\^2/);
assert.match(identity.boundaryCondition, /E_tilde\(1\)=0/);
assert.match(identity.meaning, /psi\(x\)-x/);

const finite = results.finiteCancellationDiagnostics;
assert.equal(finite.table.length, 10);
const tenth = finite.table.at(-1);
assert.equal(tenth.endpointMainTerm, -1023);
assert.ok(Math.abs(tenth.completedPrimeRemainder - 0.6848230490069394) < 1e-8);
assert.ok(tenth.relativeRemainder < 0.001);
assert.match(finite.status, /finite table cannot bound/);

const failed = results.failedProofRoutes;
assert.equal(failed.termwiseAbsoluteValues.status, 'fails');
assert.match(failed.termwiseAbsoluteValues.reason, /destroy the cancellation/);
assert.equal(failed.kernelPositivity.status, 'fails');
assert.equal(failed.kernelPositivity.samplePositiveRoots['5'].length, 4);
assert.equal(failed.kernelPositivity.samplePositiveRoots['10'].length, 9);
assert.equal(failed.kernelPositivity.samplePositiveRoots['20'].length, 19);
assert.equal(failed.ordinaryPntError.status, 'insufficient');
assert.equal(failed.finiteZeroVerification.status, 'insufficient');
assert.ok(failed.finiteZeroVerification.coarseStripAndFirstHeightEnvelope.growthBase > 1);

const target = results.equivalentPrimeErrorTarget;
assert.match(target.sufficientBound, /x\^\(1\/2\)/);
assert.match(target.status, /equivalent to RH/);
assert.match(target.consequenceForSequence, /subexponential/);
assert.match(target.whyCurrentInputStops, /no square-root prime-error estimate/);

const boundary = results.proofBoundary;
assert.equal(boundary.notProved, 'p_n=exp(o(n))');
assert.ok(boundary.provedHere.some((item) => /continuous prime-density/.test(item)));
assert.ok(boundary.provedHere.some((item) => /psi\(x\)-x/.test(item)));
assert.match(boundary.status, /neither is available/);

const report = await read('docs/rh/rss-prime-laguerre-growth-proof.md');
for (const marker of [
  'Attempting the subexponential prime–Laguerre proof',
  'The exponential endpoint term cancels exactly',
  'Exact reduction to the Chebyshev error',
  'Why termwise bounds fail',
  'The kernel has no positivity structure',
  'The prime number theorem does not reach the required scale',
  'Finite verification cannot remove the exponential rate',
  'Proof boundary',
  'the requested proof—and RH—remains open'
]) {
  assert.ok(report.includes(marker), `prime-Laguerre proof report is missing: ${marker}`);
}

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-prime-laguerre-growth-proof"'));
assert.ok(splice.includes('Was the subexponential prime–Laguerre bound proved?'));
assert.ok(splice.includes('psi(x)-(x-1)'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-prime-laguerre-growth-proof'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The subexponential proof reduces to square-root prime error'));
assert.ok(consolidated.includes('rss-prime-laguerre-growth-proof.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('twenty-two cancels continuous density'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-prime-laguerre-growth-proof'));
assert.ok(oracle.includes('Was the subexponential prime–Laguerre estimate proved?'));

console.log('Prime-Laguerre growth attempt passed: exact main cancellation, signed prime-error transform and unresolved RH-strength bound verified.');
