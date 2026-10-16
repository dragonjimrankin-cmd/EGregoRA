#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-final-three-routes-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.orderOneZeroPreservingCancellationFound, false);
assert.equal(results.verdict.canonicalStageInterlacingFound, false);
assert.equal(results.verdict.blaschkeSeamDivisorConstructed, true);
assert.equal(results.verdict.coerciveSeamHorizontalNormConstructed, true);
assert.equal(results.verdict.seamNormControlledByPrimeOrKernelData, false);

const ledger = results.completedLedgerCancellation;
assert.ok(Math.abs(ledger.p2Curvature + 3.9602015607712566) < 1e-14);
assert.ok(Math.abs(2 * ledger.gaussianCoefficientForSingleCorrection + ledger.p2Curvature) < 1e-14);
assert.ok(Math.abs(2 * ledger.gaussianCoefficientForSymmetricCorrection + ledger.symmetricDyadicCurvature) < 1e-14);
assert.match(ledger.orderObstruction, /order two/);
assert.match(ledger.zeroFreeOrderOneTheorem, /exp\(a\+bs\)/);
assert.match(ledger.divisorAlternative, /zeros or poles/);
assert.match(ledger.consequence, /no zero-free counterterm/);

const interlacing = results.interlacingRoute;
assert.equal(interlacing.familyA.stage, 14);
assert.equal(interlacing.familyB.stage, 20);
assert.equal(interlacing.strictAlternation, false);
assert.ok(interlacing.mergedOrder.some((entry, index, entries) =>
  index > 0 && entry.family === entries[index - 1].family
));
assert.match(interlacing.consequence, /do not form a strict interlacing chain/);
assert.match(interlacing.remainingTarget, /Sturm or Hermite-Biehler/);

const seam = results.blaschkeSeamDivisor;
assert.match(seam.exponentialMap, /right half-plane/);
assert.match(seam.diskMap, /w=-1/);
assert.match(seam.inverse, /eta=arg/);
assert.match(seam.blaschkeIdentity, /1-\|w\|\^2/);
assert.match(seam.condition, /Blaschke summability/);
assert.ok(Math.abs(seam.quarterDisplacementValue - Math.asinh(1)) < 1e-15);
assert.ok(seam.halfQuarterDisplacementValue < seam.quarterDisplacementValue);
assert.equal(seam.samples.length, 12);
for (const sample of seam.samples) {
  assert.ok(sample.exactOneMinusModulusSquared >= 0);
  if (sample.eta === 0) {
    assert.equal(sample.hyperbolicDistanceToCriticalDiameter, 0);
  }
  if (sample.eta === 0.25) {
    assert.ok(Math.abs(sample.hyperbolicDistanceToCriticalDiameter - Math.asinh(1)) < 1e-15);
  }
}
assert.ok(seam.blaschkeConditionSamples.every((sample) => sample.horizontalMarker === 0.25));
assert.match(seam.achievement, /fixed horizontal displacement/);
assert.match(seam.remainingFailure, /supremum/);
assert.match(seam.status, /norm is uncontrolled/);

assert.ok(results.combinedAssessment.exactAdvances.some((item) => /Blaschke divisor/.test(item)));
assert.ok(results.combinedAssessment.exactAdvances.some((item) => /hyperbolic norm/.test(item)));
assert.ok(results.combinedAssessment.remainingObligations.some((item) => /supremum/.test(item)));
assert.match(results.combinedAssessment.status, /no proof of RH/);

const report = await read('docs/rh/rss-final-three-routes.md');
for (const marker of [
  'Exact completed-ledger cancellation within order one',
  'A zero-free order-one factor cannot do the job',
  'Interlacing of canonical theta refinements',
  'The first tested stage pair',
  'Constructing the seam divisor',
  'The zeta-zero divisor satisfies the Blaschke condition',
  'A coercive horizontal seam norm',
  'Why the seam construction still does not prove RH',
  'No proof of RH is obtained'
]) {
  assert.ok(report.includes(marker), `final-three-routes report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-final-three-routes"'));
assert.ok(publicSplice.includes('Did any of the final three routes succeed?'));
assert.ok(publicSplice.includes('Blaschke seam divisor'));
assert.ok(publicSplice.includes('0.881373587020'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-final-three-routes'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('A Blaschke divisor solves seam accounting, not seam control'));
assert.ok(consolidated.includes('rss-final-three-routes.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('build the seam divisor'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-final-three-routes'));
assert.ok(oracle.includes('Did the final cancellation, interlacing, or seam-divisor routes succeed?'));

console.log('Final three routes passed: order-one no-go, failed stage interlacing, Blaschke divisor and coercive seam norm verified.');
