#!/usr/bin/env node
/**
 * Fourth-stage RSS/RH investigation.
 *
 * This script separates three very different statements:
 *   1. positivity that follows unconditionally from the RSS integer-repetition
 *      ledger (Dirichlet-series Gram kernels);
 *   2. the stronger Pick/Weil/Li positivity that would actually imply RH; and
 *   3. unitarity and reflection symmetry, which do not confine resonances.
 *
 * Numerical tests are finite diagnostics only. They are never promoted to a
 * proof of positivity on an infinite-dimensional function space.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/rh/rss-spectral-positivity-results.json");
const PI = Math.PI;
const RANKIN_KAPPA = 1 / (4 * PI * PI);
const LOG_PI = Math.log(PI);
const LOG_2 = Math.log(2);
const EULER_GAMMA = 0.5772156649015329;

class Complex {
  constructor(re, im = 0) {
    this.re = re;
    this.im = im;
  }
}

function complex(value) {
  return value instanceof Complex ? value : new Complex(value, 0);
}

function add(left, right) {
  const a = complex(left);
  const b = complex(right);
  return new Complex(a.re + b.re, a.im + b.im);
}

function sub(left, right) {
  const a = complex(left);
  const b = complex(right);
  return new Complex(a.re - b.re, a.im - b.im);
}

function mul(left, right) {
  const a = complex(left);
  const b = complex(right);
  return new Complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}

function div(left, right) {
  const a = complex(left);
  const b = complex(right);
  const denominator = b.re * b.re + b.im * b.im;
  return new Complex(
    (a.re * b.re + a.im * b.im) / denominator,
    (a.im * b.re - a.re * b.im) / denominator
  );
}

function conjugate(value) {
  const z = complex(value);
  return new Complex(z.re, -z.im);
}

function negate(value) {
  const z = complex(value);
  return new Complex(-z.re, -z.im);
}

function absolute(value) {
  const z = complex(value);
  return Math.hypot(z.re, z.im);
}

function complexExp(value) {
  const z = complex(value);
  const magnitude = Math.exp(z.re);
  return new Complex(magnitude * Math.cos(z.im), magnitude * Math.sin(z.im));
}

function complexLog(value) {
  const z = complex(value);
  return new Complex(Math.log(absolute(z)), Math.atan2(z.im, z.re));
}

function complexPow(base, exponent) {
  return complexExp(mul(exponent, complexLog(base)));
}

function complexSin(value) {
  const z = complex(value);
  return new Complex(
    Math.sin(z.re) * Math.cosh(z.im),
    Math.cos(z.re) * Math.sinh(z.im)
  );
}

function close(actual, expected, tolerance = 1e-10) {
  const a = complex(actual);
  const b = complex(expected);
  const scale = Math.max(1, absolute(a), absolute(b));
  assert.ok(
    absolute(sub(a, b)) <= tolerance * scale,
    `Expected ${JSON.stringify(a)} to equal ${JSON.stringify(b)} within ${tolerance}`
  );
}

// Lanczos approximation, with reflection for Re(z)<1/2.
function gamma(value) {
  let z = complex(value);
  if (z.re < 0.5) {
    return div(PI, mul(complexSin(mul(PI, z)), gamma(sub(1, z))));
  }

  const coefficients = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];

  z = sub(z, 1);
  let accumulator = complex(coefficients[0]);
  for (let index = 1; index < coefficients.length; index++) {
    accumulator = add(accumulator, div(coefficients[index], add(z, index)));
  }
  const t = add(z, 7.5);
  return mul(
    Math.sqrt(2 * PI),
    mul(complexPow(t, add(z, 0.5)), mul(complexExp(negate(t)), accumulator))
  );
}

// Euler-transformed Dirichlet eta series. All numerical evaluation points used
// below have Re(s)>0, where this representation converges rapidly.
function eta(value, terms = 100) {
  const s = complex(value);
  const differences = Array.from({ length: terms }, (_, index) =>
    complexExp(mul(-Math.log(index + 1), s))
  );
  let result = complex(0);
  let weight = 0.5;

  for (let order = 0; order < terms; order++) {
    result = add(result, mul(weight, differences[0]));
    for (let index = 0; index < terms - order - 1; index++) {
      differences[index] = sub(differences[index], differences[index + 1]);
    }
    weight *= 0.5;
  }
  return result;
}

function zeta(value) {
  const s = complex(value);
  const denominator = sub(1, complexExp(mul(LOG_2, sub(1, s))));
  return div(eta(s), denominator);
}

function completedLambda(value) {
  const s = complex(value);
  return mul(
    complexExp(mul(-0.5 * LOG_PI, s)),
    mul(gamma(mul(0.5, s)), zeta(s))
  );
}

// Riemann's entire xi(s)=1/2*s*(s-1)*Lambda(s).
function xi(value) {
  const s = complex(value);
  return mul(0.5, mul(s, mul(sub(s, 1), completedLambda(s))));
}

function xiLogDerivative(value, delta = 2e-5) {
  const s = complex(value);
  const derivative = div(sub(xi(add(s, delta)), xi(sub(s, delta))), 2 * delta);
  return div(derivative, xi(s));
}

function modularScattering(value) {
  const s = complex(value);
  return div(completedLambda(sub(mul(2, s), 1)), completedLambda(mul(2, s)));
}

// Psi(s)=xi(s)/xi(s+1) is the pole-normalised scattering coefficient:
// Psi(s)=((s-1)/(s+1))*Phi((s+1)/2).
function normalizedScattering(value) {
  const s = complex(value);
  return mul(
    div(sub(s, 1), add(s, 1)),
    modularScattering(mul(0.5, add(s, 1)))
  );
}

function normalizedScatteringLogDerivative(value, delta = 2e-5) {
  const s = complex(value);
  const derivative = div(
    sub(normalizedScattering(add(s, delta)), normalizedScattering(sub(s, delta))),
    2 * delta
  );
  return div(derivative, normalizedScattering(s));
}

function serializeComplex(value) {
  const z = complex(value);
  return { re: z.re, im: z.im };
}

function maximum(values) {
  return values.reduce((result, value) => Math.max(result, value), -Infinity);
}

// ---------------------------------------------------------------------------
// 1. Verify the exact bridge from modular scattering to xi'/xi.
// ---------------------------------------------------------------------------

const functionalEquationSamples = [
  new Complex(0.37, 0.9),
  new Complex(0.72, 3.4),
  new Complex(1.31, 7.2),
  new Complex(0.58, 13.0)
];

const xiFunctionalEquationChecks = functionalEquationSamples.map((s) => {
  const left = xi(s);
  const right = xi(sub(1, s));
  close(left, right, 5e-10);
  return {
    s: serializeComplex(s),
    absoluteError: absolute(sub(left, right))
  };
});
close(xi(2), PI / 6, 1e-12);

const scatteringBridgeSamples = [
  new Complex(0.67, 0.4),
  new Complex(0.82, 2.3),
  new Complex(1.2, 5.7),
  new Complex(0.61, 9.0)
];

const scatteringBridgeChecks = scatteringBridgeSamples.map((s) => {
  const fromScattering = normalizedScattering(s);
  const fromXiRatio = div(xi(s), xi(add(s, 1)));
  close(fromScattering, fromXiRatio, 2e-9);

  const derivativeFromScattering = normalizedScatteringLogDerivative(s);
  const derivativeFromXi = sub(xiLogDerivative(s), xiLogDerivative(add(s, 1)));
  close(derivativeFromScattering, derivativeFromXi, 2e-7);

  return {
    s: serializeComplex(s),
    normalizedScattering: serializeComplex(fromScattering),
    xiRatio: serializeComplex(fromXiRatio),
    ratioAbsoluteError: absolute(sub(fromScattering, fromXiRatio)),
    logDerivativeAbsoluteError: absolute(sub(derivativeFromScattering, derivativeFromXi))
  };
});

// ---------------------------------------------------------------------------
// 2. Unconditional positivity actually supplied by the integer ledger.
// ---------------------------------------------------------------------------

function vonMangoldtValues(limit) {
  const isPrime = new Uint8Array(limit + 1);
  isPrime.fill(1, 2);
  for (let p = 2; p * p <= limit; p++) {
    if (!isPrime[p]) continue;
    for (let multiple = p * p; multiple <= limit; multiple += p) {
      isPrime[multiple] = 0;
    }
  }

  const values = new Float64Array(limit + 1);
  for (let p = 2; p <= limit; p++) {
    if (!isPrime[p]) continue;
    for (let power = p; power <= limit;) {
      values[power] = Math.log(p);
      if (power > Math.floor(limit / p)) break;
      power *= p;
    }
  }
  return values;
}

function zeroComplexMatrix(size) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => complex(0))
  );
}

function dirichletGram(points, limit, weights = null) {
  const matrix = zeroComplexMatrix(points.length);
  for (let n = 1; n <= limit; n++) {
    const weight = weights === null ? 1 : weights[n];
    if (weight === 0) continue;
    const features = points.map((s) =>
      mul(Math.sqrt(weight), complexExp(mul(-Math.log(n), s)))
    );
    for (let row = 0; row < points.length; row++) {
      for (let column = 0; column < points.length; column++) {
        matrix[row][column] = add(
          matrix[row][column],
          mul(features[row], conjugate(features[column]))
        );
      }
    }
  }
  return matrix;
}

// Hermitian LDL* decomposition. Positive pivots certify positive definiteness
// for the displayed finite matrix, subject to floating-point error.
function maximumHermitianError(matrix) {
  let error = 0;
  for (let row = 0; row < matrix.length; row++) {
    for (let column = 0; column < matrix.length; column++) {
      error = Math.max(
        error,
        absolute(sub(matrix[row][column], conjugate(matrix[column][row])))
      );
    }
  }
  return error;
}

function hermitianLdlPivots(matrix) {
  const size = matrix.length;
  const lower = zeroComplexMatrix(size);
  const pivots = [];

  for (let row = 0; row < size; row++) {
    lower[row][row] = complex(1);
    let pivot = matrix[row][row].re;
    for (let k = 0; k < row; k++) {
      pivot -= absolute(lower[row][k]) ** 2 * pivots[k];
    }
    pivots.push(pivot);

    for (let next = row + 1; next < size; next++) {
      let value = matrix[next][row];
      for (let k = 0; k < row; k++) {
        value = sub(
          value,
          mul(mul(lower[next][k], pivots[k]), conjugate(lower[row][k]))
        );
      }
      lower[next][row] = div(value, pivot);
    }
  }
  return pivots;
}

const dirichletPoints = [
  new Complex(0.62, 0.3),
  new Complex(0.73, 2.0),
  new Complex(0.9, 5.0),
  new Complex(1.15, 9.0),
  new Complex(0.68, 14.0)
];
const DIRICHLET_LIMIT = 50_000;
const mangoldt = vonMangoldtValues(DIRICHLET_LIMIT);
const inverseCuspLaplacianWeights = new Float64Array(DIRICHLET_LIMIT + 1);
for (let n = 1; n <= DIRICHLET_LIMIT; n++) {
  inverseCuspLaplacianWeights[n] = RANKIN_KAPPA / (n * n);
}

const repetitionGram = dirichletGram(dirichletPoints, DIRICHLET_LIMIT);
const primePowerGram = dirichletGram(dirichletPoints, DIRICHLET_LIMIT, mangoldt);
const inverseCuspLaplacianGram = dirichletGram(
  dirichletPoints,
  DIRICHLET_LIMIT,
  inverseCuspLaplacianWeights
);
const repetitionHermitianError = maximumHermitianError(repetitionGram);
const primePowerHermitianError = maximumHermitianError(primePowerGram);
const inverseCuspHermitianError = maximumHermitianError(inverseCuspLaplacianGram);
const repetitionPivots = hermitianLdlPivots(repetitionGram);
const primePowerPivots = hermitianLdlPivots(primePowerGram);
const inverseCuspPivots = hermitianLdlPivots(inverseCuspLaplacianGram);
assert.ok(repetitionHermitianError < 1e-12);
assert.ok(primePowerHermitianError < 1e-12);
assert.ok(inverseCuspHermitianError < 1e-12);
assert.ok(repetitionPivots.every((pivot) => pivot > 0));
assert.ok(primePowerPivots.every((pivot) => pivot > 0));
assert.ok(inverseCuspPivots.every((pivot) => pivot > 0));

// The framework's kappa=1/(4*pi^2) is exactly the reciprocal of the
// first non-zero eigenvalue of -d^2/dx^2 on the unit-period cusp circle.
// Its mean-zero Green operator has eigenvalues kappa/n^2 and trace 1/12.
const firstCuspCircleEigenvalue = 4 * PI * PI;
const cuspGreenTrace = 2 * RANKIN_KAPPA * PI * PI / 6;
close(RANKIN_KAPPA * firstCuspCircleEigenvalue, 1, 1e-15);
close(cuspGreenTrace, 1 / 12, 1e-15);

// ---------------------------------------------------------------------------
// 3. The RH-equivalent Pick kernel of H(s)=xi'(s)/xi(s).
// ---------------------------------------------------------------------------

function xiPickMatrix(points) {
  const hValues = points.map((point) => xiLogDerivative(point));
  return points.map((left, row) => points.map((right, column) =>
    div(
      add(hValues[row], conjugate(hValues[column])),
      sub(add(left, conjugate(right)), 1)
    )
  ));
}

const pickPointSets = [
  [
    new Complex(0.65, 0.2),
    new Complex(0.75, 3.0),
    new Complex(0.8, 8.0),
    new Complex(0.7, 13.0),
    new Complex(1.1, 17.0)
  ],
  [
    new Complex(0.56, 1.0),
    new Complex(0.92, 4.5),
    new Complex(0.63, 10.0),
    new Complex(1.2, 19.0)
  ],
  [
    new Complex(0.54, 0.1),
    new Complex(0.7, 6.0),
    new Complex(1.0, 11.0),
    new Complex(0.82, 14.0),
    new Complex(1.35, 28.0)
  ]
];

const pickChecks = pickPointSets.map((points) => {
  const matrix = xiPickMatrix(points);
  const maximumHermitianResidual = maximumHermitianError(matrix);
  const pivots = hermitianLdlPivots(matrix);
  assert.ok(maximumHermitianResidual < 1e-10);
  assert.ok(pivots.every((pivot) => pivot > -1e-7));
  return {
    points: points.map(serializeComplex),
    maximumHermitianResidual,
    ldlPivots: pivots,
    minimumPivot: Math.min(...pivots)
  };
});

const hGrid = [];
for (const sigma of [0.51, 0.55, 0.65, 0.8, 1.1, 1.5]) {
  for (const t of [0, 0.2, 2, 5, 8, 13, 14, 14.13, 17, 25, 40]) {
    const point = new Complex(sigma, t);
    const value = xiLogDerivative(point);
    hGrid.push({ sigma, t, value: serializeComplex(value) });
  }
}
const minimumRealH = hGrid.reduce((best, item) =>
  item.value.re < best.value.re ? item : best
);
assert.ok(minimumRealH.value.re > 0);

// ---------------------------------------------------------------------------
// 4. Li coefficients: an independent countable positivity diagnostic.
// ---------------------------------------------------------------------------

function liCoefficients(maxN, samples, radius) {
  const values = [];
  let previousPhase = null;
  let phaseOffset = 0;

  for (let index = 0; index < samples; index++) {
    const theta = 2 * PI * index / samples;
    const z = new Complex(radius * Math.cos(theta), radius * Math.sin(theta));
    const s = div(1, sub(1, z));
    const logarithm = complexLog(xi(s));
    let phase = logarithm.im;

    if (previousPhase !== null) {
      while (phase + phaseOffset - previousPhase > PI) phaseOffset -= 2 * PI;
      while (phase + phaseOffset - previousPhase < -PI) phaseOffset += 2 * PI;
    }
    phase += phaseOffset;
    previousPhase = phase;
    values.push(new Complex(logarithm.re, phase));
  }

  const coefficients = [];
  for (let n = 1; n <= maxN; n++) {
    let coefficient = complex(0);
    for (let index = 0; index < samples; index++) {
      const theta = 2 * PI * index / samples;
      coefficient = add(
        coefficient,
        mul(values[index], new Complex(Math.cos(-n * theta), Math.sin(-n * theta)))
      );
    }
    coefficient = mul(1 / samples / radius ** n, coefficient);
    coefficients.push({
      n,
      lambda: n * coefficient.re,
      imaginaryResidual: n * coefficient.im
    });
  }
  return coefficients;
}

const LI_MAX = 30;
const liPrimary = liCoefficients(LI_MAX, 512, 0.55);
const liIndependent = liCoefficients(LI_MAX, 768, 0.5);
const liComparisons = liPrimary.map((entry, index) => ({
  n: entry.n,
  lambda: entry.lambda,
  independentLambda: liIndependent[index].lambda,
  absoluteDifference: Math.abs(entry.lambda - liIndependent[index].lambda),
  imaginaryResidual: entry.imaginaryResidual
}));
const lambdaOneExact = 1 + EULER_GAMMA / 2 - Math.log(4 * PI) / 2;
close(liPrimary[0].lambda, lambdaOneExact, 2e-12);
assert.ok(liPrimary.every(({ lambda }) => lambda > 0));
assert.ok(maximum(liComparisons.map(({ absoluteDifference }) => absoluteDifference)) < 2e-5);

// ---------------------------------------------------------------------------
// 5. Exact obstruction: unitary reflection-symmetric scattering factors can
//    carry arbitrary off-axis resonance pairs.
// ---------------------------------------------------------------------------

function counterScatteringFactor(value, resonance) {
  const w = complex(value);
  const a = complex(resonance);
  return div(
    mul(sub(w, a), sub(w, conjugate(a))),
    mul(add(w, conjugate(a)), add(w, a))
  );
}

const syntheticResonance = new Complex(0.22, 1.7);
const boundarySamples = [-12, -5, -1, 0, 0.7, 3, 9, 17];
const unitarityErrors = boundarySamples.map((t) =>
  Math.abs(absolute(counterScatteringFactor(new Complex(0, t), syntheticResonance)) - 1)
);

const reflectionSamples = [
  new Complex(0.3, 0.4),
  new Complex(1.2, -0.7),
  new Complex(-0.4, 3.1),
  new Complex(2.0, 5.0)
];
const reflectionErrors = reflectionSamples.map((w) =>
  absolute(sub(
    mul(counterScatteringFactor(w, syntheticResonance),
      counterScatteringFactor(negate(w), syntheticResonance)),
    1
  ))
);
const realityErrors = reflectionSamples.map((w) =>
  absolute(sub(
    counterScatteringFactor(conjugate(w), syntheticResonance),
    conjugate(counterScatteringFactor(w, syntheticResonance))
  ))
);
const syntheticZeroError = absolute(counterScatteringFactor(syntheticResonance, syntheticResonance));
assert.ok(maximum(unitarityErrors) < 1e-12);
assert.ok(maximum(reflectionErrors) < 1e-12);
assert.ok(maximum(realityErrors) < 1e-12);
assert.ok(syntheticZeroError < 1e-12);

// The xi functional equation and real analyticity also fail to confine zeros
// by themselves. This even real polynomial in w=s-1/2 inserts an arbitrary
// off-axis quadruple while preserving both symmetries.
function xiSymmetryCounterfactor(value, offset) {
  const w = sub(value, 0.5);
  const a = complex(offset);
  return mul(
    sub(mul(w, w), mul(a, a)),
    sub(mul(w, w), mul(conjugate(a), conjugate(a)))
  );
}

const syntheticXiOffset = new Complex(0.18, 2.1);
const xiSymmetrySamples = [
  new Complex(0.3, 0.4),
  new Complex(0.8, -1.2),
  new Complex(1.4, 3.7),
  new Complex(-0.6, 8.0)
];
const xiReflectionErrors = xiSymmetrySamples.map((s) =>
  absolute(sub(
    xiSymmetryCounterfactor(s, syntheticXiOffset),
    xiSymmetryCounterfactor(sub(1, s), syntheticXiOffset)
  ))
);
const xiRealityErrors = xiSymmetrySamples.map((s) =>
  absolute(sub(
    xiSymmetryCounterfactor(conjugate(s), syntheticXiOffset),
    conjugate(xiSymmetryCounterfactor(s, syntheticXiOffset))
  ))
);
const xiSyntheticZeroError = absolute(
  xiSymmetryCounterfactor(add(0.5, syntheticXiOffset), syntheticXiOffset)
);
assert.ok(maximum(xiReflectionErrors) < 1e-10);
assert.ok(maximum(xiRealityErrors) < 1e-10);
assert.ok(xiSyntheticZeroError < 1e-12);

const result = {
  analysisDate: "2026-10-14",
  title: "RSS spectral-confinement and positivity attempt",
  verdict: {
    rhProof: false,
    achieved: "an exact RH-equivalent Pick/Gram target, unconditional RSS ledger Gram kernels, an inverse-cusp Green-operator interpretation of kappa_R=1/(4*pi^2), and no-go counterfactors for confinement from scattering or xi symmetries alone",
    missing: "a zero-independent construction proving the xi Pick kernel is positive semidefinite for every finite set of points in Re(s)>1/2 (equivalently, Weil positivity on the full admissible test space)"
  },
  exactCriteria: {
    xiLogDerivative: "H(s)=xi'(s)/xi(s)",
    pickKernel: "K_xi(s,t)=(H(s)+conj(H(t)))/(s+conj(t)-1)",
    pickCriterion: "RH iff K_xi is positive semidefinite on Re(s)>1/2",
    weilCriterion: "RH iff W(g*tilde(g))>=0 for every admissible test function g",
    liCriterion: "RH iff lambda_n>=0 for every n>=1",
    liGeneratingFunction: "log xi(1/(1-z))=-log(2)+sum_(n>=1) lambda_n z^n/n"
  },
  scatteringBridge: {
    modularCoefficient: "Phi(u)=Lambda(2u-1)/Lambda(2u)",
    normalizedCoefficient: "Psi(s)=((s-1)/(s+1)) Phi((s+1)/2)=xi(s)/xi(s+1)",
    derivativeIdentity: "Psi'(s)/Psi(s)=H(s)-H(s+1)",
    xiFunctionalEquationChecks,
    scatteringBridgeChecks
  },
  unconditionalLedgerPositivity: {
    statement: "integer repetitions give Gram features n^(-s), while prime powers give sqrt(Lambda(n)) n^(-s)",
    repetitionKernel: "K_rep(s,t)=sum_(n>=1)n^(-s-conj(t))=zeta(s+conj(t))",
    primePowerKernel: "K_Lambda(s,t)=sum_(n>=2)vonMangoldt(n)n^(-s-conj(t))=-zeta'/zeta(s+conj(t))",
    domain: "Re(s),Re(t)>1/2, so both defining series are evaluated in Re(s+conj(t))>1",
    truncationLimit: DIRICHLET_LIMIT,
    points: dirichletPoints.map(serializeComplex),
    repetitionMaximumHermitianResidual: repetitionHermitianError,
    primePowerMaximumHermitianResidual: primePowerHermitianError,
    repetitionLdlPivots: repetitionPivots,
    primePowerLdlPivots: primePowerPivots,
    limitation: "these are genuine positive kernels but are not the RH-equivalent K_xi kernel"
  },
  existingRankinKappa: {
    value: RANKIN_KAPPA,
    formula: "kappa_R=1/(4*pi^2)",
    exactCuspInterpretation: "on the unit-period modular cusp circle, kappa_R is the reciprocal of the first non-zero eigenvalue (2*pi)^2 of -d^2/dx^2",
    firstCuspCircleEigenvalue,
    eigenvalueProduct: RANKIN_KAPPA * firstCuspCircleEigenvalue,
    meanZeroGreenTrace: cuspGreenTrace,
    meanZeroGreenTraceFormula: "2*kappa_R*zeta(2)=1/12",
    inducedFeature: "sqrt(kappa_R) n^(-s-1)",
    inducedKernel: "K_kappa(s,t)=kappa_R*zeta(s+conj(t)+2)",
    truncationLimit: DIRICHLET_LIMIT,
    maximumHermitianResidual: inverseCuspHermitianError,
    ldlPivots: inverseCuspPivots,
    status: "exact positive Green-operator normalisation",
    limitation: "positive scalar normalisation and inverse-cusp weighting do not turn the combined-argument ledger kernel into the RH-equivalent K_xi kernel"
  },
  targetPickPositivityDiagnostics: {
    hGridPointCount: hGrid.length,
    minimumSampledRealPart: minimumRealH,
    pickChecks,
    limitation: "finite floating-point samples cannot establish positivity on the full half-plane"
  },
  liDiagnostics: {
    method: "Cauchy coefficient extraction from log xi(1/(1-z)) at two independent radii/sample counts",
    maxN: LI_MAX,
    lambdaOneExact,
    allDisplayedPositive: liPrimary.every(({ lambda }) => lambda > 0),
    maximumIndependentDifference: maximum(liComparisons.map(({ absoluteDifference }) => absoluteDifference)),
    coefficients: liComparisons,
    limitation: "positivity of any finite prefix is compatible with an off-critical zero and cannot prove RH"
  },
  unitarityNoGo: {
    factor: "C_a(w)=((w-a)(w-conj(a)))/((w+conj(a))(w+a))",
    resonanceParameter: serializeComplex(syntheticResonance),
    properties: [
      "C_a(w)C_a(-w)=1",
      "|C_a(it)|=1 for real t",
      "C_a(conj(w))=conj(C_a(w))",
      "zeros occur at a and conj(a), with poles at -a and -conj(a)"
    ],
    maximumUnitarityError: maximum(unitarityErrors),
    maximumReflectionError: maximum(reflectionErrors),
    maximumRealityError: maximum(realityErrors),
    syntheticZeroError,
    conclusion: "self-adjoint boundary unitarity and the scattering functional equation permit arbitrary off-axis resonance pairs; an additional arithmetic positivity theorem is indispensable"
  },
  xiSymmetryNoGo: {
    factor: "P_a(s)=((s-1/2)^2-a^2)((s-1/2)^2-conj(a)^2)",
    offset: serializeComplex(syntheticXiOffset),
    properties: [
      "P_a(1-s)=P_a(s)",
      "P_a(conj(s))=conj(P_a(s))",
      "zeros occur at 1/2 plus or minus a and 1/2 plus or minus conj(a)"
    ],
    maximumFunctionalEquationError: maximum(xiReflectionErrors),
    maximumRealityError: maximum(xiRealityErrors),
    syntheticZeroError: xiSyntheticZeroError,
    limitation: "this factor need not preserve the Euler product or xi asymptotics; it proves only that the functional and conjugation symmetries do not themselves confine zeros"
  },
  requiredNewRSSTheorem: {
    statement: "construct, without assuming zero locations, a Hilbert space H_RSS and vectors V_s from primitive return data such that <V_t,V_s>=K_xi(s,t) for every Re(s),Re(t)>1/2",
    consequence: "Gram positivity would imply H is holomorphic with positive real part in the right critical half-plane; xi would have no zero there, and xi(s)=xi(1-s) would then force all nontrivial zeros onto Re(s)=1/2",
    currentStatus: "not derived; the known positive torus-strain metric and positive Dirichlet kernels do not equal this arithmetic kernel"
  }
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);

console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
console.log(`Verified ${scatteringBridgeChecks.length} normalized scattering/xi identities.`);
console.log(`Proved by explicit Gram features and checked numerically: repetition and prime-power kernels through ${DIRICHLET_LIMIT}.`);
console.log("Identified kappa_R=1/(4*pi^2) as the inverse first cusp-circle eigenvalue and verified the induced positive Green kernel.");
console.log(`Sampled ${hGrid.length} H(s)=xi'/xi points and ${pickChecks.length} Pick matrices; all displayed diagnostics were positive.`);
console.log(`Computed ${LI_MAX} positive Li coefficients twice; maximum cross-check difference ${result.liDiagnostics.maximumIndependentDifference.toExponential(3)}.`);
console.log("Constructed scattering and xi-symmetry counterfactors with arbitrary off-axis zeros/resonances.");
console.log("No RH proof: full xi/Weil kernel positivity remains exactly the missing theorem.");
