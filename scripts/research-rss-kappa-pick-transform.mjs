#!/usr/bin/env node
/**
 * Fifth-stage RSS/RH investigation.
 *
 * Goal: determine whether the kappa-normalised cusp Green kernel can be
 * transformed into the RH-equivalent xi Pick kernel.
 *
 * The exact route found here is through the arithmetic Riemann screw function
 * Psi and a double Laplace congruence. The transform is unconditional in
 * Re(s),Re(t)>1. Extending it as a positive Gram transform to
 * Re(s),Re(t)>1/2 is equivalent to RH, not a proof of it.
 *
 * All sampled positivity checks are finite diagnostics only.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/rh/rss-kappa-pick-transform-results.json");
const PI = Math.PI;
const KAPPA_R = 1 / (4 * PI * PI);
const EULER_GAMMA = 0.5772156649015329;
const CATALAN = 0.91596559417721901505;
const LERCH_AT_ZERO = PI * PI + 8 * CATALAN;
const DIGAMMA_QUARTER = -EULER_GAMMA - PI / 2 - 3 * Math.log(2);
const ARCHIMEDEAN_LINEAR = DIGAMMA_QUARTER - Math.log(PI);
const T_MAX = 12;
const PRIME_LIMIT = Math.ceil(Math.exp(T_MAX));

function close(actual, expected, tolerance, label) {
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  assert.ok(
    Math.abs(actual - expected) <= tolerance * scale,
    `${label}: expected ${actual} to equal ${expected} within ${tolerance}`
  );
}

function maximum(values) {
  return values.reduce((result, value) => Math.max(result, value), -Infinity);
}

function minimum(values) {
  return values.reduce((result, value) => Math.min(result, value), Infinity);
}

// ---------------------------------------------------------------------------
// 1. Prime-power arithmetic needed for Suzuki's explicit screw function.
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

const mangoldt = vonMangoldtValues(PRIME_LIMIT);
const weightedMangoldtPrefix = new Float64Array(PRIME_LIMIT + 1);
const logWeightedMangoldtPrefix = new Float64Array(PRIME_LIMIT + 1);
for (let n = 1; n <= PRIME_LIMIT; n++) {
  const weight = mangoldt[n] / Math.sqrt(n);
  weightedMangoldtPrefix[n] = weightedMangoldtPrefix[n - 1] + weight;
  logWeightedMangoldtPrefix[n] =
    logWeightedMangoldtPrefix[n - 1] + weight * Math.log(n);
}

function lerchQuarter(t) {
  if (t === 0) return LERCH_AT_ZERO;
  const ratio = Math.exp(-2 * t);
  let power = 1;
  let result = 0;

  for (let n = 0; n < 1_000_000; n++) {
    const term = power / (n + 0.25) ** 2;
    result += term;
    if (term < 1e-15 * Math.max(1, result)) return result;
    power *= ratio;
  }
  throw new Error(`Hurwitz-Lerch sum did not converge at t=${t}`);
}

/**
 * The arithmetic Riemann screw potential Psi(t), defined without using zero
 * locations. Formula: Suzuki, arXiv:2206.03682, equation (1.1).
 */
function arithmeticPsi(input) {
  const t = Math.abs(input);
  if (t < 1e-14) return 0;
  assert.ok(t <= T_MAX, `Psi sample ${t} exceeds sieve range ${T_MAX}`);

  const cutoff = Math.min(PRIME_LIMIT, Math.floor(Math.exp(t) + 1e-12));
  const primeHinges =
    t * weightedMangoldtPrefix[cutoff] - logWeightedMangoldtPrefix[cutoff];
  const elementary = 4 * (Math.exp(t / 2) + Math.exp(-t / 2) - 2);
  const linear = t * ARCHIMEDEAN_LINEAR / 2;
  const lerch =
    (LERCH_AT_ZERO - Math.exp(-t / 2) * lerchQuarter(t)) / 4;

  return elementary - primeHinges + linear + lerch;
}

// G_g for g=-Psi. Under RH this is a Gram kernel of stationary increments.
function arithmeticScrewKernel(t, u) {
  return arithmeticPsi(t) + arithmeticPsi(u) - arithmeticPsi(t - u);
}

