#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-two-ended-seam-ledger-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.sameDivisorOrderOneCancellationAvailable, false);
assert.equal(results.verdict.naturalSymmetricDyadicFactorHasEmptyReservoir, false);
assert.equal(results.verdict.consecutiveCanonicalStagesInterlace, false);
assert.equal(results.verdict.oneCarrierThetaRefinementsInterlace, false);
assert.equal(results.verdict.twoEndedPoissonSeamLedgerConstructed, true);
assert.equal(results.verdict.heightIndependentSeamDeterminantConstructed, true);
assert.equal(results.verdict.seamLedgerControlledArithmetically, false);

const ledger = results.completedLedgerRigidity;
assert.equal(ledger.exactP2Curvature, '-(4+3 sqrt(2))(log 2)^2');
assert.ok(Math.abs(ledger.p2Curvature + 3.960201560771257) < 1e-14);
assert.ok(Math.abs(2 * ledger.gaussianCoefficient + ledger.p2Curvature) < 1e-14);
assert.match(ledger.sameDivisorTheorem, /exp\(a\+bs\)/);
assert.match(ledger.consequence, /another ledger component/);
assert.match(ledger.symmetricDyadicFactor, /D2\(1-s\)/);
assert.equal(ledger.symmetricFactorOrder, 1);
assert.equal(ledger.boundaryDivisor.length, 5);
assert.deepEqual(ledger.boundaryDivisor[2].leftBoundaryZero, [0, 0]);
assert.deepEqual(ledger.boundaryDivisor[2].rightBoundaryZero, [1, 0]);
assert.match(ledger.boundaryDivisorDescription, /both strip boundaries/);
assert.match(ledger.gammaDuplicationCheck, /zero logarithmic curvature/);

const interlacing = results.canonicalInterlacing;
assert.match(interlacing.comparisonDomain, /positive critical-line ordinates/);
assert.deepEqual(
  interlacing.consecutiveStages.mergedPositiveRootOrder.map((entry) => entry.family),
  ['N15', 'N14', 'N14', 'N15']
);
assert.equal(interlacing.consecutiveStages.strictAlternation, false);
assert.equal(interlacing.consecutiveStages.stage14.argumentPrinciple.zeroCount, 2);
assert.equal(interlacing.consecutiveStages.stage15.argumentPrinciple.zeroCount, 2);
assert.deepEqual(
  interlacing.literalCarrierAddition.mergedPositiveRootOrder.map((entry) => entry.family),
  ['M2', 'M1', 'M1', 'M2', 'M2']
);
assert.equal(interlacing.literalCarrierAddition.strictAlternation, false);
assert.equal(interlacing.literalCarrierAddition.oneCarrier.argumentPrinciple.zeroCount, 2);
assert.equal(interlacing.literalCarrierAddition.twoCarriers.argumentPrinciple.zeroCount, 3);
assert.match(interlacing.consequence, /not an artefact/);
assert.match(interlacing.limitation, /not a rigorous interval-arithmetic theorem/);

const seam = results.twoEndedSeamLedger;
assert.match(seam.endpointIdentities.plusOne, /exp\(-pi gamma\)/);
assert.match(seam.endpointIdentities.minusOne, /exp\(\+pi gamma\)/);
assert.match(seam.endpointIdentities.product, /cos\^2\(pi eta\)=sech\^2/);
assert.match(seam.additiveDefect, /2log cosh/);
assert.match(seam.extendedLimit, /Delta=1 exactly under RH/);
assert.match(seam.coerciveInfimum, /equal to one exactly under RH/);
assert.match(seam.blaschkePhaseMeaning, /boundary phase derivative/);
assert.ok(Math.abs(seam.quarterDisplacement.endpointProduct - 0.5) < 1e-15);
assert.ok(Math.abs(seam.quarterDisplacement.additiveSeamDefect - Math.log(2)) < 1e-15);
assert.ok(Math.abs(seam.quarterDisplacement.hyperbolicDistance - Math.asinh(1)) < 1e-15);
for (const eta of [0, 0.1, 0.25, 0.49]) {
  const samples = seam.samples.filter((sample) => sample.eta === eta);
  assert.equal(samples.length, 2);
  assert.ok(Math.abs(samples[0].endpointProduct - samples[1].endpointProduct) < 1e-15);
  assert.ok(samples.every((sample) => sample.additiveSeamDefect >= -1e-15));
}
assert.equal(seam.branchTableAtQuarterDisplacement.length, 5);
assert.ok(seam.branchTableAtQuarterDisplacement.slice(0, 4).every((entry) => entry.strictContraction));
assert.equal(seam.branchTableAtQuarterDisplacement[4].strictContraction, false);
assert.match(seam.fourBranchIdentity, /\(c-1\)\^2>0/);
assert.match(seam.advance, /four .*descendants/);
assert.match(seam.remainingFailure, /renormalized endpoint factorization/);

assert.ok(results.combinedAssessment.exactAdvances.some((item) => /Hadamard rigidity/.test(item)));
assert.ok(results.combinedAssessment.exactAdvances.some((item) => /endpoint Poisson/.test(item)));
assert.ok(results.combinedAssessment.exactAdvances.some((item) => /four descendants/.test(item)));
assert.match(results.combinedAssessment.status, /RH is not proved/);

const report = await read('docs/rh/rss-two-ended-seam-ledger.md');
for (const marker of [
  'The order-one completed ledger is rigid',
  'The natural symmetric factor displays its reservoir',
  'Interlacing at actual canonical microsteps',
  'Consecutive deficit stages',
  'Adding one full theta carrier',
  'Two-ended harmonic data at the seam',
  'An additive seam defect',
  'A seam determinant that cannot lose an escaping zero',
  'Four-way branching no longer cancels contraction',
  'Why the endpoint identity still stops short',
  'No proof of RH is obtained'
]) {
  assert.ok(report.includes(marker), `two-ended seam-ledger report is missing: ${marker}`);
}

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-two-ended-seam-ledger"'));
assert.ok(splice.includes('What does the two-ended seam ledger add?'));
assert.ok(splice.includes('P_a(+1)P_a(-1)'));
assert.ok(splice.includes('Four descendants'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-two-ended-seam-ledger'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The two-ended seam ledger is coercive but uncontrolled'));
assert.ok(consolidated.includes('rss-two-ended-seam-ledger.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('seam divisor and endpoint product'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-two-ended-seam-ledger'));
assert.ok(oracle.includes('What did the two-ended seam-ledger continuation establish?'));

console.log('Two-ended seam ledger passed: order-one rigidity, actual microstep failures and endpoint Poisson defect verified.');
