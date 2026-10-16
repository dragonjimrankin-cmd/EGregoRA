#!/usr/bin/env node
/**
 * Nineteenth-stage attempt on the three narrowest surviving routes:
 * order-preserving completed-ledger cancellation, interlacing of canonical
 * refinements, and a compactified Blaschke seam divisor with coercive norm.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'docs/rh/rss-final-three-routes-results.json');
const PI = Math.PI;
const PHI = (1 + Math.sqrt(5)) / 2;

function p2LogCurvature(s) {
  const q = 2 ** (-s);
  return -(Math.log(2) ** 2) * q / (1 - q) ** 2;
}

const p2Curvature = p2LogCurvature(0.5);
const gaussianCoefficientForSingleCorrection = -p2Curvature / 2;
const symmetricDyadicCurvature = 2 * p2Curvature;
const gaussianCoefficientForSymmetricCorrection = -symmetricDyadicCurvature / 2;
assert.ok(gaussianCoefficientForSingleCorrection > 0);
assert.ok(gaussianCoefficientForSymmetricCorrection > 0);
assert.ok(Math.abs(2 * gaussianCoefficientForSingleCorrection + p2Curvature) < 1e-14);
assert.ok(Math.abs(2 * gaussianCoefficientForSymmetricCorrection + symmetricDyadicCurvature) < 1e-14);

const halving = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'docs/rh/rss-splice-at-one-halving-results.json'), 'utf8'
));
const roots14 = halving.finiteDeficitHalvingDiagnostics['zeroth-seed'].chronological[0].criticalLineRoots;
const roots20 = halving.finiteDeficitHalvingDiagnostics['zeroth-seed'].chronological[1].criticalLineRoots;
assert.equal(roots14.length, 2);
assert.equal(roots20.length, 2);

function fullSymmetricRoots(positiveRoots) {
  return [...positiveRoots.map((root) => -root).reverse(), ...positiveRoots];
}

const positiveRootOrder = [
  ...roots14.map((root) => ({ root, family: 'N14' })),
  ...roots20.map((root) => ({ root, family: 'N20' })),
].sort((left, right) => left.root - right.root);
const symmetricRootOrder = [
  ...fullSymmetricRoots(roots14).map((root) => ({ root, family: 'N14' })),
  ...fullSymmetricRoots(roots20).map((root) => ({ root, family: 'N20' })),
].sort((left, right) => left.root - right.root);
const strictAlternation = positiveRootOrder.every((entry, index) =>
  index === 0 || entry.family !== positiveRootOrder[index - 1].family
);
assert.equal(strictAlternation, false);
assert.ok(positiveRootOrder.some((entry, index) =>
  index > 0 && entry.family === positiveRootOrder[index - 1].family
));

function complexExp(real, imag) {
  const scale = Math.exp(real);
  return [scale * Math.cos(imag), scale * Math.sin(imag)];
}

function add(left, right) {
  return [left[0] + right[0], left[1] + right[1]];
}

function subtract(left, right) {
  return [left[0] - right[0], left[1] - right[1]];
}

function divide(left, right) {
  const norm = right[0] ** 2 + right[1] ** 2;
  return [
    (left[0] * right[0] + left[1] * right[1]) / norm,
    (left[1] * right[0] - left[0] * right[1]) / norm,
  ];
}

function modulus(value) {
  return Math.hypot(value[0], value[1]);
}

function argument(value) {
  return Math.atan2(value[1], value[0]);
}

function stripToDisk(eta, gamma) {
  const q = complexExp(-PI * gamma, PI * eta);
  const w = divide(subtract(q, [1, 0]), add(q, [1, 0]));
  return { q, w };
}

function diskToStrip(w) {
  const q = divide(add([1, 0], w), subtract([1, 0], w));
  return {
    eta: argument(q) / PI,
    gamma: -Math.log(modulus(q)) / PI,
    q,
  };
}

function hyperbolicDistanceToCriticalDiameter(eta) {
  return Math.atanh(Math.abs(Math.sin(PI * eta)));
}

const seamSamples = [];
for (const eta of [0, 0.1, 0.25, 0.49]) {
  for (const gamma of [14.134725141734693, 21.022039638771556, 50]) {
    const mapped = stripToDisk(eta, gamma);
    const inverse = diskToStrip(mapped.w);
    const exactBlaschkeDefect = 4 * mapped.q[0]
      / ((1 + mapped.q[0]) ** 2 + mapped.q[1] ** 2);
    // Direct subtraction 1-|w|^2 loses the exponentially small defect at
    // ordinary precision, while the exact right-half-plane formula retains it.
    assert.ok(exactBlaschkeDefect >= 0);
    seamSamples.push({
      eta,
      gamma,
      q: mapped.q,
      w: mapped.w,
      exactOneMinusModulusSquared: exactBlaschkeDefect,
      logAsymptoticRadialDefect: Math.log(4 * Math.cos(PI * eta)) - PI * gamma,
      hyperbolicDistanceToCriticalDiameter: hyperbolicDistanceToCriticalDiameter(eta),
      inverseFormulaEta: 'arg((1+w)/(1-w))/pi',
      inverseFormulaGamma: '-log|(1+w)/(1-w)|/pi',
    });
  }
}

const etaQuarterDistances = seamSamples
  .filter((sample) => sample.eta === 0.25)
  .map((sample) => sample.hyperbolicDistanceToCriticalDiameter);
assert.ok(etaQuarterDistances.every((distance) =>
  Math.abs(distance - Math.asinh(1)) < 1e-15
));
const halfEtaDistance = hyperbolicDistanceToCriticalDiameter(0.125);
assert.ok(halfEtaDistance < etaQuarterDistances[0]);
assert.ok(seamSamples.filter((sample) => sample.eta === 0)
  .every((sample) => sample.hyperbolicDistanceToCriticalDiameter === 0));

const blaschkeConditionSamples = [14, 20, 30, 40].map((stage) => {
  const gamma = PHI ** stage;
  return {
    stage,
    gamma,
    logAsymptoticOneMinusModulus: Math.log(2 * Math.cos(PI / 4)) - PI * gamma,
    horizontalMarker: 0.25,
  };
});

const results = {
  analysisDate: '2026-10-15',
  title: 'Order-one cancellation, interlacing, and a Blaschke seam divisor',
  question: 'can the final three proof targets be constructed rather than left as abstract obligations?',
  verdict: {
    rhProved: false,
    orderOneZeroPreservingCancellationFound: false,
    canonicalStageInterlacingFound: false,
    blaschkeSeamDivisorConstructed: true,
    coerciveSeamHorizontalNormConstructed: true,
    seamNormControlledByPrimeOrKernelData: false,
    conclusion: 'the ledger cancellation and interlacing routes fail in their current forms. A genuine Blaschke divisor can encode every zeta zero in a compact disk while preserving a height-independent hyperbolic marker of horizontal displacement. This solves seam accounting and coercive detection, but no current prime or theta estimate controls the supremum of that marker, so RH does not follow.',
  },
  completedLedgerCancellation: {
    p2Curvature,
    symmetricDyadicCurvature,
    gaussianCoefficientForSingleCorrection,
    gaussianCoefficientForSymmetricCorrection,
    formalCounterterm: 'exp(c(s-1/2)^2) supplies log-curvature 2c and can cancel the dyadic correction algebraically',
    orderObstruction: 'the Gaussian counterterm has order two; multiplying xi by it leaves the order-one completed class even though it adds no zeros',
    zeroFreeOrderOneTheorem: 'a zero-free entire function of order at most one has exponential form exp(a+bs), whose logarithmic second derivative is zero',
    divisorAlternative: 'an order-one factor with nonzero central curvature must introduce zeros or poles and therefore creates a nonempty residue reservoir',
    consequence: 'within the order-one class and with the xi zero divisor fixed, no zero-free counterterm can cancel the nonzero p=2 curvature',
    status: 'exact cancellation can be manufactured only by raising order or changing the divisor; the requested empty-reservoir identity was not found',
  },
  interlacingRoute: {
    familyA: { stage: 14, positiveRoots: roots14, fullRoots: fullSymmetricRoots(roots14) },
    familyB: { stage: 20, positiveRoots: roots20, fullRoots: fullSymmetricRoots(roots20) },
    comparisonDomain: 'positive critical-line ordinates; the full symmetric line has an additional trivial central-pair obstruction for even functions',
    mergedOrder: positiveRootOrder,
    symmetricMergedOrder: symmetricRootOrder,
    strictAlternation,
    consequence: 'the tested canonical deficit-halving stages already contain adjacent roots from the same family, so they do not form a strict interlacing chain',
    limitation: 'this rules out the naive stage-to-stage Obreschkoff route; a different micro-refinement might interlace but must be constructed and proved',
    remainingTarget: 'find carrier-sized updates represented by a common Sturm or Hermite-Biehler structure rather than positive kernel addition alone',
    status: 'no interlacing theorem holds for the current stage refinement',
  },
  blaschkeSeamDivisor: {
    stripCoordinate: 'z=s-1/2=eta+i gamma with |eta|<1/2',
    exponentialMap: 'q=exp(i pi z)=exp(-pi gamma) exp(i pi eta), mapping the strip to the right half-plane',
    diskMap: 'w=(q-1)/(q+1), sending gamma=+infinity to w=-1 and gamma=-infinity to w=+1',
    inverse: 'q=(1+w)/(1-w), eta=arg(q)/pi, gamma=-log|q|/pi',
    blaschkeIdentity: '1-|w|^2=4 Re(q)/|1+q|^2',
    condition: 'the zero count is O(T log T) while 1-|w|=O(exp(-pi |gamma|)), so the mapped zero divisor satisfies the Blaschke summability condition',
    product: 'B(w)=product_a (|a|/a)(a-w)/(1-conj(a)w), with conjugate pairing for the xi symmetries',
    coerciveNorm: 'd_hyp(w,real diameter)=atanh(|sin(pi eta)|), independent of gamma and zero exactly on the critical line',
    quarterDisplacementValue: Math.asinh(1),
    halfQuarterDisplacementValue: halfEtaDistance,
    samples: seamSamples,
    blaschkeConditionSamples,
    achievement: 'all zeros entering from infinite height are accounted for as a convergent disk divisor, and fixed horizontal displacement remains a fixed positive hyperbolic distance at the seam',
    remainingFailure: 'Blaschke convergence controls radial mass, not the supremum of hyperbolic distance from the real diameter; symmetric off-real Blaschke zeros are allowed',
    sufficientMissingTheorem: 'derive from the prime ledger or canonical kernel that sup over divisor zeros of d_hyp tends to zero under the splice refinements',
    status: 'the requested seam divisor and coercive marker are constructed, but their global norm is uncontrolled',
  },
  combinedAssessment: {
    exactAdvances: [
      'proved an order-one zero-free counterterm cannot cancel the dyadic curvature',
      'disproved strict interlacing for the current N=14 to N=20 canonical refinement',
      'constructed a convergent Blaschke divisor for the compactified zero set',
      'constructed a height-independent hyperbolic norm equal to zero exactly on the critical line',
    ],
    remainingObligations: [
      'control the supremum hyperbolic seam norm from arithmetic or kernel data',
      'or redesign the canonical refinements as an interlacing Sturm chain',
      'or derive a completed-ledger cancellation that changes neither order nor divisor',
    ],
    status: 'one requested object is now constructed, but no proof of RH is obtained',
  },
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(results, null, 2)}\n`);

console.log('Final three routes investigation complete.');
console.log(`  Order-one dyadic cancellation: unavailable; Gaussian coefficient ${gaussianCoefficientForSingleCorrection.toFixed(12)} raises order.`);
console.log(`  Canonical N=14/N=20 strict interlacing: ${strictAlternation}.`);
console.log(`  Blaschke seam divisor: constructed; d(eta=1/4)=${Math.asinh(1).toFixed(12)} at every height.`);
console.log('  Verdict: seam accounting succeeds, seam norm control remains open.');