function realLdlPivots(matrix) {
  const size = matrix.length;
  const lower = Array.from({ length: size }, () => new Float64Array(size));
  const pivots = [];

  for (let row = 0; row < size; row++) {
    lower[row][row] = 1;
    let pivot = matrix[row][row];
    for (let k = 0; k < row; k++) {
      pivot -= lower[row][k] ** 2 * pivots[k];
    }
    pivots.push(pivot);

    for (let next = row + 1; next < size; next++) {
      let value = matrix[next][row];
      for (let k = 0; k < row; k++) {
        value -= lower[next][k] * pivots[k] * lower[row][k];
      }
      lower[next][row] = value / pivot;
    }
  }
  return pivots;
}

const screwPointSets = [
  [0.1, 0.3, 0.6, 0.9],
  [0.2, 0.8, 1.5, 2.5, 4.0],
  [0.3, 1.0, 3.0, 6.0, 9.0],
  [-4.0, -2.0, -0.5, 0.7, 2.0, 5.0]
];

const screwMatrixChecks = screwPointSets.map((points) => {
  const matrix = points.map((t) => points.map((u) => arithmeticScrewKernel(t, u)));
  const pivots = realLdlPivots(matrix);
  assert.ok(pivots.every((pivot) => pivot > 0));
  return { points, ldlPivots: pivots, minimumPivot: minimum(pivots) };
});

const psiGrid = Array.from({ length: 600 }, (_, index) => {
  const t = T_MAX * (index + 1) / 600;
  return { t, psi: arithmeticPsi(t) };
});
const minimumPsiGridPoint = psiGrid.reduce((best, item) =>
  item.psi < best.psi ? item : best
);
assert.ok(minimumPsiGridPoint.psi > 0);

const psiCheckpoints = [0, 0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 4, 6, 8, 10, 12]
  .map((t) => ({ t, psi: arithmeticPsi(t) }));

// Between prime-power events, the prime contribution is linear and Psi has
// the same second derivative as its archimedean reservoir. In x=exp(t),
// A''(t)=(x^3-x-1)/(sqrt(x)*(x^2-1)); it is positive after the plastic
// constant, which lies below the first event x=2. Thus every later interval
// has at most one interior minimiser.
const PLASTIC_CONSTANT = 1.324717957244746;
close(
  PLASTIC_CONSTANT ** 3,
  PLASTIC_CONSTANT + 1,
  2e-15,
  "plastic-constant identity"
);
assert.ok(PLASTIC_CONSTANT < 2);

function archimedeanDerivative(t) {
  let series = 0;
  for (let m = 0; m < 1_000_000; m++) {
    const frequency = 2 * m + 0.5;
    const term = Math.exp(-frequency * t) / frequency;
    series += term;
    if (term < 1e-15 * Math.max(1, Math.abs(series))) break;
  }
  return 2 * (Math.exp(t / 2) - Math.exp(-t / 2))
    + ARCHIMEDEAN_LINEAR / 2 + series;
}

function archimedeanSecondDerivative(t) {
  const x = Math.exp(t);
  return (x ** 3 - x - 1) / (Math.sqrt(x) * (x * x - 1));
}

assert.ok(archimedeanSecondDerivative(Math.log(2)) > 0);

const primePowerEvents = [];
for (let n = 2; n <= PRIME_LIMIT; n++) {
  if (mangoldt[n] > 0) primePowerEvents.push(n);
}

const minimizerTypeCounts = { left: 0, right: 0, interior: 0 };
const intervalMinima = [];
for (let index = 0; index < primePowerEvents.length; index++) {
  const current = primePowerEvents[index];
  const left = Math.log(current);
  if (left >= T_MAX) break;
  const following = primePowerEvents[index + 1] ?? Math.exp(T_MAX);
  const right = Math.min(T_MAX, Math.log(following));
  const activePrimeSlope = weightedMangoldtPrefix[current];
  const leftDerivative = archimedeanDerivative(left) - activePrimeSlope;
  const rightDerivative = archimedeanDerivative(right) - activePrimeSlope;

  let minimizer;
  let type;
  if (leftDerivative >= 0) {
    minimizer = left;
    type = "left";
  } else if (rightDerivative <= 0) {
    minimizer = right;
    type = "right";
  } else {
    let low = left;
    let high = right;
    for (let iteration = 0; iteration < 60; iteration++) {
      const middle = (low + high) / 2;
      if (archimedeanDerivative(middle) - activePrimeSlope < 0) low = middle;
      else high = middle;
    }
    minimizer = (low + high) / 2;
    type = "interior";
  }

  minimizerTypeCounts[type]++;
  intervalMinima.push({
    leftPrimePower: current,
    rightPrimePower: following,
    minimizer,
    minimizerExp: Math.exp(minimizer),
    type,
    psi: arithmeticPsi(minimizer)
  });
}

