#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-prime-phase-conservation-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.scalarConservationProved, false);
assert.equal(results.verdict.primePhaseLawProvedInEulerHalfPlane, true);
assert.equal(results.verdict.endpointCompletedPhaseLawProvedInEulerHalfPlane, true);
assert.equal(results.verdict.criticalBoundaryContinuationProved, false);
assert.equal(results.verdict.continuationEquivalentToRh, true);

const phase = results.weightedPrimePhaseLaw;
assert.equal(phase.a, 1.5);
assert.match(phase.law, /sigma>1/);
assert.match(phase.endpointCompletedLaw, /1\/\(sigma\+1\/2\)/);
assert.equal(phase.fourierChecks.length, 4);
assert.ok(phase.fourierChecks.every((row) => row.absoluteError < 4e-8));
assert.equal(phase.primePhaseRows.length, 4);
assert.ok(phase.primePhaseRows.slice(0, 3).every((row) => row.provedByEulerProduct));
assert.equal(phase.primePhaseRows[3].provedByEulerProduct, false);
assert.ok(Math.abs(phase.primePhaseRows[3].partialPrimeMoment - 0.5699609931) < 2e-6);

const boundary = results.criticalBoundaryTarget;
assert.match(boundary.formalEndpointCompletedValue, /C'\/C\(2\)/);
assert.match(boundary.ordinateIdentity, /H_ord/);
assert.ok(Math.abs(boundary.boundaryEndpointPhaseTransform - 5 / 6) < 1e-15);
assert.equal(boundary.analyticEndpointValue, 1);
assert.ok(Math.abs(boundary.poleCorrection + 1 / 6) < 1e-15);
assert.match(boundary.zetaPoleCorrection, /5\/6/);
assert.match(boundary.defectIdentityZetaPhase, /1\/6/);
assert.match(boundary.defectIdentityEndpointCompleted, /D_2/);
assert.match(boundary.equivalence, /RH/);

const crossing = results.zeroCrossingAudit;
assert.match(crossing.mechanism, /Blaschke/);
assert.match(crossing.sign, /strictly positive/);
assert.equal(crossing.rows.length, 9);
assert.ok(crossing.rows.every((row) => row.anchorDefect > 0));
assert.match(crossing.consequence, /no zero-crossing/);

assert.equal(results.failedClosureRoutes.length, 5);
assert.match(results.minimalRemainingStatement, /no Blaschke jump/);
assert.match(results.status, /RH remain open/);

const report = await read('docs/rh/rss-prime-phase-conservation.md');
for (const marker of [
  'Fourier transform of the principal-prime phase',
  'Endpoint completion is exact',
  'Connection to the ordinate anchor',
  'The Blaschke term is the horizontal defect',
  'Why analytic continuation of the prime sum does not suffice',
  'Closure routes retried',
  'Exact status',
  'RH remains open.'
]) {
  assert.ok(report.includes(marker), `prime-phase report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const decimal = await read('tti/src/decimal-splice.njk');
assert.ok(decimal.includes('id="t-prime-phase-conservation"'));
assert.ok(decimal.includes('The Euler Law Holds Until a Zero Is Crossed'));

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-prime-phase-conservation"'));
assert.ok(splice.includes('Can the Euler prime-phase law reach the critical boundary?'));
assert.ok(splice.includes('rss-prime-phase-conservation.md'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-prime-phase-conservation'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The prime-phase law and its exact crossing defect'));
assert.ok(consolidated.includes('rss-prime-phase-conservation.md'));
assert.ok(consolidated.includes('Prime-phase boundary conservation retry'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The phase-law retry proves the anchor identity in the Euler half-plane'));

const [oracle, mirror] = await Promise.all([
  read('tti/src/assets/js/oracle-knowledge.js'),
  read('egregora-patch/public/assets/js/oracle-knowledge.js')
]);
assert.equal(oracle, mirror);
assert.ok(oracle.includes('The retry proves an exact weighted prime-phase law for sigma greater than one.'));
assert.ok(oracle.includes('#t-rh-prime-phase-conservation'));

console.log('Prime-phase conservation tests passed: Euler-domain law, endpoint completion, pole correction, Blaschke defect and RH-equivalent boundary verified.');