const minimumPrimePowerInterval = intervalMinima.reduce((best, item) =>
  item.psi < best.psi ? item : best
);
assert.ok(intervalMinima.every((item) => item.psi > 0));

// ---------------------------------------------------------------------------
// 2. Independent real evaluation of H(s)=xi'(s)/xi(s), s>1.
// ---------------------------------------------------------------------------

function digamma(value) {
  let x = value;
  let recurrence = 0;
  while (x < 8) {
    recurrence -= 1 / x;
    x += 1;
  }
  const inverse = 1 / x;
  const inverseSquared = inverse * inverse;
  return recurrence + Math.log(x) - inverse / 2 - inverseSquared * (
    1 / 12 - inverseSquared * (
      1 / 120 - inverseSquared * (1 / 252 - inverseSquared / 240)
    )
  );
}

// Euler transforms eta and eta' simultaneously, then converts to zeta'/zeta.
function zetaLogDerivative(value, terms = 120) {
  const etaDifferences = Array.from({ length: terms }, (_, index) =>
    (index + 1) ** (-value)
  );
  const derivativeDifferences = Array.from({ length: terms }, (_, index) =>
    -Math.log(index + 1) * (index + 1) ** (-value)
  );
  let eta = 0;
  let etaDerivative = 0;
  let weight = 0.5;

  for (let order = 0; order < terms; order++) {
    eta += weight * etaDifferences[0];
    etaDerivative += weight * derivativeDifferences[0];
    for (let index = 0; index < terms - order - 1; index++) {
      etaDifferences[index] -= etaDifferences[index + 1];
      derivativeDifferences[index] -= derivativeDifferences[index + 1];
    }
    weight *= 0.5;
  }

  const power = 2 ** (1 - value);
  const denominator = 1 - power;
  const denominatorDerivative = Math.log(2) * power;
  return etaDerivative / eta - denominatorDerivative / denominator;
}

function xiLogDerivativeReal(value) {
  return 1 / value + 1 / (value - 1) - Math.log(PI) / 2
    + digamma(value / 2) / 2 + zetaLogDerivative(value);
}

function truncatedPrimeLogDerivative(value) {
  let result = 0;
  for (let n = 2; n <= PRIME_LIMIT; n++) {
    if (mangoldt[n] !== 0) result -= mangoldt[n] * n ** (-value);
  }
  return result;
}

const primeSeriesChecks = [1.5, 2, 2.5, 3, 4.5].map((s) => {
  const finitePrimeSeries = truncatedPrimeLogDerivative(s);
  const continuedValue = zetaLogDerivative(s);
  return {
    s,
    finitePrimeSeries,
    continuedValue,
    truncationDifference: Math.abs(finitePrimeSeries - continuedValue)
  };
});
assert.ok(primeSeriesChecks.slice(1).every((item) => item.truncationDifference < 1e-5));

// ---------------------------------------------------------------------------
// 3. Numerically verify H(1/2+w)=w^2 Laplace[Psi](w).
// ---------------------------------------------------------------------------

function simpsonLaplacePsi(w, upper = T_MAX, intervals = 2400) {
  assert.equal(intervals % 2, 0);
  const step = upper / intervals;
  let sum = arithmeticPsi(0) + arithmeticPsi(upper) * Math.exp(-w * upper);
  for (let index = 1; index < intervals; index++) {
    const t = index * step;
    sum += (index % 2 === 0 ? 2 : 4) * arithmeticPsi(t) * Math.exp(-w * t);
  }
  return step * sum / 3;
}

const laplaceParameters = [1.5, 2, 3];
const laplaceChecks = laplaceParameters.map((w) => {
  const transformed = w * w * simpsonLaplacePsi(w);
  const target = xiLogDerivativeReal(0.5 + w);
  return {
    w,
    transformed,
    target,
    absoluteDifference: Math.abs(transformed - target)
  };
});
assert.ok(laplaceChecks.every((item) => item.absoluteDifference < 2e-5));

// The double Laplace identity follows algebraically from the one-sided
// transforms. We use independently quadrature-computed transforms here.
const laplaceByW = new Map(laplaceChecks.map((item) => [item.w, item.transformed]));
const doubleLaplacePairs = [[1.5, 2], [1.5, 3], [2, 3]];
const doubleLaplaceChecks = doubleLaplacePairs.map(([w, v]) => {
  const transformedHAtW = laplaceByW.get(w);
  const transformedHAtV = laplaceByW.get(v);
  const laplaceG =
    (transformedHAtW + transformedHAtV) / (w * v * (w + v));
  const transformedKernel = w * v * laplaceG;
  const targetKernel =
    (xiLogDerivativeReal(0.5 + w) + xiLogDerivativeReal(0.5 + v)) / (w + v);
  return {
    w,
    v,
    transformedKernel,
    targetKernel,
    absoluteDifference: Math.abs(transformedKernel - targetKernel)
  };
});
assert.ok(doubleLaplaceChecks.every((item) => item.absoluteDifference < 2e-5));

// ---------------------------------------------------------------------------
// 4. Kappa normalisation and an exact bounded-transform obstruction.
// ---------------------------------------------------------------------------

const firstCuspEigenvalue = 4 * PI * PI;
close(KAPPA_R * firstCuspEigenvalue, 1, 1e-15, "kappa cusp normalisation");

// Apery's constant, used only to display the uniform diagonal bound of K_kappa.
const APERY = 1.2020569031595942854;
const kappaDiagonalBoundaryBound = KAPPA_R * APERY;
const firstZeroOrdinate = 14.134725141734693;
const firstNormalisedZeroFrequency = firstZeroOrdinate / (2 * PI);
close(
  KAPPA_R / firstNormalisedZeroFrequency ** 2,
  1 / firstZeroOrdinate ** 2,
  1e-15,
  "normalised inverse-square zero weight"
);

const result = {
  analysisDate: "2026-10-14",
  title: "Transforming the RSS kappa kernel toward the xi Pick kernel",
  verdict: {
    exactTransformFound: true,
    rhProof: false,
    statement: "the arithmetic screw kernel maps exactly to K_xi by a double Laplace congruence",
    unconditionalDomain: "Re(s)>1 and Re(t)>1",
    missingExtension: "prove the arithmetic screw kernel positive semidefinite on every real window; this is equivalent to RH"
  },
  sourceKernel: {
    formula: "K_kappa(s,t)=kappa_R*zeta(s+conj(t)+2)",
    feature: "v_s(n)=sqrt(kappa_R)*n^(-s-1)",
    verticalScrewFeature: "X_sigma(t;n)=sqrt(kappa_R)*n^(-sigma-1)*exp(-i*t*log(n))",
    interpretation: "K_kappa already generates a stationary-increment screw line, but with log-integer frequencies and smoothed positive weights"
  },
  exactArithmeticDeformation: {
    potential: "Psi(t), defined from prime-power hinges plus elementary, digamma and Hurwitz-Lerch archimedean terms",
    signConvention: "g(t)=-Psi(t)",
    screwKernel: "G_g(x,y)=Psi(x)+Psi(y)-Psi(x-y)",
    oneSidedTransform: "H(1/2+w)=w^2*integral_0^infinity Psi(x)exp(-w*x)dx",
    doubleTransform: "K_xi(s,t)=(s-1/2)(conj(t)-1/2)*double_integral G_g(x,y)exp(-(s-1/2)x-(conj(t)-1/2)y)dxdy",
    unconditionalConvergence: "Re(s),Re(t)>1",
    targetConvergence: "Re(s),Re(t)>1/2 follows from global screw positivity/RH, not from analytic continuation alone"
  },
  kappaRole: {
    value: KAPPA_R,
    identity: "kappa_R=(2*pi)^(-2)",
    firstCuspEigenvalue,
    normalisedZeroFrequency: "q_gamma=gamma/(2*pi)",
    conditionalPotential: "Psi(t)=kappa_R*sum_gamma (1-cos(2*pi*q_gamma*t))/q_gamma^2",
    conditionalFeature: "sqrt(kappa_R)*(exp(2*pi*i*q_gamma*t)-1)/q_gamma",
    firstZeroOrdinate,
    firstNormalisedZeroFrequency,
    firstInverseSquareWeight: 1 / firstZeroOrdinate ** 2
  },
  finiteDiagnostics: {
    primeLimit: PRIME_LIMIT,
    tMax: T_MAX,
    psiCheckpoints,
    psiGridCount: psiGrid.length,
    minimumPsiGridPoint,
    allSampledPsiPositive: psiGrid.every((item) => item.psi > 0),
    intervalConvexity: {
      plasticConstant: PLASTIC_CONSTANT,
      convexityThreshold: Math.log(PLASTIC_CONSTANT),
      firstPrimePowerEvent: 2,
      archimedeanSecondDerivativeAtLog2: archimedeanSecondDerivative(Math.log(2)),
      formula: "A''(log x)=(x^3-x-1)/(sqrt(x)*(x^2-1))"
    },
    primePowerIntervalsChecked: intervalMinima.length,
    minimizerTypeCounts,
    minimumPrimePowerInterval,
    allCheckedIntervalMinimaPositive: intervalMinima.every((item) => item.psi > 0),
    screwMatrixChecks,
    primeSeriesChecks,
    laplaceChecks,
    maximumLaplaceDifference: maximum(laplaceChecks.map((item) => item.absoluteDifference)),
    doubleLaplaceChecks,
    maximumDoubleLaplaceDifference: maximum(doubleLaplaceChecks.map((item) => item.absoluteDifference)),
    limitation: "finite samples and truncated quadrature cannot establish global screw positivity"
  },
  boundedTransformNoGo: {
    sourceDiagonal: "K_kappa(s,s)=kappa_R*zeta(2*Re(s)+2)<=kappa_R*zeta(3) for Re(s)>=1/2",
    sourceDiagonalBound: kappaDiagonalBoundaryBound,
    targetBoundaryBehaviour: "at a critical-line zero rho of multiplicity m, K_xi(rho+epsilon,rho+epsilon) is asymptotic to m/epsilon^2",
    conclusion: "no single bounded feature operator T can satisfy K_xi(s,t)=<T v_t,T v_s> on the full half-plane; the necessary inverse-Green/arithmetic transform is unbounded or changes the feature space"
  },
  exactRemainingTheorem: {
    name: "RSS arithmetic screw-line theorem",
    statement: "construct from primitive return data a Hilbert-space path X(t) with <X(x)-X(0),X(y)-X(0)>=Psi(x)+Psi(y)-Psi(x-y) for all real x,y",
    equivalentScalarTarget: "Psi(t)>=0 for every real t",
    consequence: "the double Laplace congruence makes K_xi positive semidefinite throughout Re(s)>1/2 and proves RH",
    currentStatus: "not proved"
  }
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);

console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
console.log(`Evaluated the arithmetic screw potential through t=${T_MAX} using prime powers through ${PRIME_LIMIT}.`);
console.log(`Checked ${psiGrid.length} positive Psi samples and ${screwMatrixChecks.length} positive finite screw matrices.`);
console.log(`Used strict inter-event convexity to check ${intervalMinima.length} prime-power interval minima; the smallest sampled value was ${minimumPrimePowerInterval.psi.toExponential(3)}.`);
console.log(`Verified the one-sided and double Laplace transforms with maximum differences ${result.finiteDiagnostics.maximumLaplaceDifference.toExponential(3)} and ${result.finiteDiagnostics.maximumDoubleLaplaceDifference.toExponential(3)}.`);
console.log("Exact route found: arithmetic screw kernel -> double Laplace congruence -> K_xi.");
console.log("No RH proof: global arithmetic screw positivity is precisely the unresolved theorem.");
