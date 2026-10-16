#!/usr/bin/env node
/**
 * Seventh-stage RSS/RH investigation.
 *
 * Question: can TTI's second Möbius inversion be made into an adjoint or
 * dual completion of arithmetic primitive extraction, and does that completion
 * equal the Riemann Weil/screw form rather than merely returning to the
 * all-integer repetition ledger?
 *
 * The calculation distinguishes:
 *   - divisor Möbius extraction M;
 *   - its inverse divisor summation Z=M^{-1};
 *   - a literal second extraction M^2;
 *   - the adjoint completion M^* G M;
 *   - the canonical two-face involution P=[[0,Z],[M,0]].
 *
 * Finite numerical comparisons are diagnostics. The structural conclusions
 * (M^2 != I, ZM=I, the block involution, and the small-t regularity mismatch)
 * are algebraic/analytic and do not rely on those finite samples.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/rh/rss-double-mobius-completion-results.json");
const PI = Math.PI;
const KAPPA_R = 1 / (4 * PI * PI);
const EULER_GAMMA = 0.5772156649015329;
const CATALAN = 0.91596559417721901505;
const DIGAMMA_QUARTER = -EULER_GAMMA - PI / 2 - 3 * Math.log(2);
const LERCH_AT_ZERO = PI * PI + 8 * CATALAN;
const ARCHIMEDEAN_LINEAR = DIGAMMA_QUARTER - Math.log(PI);
const FEATURE_SIGMA = 0.75;
const MAX_N = 8192;
const MATRIX_N = 24;
const TARGET_POINTS = [0.2, 0.8, 1.5, 2.5, 4.0];
const TRUNCATIONS = [128, 256, 512, 1024, 2048, 4096, 8192];

function close(actual, expected, tolerance, label) {
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  assert.ok(
    Math.abs(actual - expected) <= tolerance * scale,
    `${label}: expected ${actual} to equal ${expected} within ${tolerance}`
  );
}

function maximumAbsolute(values) {
  let result = 0;
  for (const value of values) result = Math.max(result, Math.abs(value));
  return result;
}

function mobiusValues(limit) {
  const mu = new Int8Array(limit + 1);
  const primes = [];
  const composite = new Uint8Array(limit + 1);
  mu[1] = 1;
  for (let n = 2; n <= limit; n++) {
    if (!composite[n]) {
      primes.push(n);
      mu[n] = -1;
    }
    for (const prime of primes) {
      const product = n * prime;
      if (product > limit) break;
      composite[product] = 1;
      if (n % prime === 0) {
        mu[product] = 0;
        break;
      }
      mu[product] = -mu[n];
    }
  }
  return mu;
}

const mu = mobiusValues(MAX_N);

// (Ma)(n)=(mu*a)(n)=sum_{d|n}mu(d)a(n/d).
function mobiusTransform(input, limit = input.length - 1) {
  const output = new Float64Array(limit + 1);
  for (let d = 1; d <= limit; d++) {
    if (mu[d] === 0) continue;
    for (let k = 1; d * k <= limit; k++) {
      output[d * k] += mu[d] * input[k];
    }
  }
  return output;
}

// (Za)(n)=(1*a)(n)=sum_{d|n}a(d), the inverse of M.
function divisorSumTransform(input, limit = input.length - 1) {
  const output = new Float64Array(limit + 1);
  for (let d = 1; d <= limit; d++) {
    for (let multiple = d; multiple <= limit; multiple += d) {
      output[multiple] += input[d];
    }
  }
  return output;
}

function featureParts(x, limit = MAX_N) {
  const re = new Float64Array(limit + 1);
  const im = new Float64Array(limit + 1);
  for (let n = 1; n <= limit; n++) {
    const logn = Math.log(n);
    const amplitude = n ** (-FEATURE_SIGMA);
    re[n] = amplitude * (Math.cos(x * logn) - 1);
    im[n] = -amplitude * Math.sin(x * logn);
  }
  return { re, im };
}

function applyMobiusToParts(parts, limit = MAX_N) {
  return {
    re: mobiusTransform(parts.re, limit),
    im: mobiusTransform(parts.im, limit)
  };
}

function applyDivisorSumToParts(parts, limit = MAX_N) {
  return {
    re: divisorSumTransform(parts.re, limit),
    im: divisorSumTransform(parts.im, limit)
  };
}

function realGramEntry(left, right, limit, weight) {
  let result = 0;
  for (let n = 1; n <= limit; n++) {
    result += weight(n) * (
      left.re[n] * right.re[n] + left.im[n] * right.im[n]
    );
  }
  return result;
}

const greenWeight = (n) => KAPPA_R / (n * n);
const unitWeight = () => 1;

function gramMatrix(features, limit, weight) {
  return features.map((left) =>
    features.map((right) => realGramEntry(left, right, limit, weight))
  );
}

function matrixDot(left, right) {
  let result = 0;
  for (let row = 0; row < left.length; row++) {
    for (let column = 0; column < left.length; column++) {
      result += left[row][column] * right[row][column];
    }
  }
  return result;
}

function matrixNorm(matrix) {
  return Math.sqrt(matrixDot(matrix, matrix));
}

function subtractMatrices(left, right) {
  return left.map((row, i) => row.map((value, j) => value - right[i][j]));
}

function scaleMatrix(matrix, scalar) {
  return matrix.map((row) => row.map((value) => scalar * value));
}

function matrixFit(candidate, target) {
  const directResidual = matrixNorm(subtractMatrices(candidate, target)) / matrixNorm(target);
  const denominator = matrixDot(candidate, candidate);
  const bestScale = denominator === 0 ? 0 : matrixDot(candidate, target) / denominator;
  const fittedResidual = matrixNorm(
    subtractMatrices(scaleMatrix(candidate, bestScale), target)
  ) / matrixNorm(target);
  return { directResidual, bestScale, fittedResidual };
}

function realLdlPivots(matrix) {
  const size = matrix.length;
  const lower = Array.from({ length: size }, () => new Float64Array(size));
  const pivots = [];
  for (let row = 0; row < size; row++) {
    lower[row][row] = 1;
    let pivot = matrix[row][row];
    for (let k = 0; k < row; k++) pivot -= lower[row][k] ** 2 * pivots[k];
    pivots.push(pivot);
    if (Math.abs(pivot) < 1e-18) continue;
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

// ---------------------------------------------------------------------------
// 1. Finite divisor operators and the canonical two-face involution.
// ---------------------------------------------------------------------------

function mobiusMatrix(size) {
  return Array.from({ length: size }, (_, rowIndex) => {
    const n = rowIndex + 1;
    const row = new Float64Array(size);
    for (let divisor = 1; divisor <= n; divisor++) {
      if (n % divisor === 0) row[divisor - 1] = mu[n / divisor];
    }
    return row;
  });
}

function divisorSumMatrix(size) {
  return Array.from({ length: size }, (_, rowIndex) => {
    const n = rowIndex + 1;
    const row = new Float64Array(size);
    for (let divisor = 1; divisor <= n; divisor++) {
      if (n % divisor === 0) row[divisor - 1] = 1;
    }
    return row;
  });
}

function identityMatrix(size) {
  return Array.from({ length: size }, (_, row) => {
    const values = new Float64Array(size);
    values[row] = 1;
    return values;
  });
}

function transpose(matrix) {
  return Array.from({ length: matrix[0].length }, (_, row) =>
    Float64Array.from(matrix, (source) => source[row])
  );
}

function multiplyMatrices(left, right) {
  const rows = left.length;
  const inner = right.length;
  const columns = right[0].length;
  const output = Array.from({ length: rows }, () => new Float64Array(columns));
  for (let row = 0; row < rows; row++) {
    for (let k = 0; k < inner; k++) {
      if (left[row][k] === 0) continue;
      for (let column = 0; column < columns; column++) {
        output[row][column] += left[row][k] * right[k][column];
      }
    }
  }
  return output;
}

function blockMatrix(topLeft, topRight, bottomLeft, bottomRight) {
  const topRows = topLeft.length;
  const bottomRows = bottomLeft.length;
  const leftColumns = topLeft[0].length;
  const rightColumns = topRight[0].length;
  const output = [];
  for (let row = 0; row < topRows; row++) {
    output.push(Float64Array.from([...topLeft[row], ...topRight[row]]));
  }
  for (let row = 0; row < bottomRows; row++) {
    output.push(Float64Array.from([...bottomLeft[row], ...bottomRight[row]]));
  }
  assert.equal(output[0].length, leftColumns + rightColumns);
  return output;
}

function zeroMatrix(rows, columns) {
  return Array.from({ length: rows }, () => new Float64Array(columns));
}

function maximumMatrixError(left, right) {
  let result = 0;
  for (let row = 0; row < left.length; row++) {
    for (let column = 0; column < left[0].length; column++) {
      result = Math.max(result, Math.abs(left[row][column] - right[row][column]));
    }
  }
  return result;
}

const M = mobiusMatrix(MATRIX_N);
const Z = divisorSumMatrix(MATRIX_N);
const I = identityMatrix(MATRIX_N);
const MZ = multiplyMatrices(M, Z);
const ZM = multiplyMatrices(Z, M);
const M2 = multiplyMatrices(M, M);
assert.equal(maximumMatrixError(MZ, I), 0);
assert.equal(maximumMatrixError(ZM, I), 0);
assert.ok(maximumMatrixError(M2, I) >= 1);

const zeros = zeroMatrix(MATRIX_N, MATRIX_N);
const P = blockMatrix(zeros, Z, M, zeros);
const P2 = multiplyMatrices(P, P);
const I2 = identityMatrix(2 * MATRIX_N);
assert.equal(maximumMatrixError(P2, I2), 0);

// The transported positive metric diag(I,Z^T Z) makes P an isometry.
const ZtZ = multiplyMatrices(transpose(Z), Z);
const transportedMetric = blockMatrix(I, zeros, zeros, ZtZ);
const metricAfterP = multiplyMatrices(
  transpose(P),
  multiplyMatrices(transportedMetric, P)
);
assert.equal(maximumMatrixError(metricAfterP, transportedMetric), 0);
const euclideanAfterP = multiplyMatrices(transpose(P), P);
const euclideanOrthogonalityDefect = maximumMatrixError(euclideanAfterP, I2);
assert.ok(euclideanOrthogonalityDefect > 0);

// ---------------------------------------------------------------------------
// 2. Feature-space consequences of inverse, repeated and adjoint completion.
// ---------------------------------------------------------------------------

const baseFeatures = TARGET_POINTS.map((point) => featureParts(point));
const primitiveFeatures = baseFeatures.map((parts) => applyMobiusToParts(parts));
const repeatedFeatures = primitiveFeatures.map((parts) => applyMobiusToParts(parts));
const returnedFeatures = primitiveFeatures.map((parts) => applyDivisorSumToParts(parts));

let maximumReturnFeatureError = 0;
for (let point = 0; point < baseFeatures.length; point++) {
  for (let n = 1; n <= MAX_N; n++) {
    maximumReturnFeatureError = Math.max(
      maximumReturnFeatureError,
      Math.abs(baseFeatures[point].re[n] - returnedFeatures[point].re[n]),
      Math.abs(baseFeatures[point].im[n] - returnedFeatures[point].im[n])
    );
  }
}
assert.ok(maximumReturnFeatureError < 1e-12);

const rawPrimitiveGrowthFeature = applyMobiusToParts(featureParts(1));
let rawPrefix = 0;
let greenPrefix = 0;
const rawPrimitiveNormGrowth = [];
for (let n = 1; n <= MAX_N; n++) {
  const squared = rawPrimitiveGrowthFeature.re[n] ** 2
    + rawPrimitiveGrowthFeature.im[n] ** 2;
  rawPrefix += squared;
  greenPrefix += greenWeight(n) * squared;
  if (TRUNCATIONS.includes(n)) {
    rawPrimitiveNormGrowth.push({ n, rawNormSquared: rawPrefix, greenNormSquared: greenPrefix });
  }
}
assert.ok(
  rawPrimitiveNormGrowth.at(-1).rawNormSquared
    > 2 * rawPrimitiveNormGrowth[0].rawNormSquared,
  "unweighted primitive-extraction norm should show growth"
);

// ---------------------------------------------------------------------------
// 3. Suzuki target kernel, computed from the explicit prime-power formula.
// ---------------------------------------------------------------------------

function vonMangoldtValues(limit) {
  const values = new Float64Array(limit + 1);
  const prime = new Uint8Array(limit + 1);
  prime.fill(1, 2);
  for (let p = 2; p * p <= limit; p++) {
    if (!prime[p]) continue;
    for (let multiple = p * p; multiple <= limit; multiple += p) prime[multiple] = 0;
  }
  for (let p = 2; p <= limit; p++) {
    if (!prime[p]) continue;
    for (let power = p; power <= limit;) {
      values[power] = Math.log(p);
      if (power > Math.floor(limit / p)) break;
      power *= p;
    }
  }
  return values;
}

const PSI_LIMIT = Math.ceil(Math.exp(Math.max(...TARGET_POINTS))) + 10;
const mangoldt = vonMangoldtValues(PSI_LIMIT);
const weightedMangoldtPrefix = new Float64Array(PSI_LIMIT + 1);
const logWeightedMangoldtPrefix = new Float64Array(PSI_LIMIT + 1);
for (let n = 1; n <= PSI_LIMIT; n++) {
  const weight = mangoldt[n] / Math.sqrt(n);
  weightedMangoldtPrefix[n] = weightedMangoldtPrefix[n - 1] + weight;
  logWeightedMangoldtPrefix[n] = logWeightedMangoldtPrefix[n - 1]
    + weight * Math.log(n);
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

function arithmeticPsi(input) {
  const t = Math.abs(input);
  if (t < 1e-14) return 0;
  const cutoff = Math.min(PSI_LIMIT, Math.floor(Math.exp(t) + 1e-12));
  const primeHinges = t * weightedMangoldtPrefix[cutoff]
    - logWeightedMangoldtPrefix[cutoff];
  const elementary = 4 * (Math.exp(t / 2) + Math.exp(-t / 2) - 2);
  const linear = t * ARCHIMEDEAN_LINEAR / 2;
  const lerch = (LERCH_AT_ZERO - Math.exp(-t / 2) * lerchQuarter(t)) / 4;
  return elementary - primeHinges + linear + lerch;
}

function arithmeticScrewKernel(t, u) {
  return arithmeticPsi(t) + arithmeticPsi(u) - arithmeticPsi(t - u);
}

const targetScrewMatrix = TARGET_POINTS.map((t) =>
  TARGET_POINTS.map((u) => arithmeticScrewKernel(t, u))
);
const targetPivots = realLdlPivots(targetScrewMatrix);
assert.ok(targetPivots.every((pivot) => pivot > 0));

const completionComparisons = TRUNCATIONS.map((n) => {
  const returned = gramMatrix(returnedFeatures, n, greenWeight);
  const original = gramMatrix(baseFeatures, n, greenWeight);
  const primitiveAdjoint = gramMatrix(primitiveFeatures, n, greenWeight);
  const repeated = gramMatrix(repeatedFeatures, n, greenWeight);
  const returnError = matrixNorm(subtractMatrices(returned, original));
  return {
    n,
    inverseReturnError: returnError,
    originalLedgerFit: matrixFit(original, targetScrewMatrix),
    primitiveAdjointFit: matrixFit(primitiveAdjoint, targetScrewMatrix),
    repeatedExtractionFit: matrixFit(repeated, targetScrewMatrix),
    originalMinimumPivot: Math.min(...realLdlPivots(original)),
    primitiveAdjointMinimumPivot: Math.min(...realLdlPivots(primitiveAdjoint)),
    repeatedMinimumPivot: Math.min(...realLdlPivots(repeated))
  };
});
assert.ok(completionComparisons.every((entry) => entry.inverseReturnError < 1e-12));

// ---------------------------------------------------------------------------
// 4. Exact local regularity discriminator at t=0.
// ---------------------------------------------------------------------------

// For 0<t<log(2), Suzuki's derivative has no prime event. Isolate the
// integrable logarithmic singularity in atanh(exp(-t/2)) to compute Psi.
const NO_PRIME_CONSTANT = PI / 4
  - (EULER_GAMMA + 3 * Math.log(2) + Math.log(PI)) / 2;

function yCothY(y) {
  if (Math.abs(y) < 1e-4) {
    const square = y * y;
    return 1 + square / 3 - square * square / 45;
  }
  return y / Math.tanh(y);
}

function regularNoPrimeDerivative(t) {
  const y = t / 4;
  return 2 * (Math.exp(t / 2) - Math.exp(-t / 2))
    + NO_PRIME_CONSTANT
    - Math.atan(Math.exp(t / 2))
    + 0.5 * Math.log(yCothY(y));
}

function simpsonIntegral(fn, upper, panels = 1000) {
  if (panels % 2 !== 0) panels++;
  const step = upper / panels;
  let result = fn(0) + fn(upper);
  for (let index = 1; index < panels; index++) {
    result += (index % 2 === 0 ? 2 : 4) * fn(index * step);
  }
  return result * step / 3;
}

function noPrimePsi(t) {
  assert.ok(t > 0 && t < Math.log(2));
  const singularIntegral = 0.5 * t * (Math.log(4 / t) + 1);
  return singularIntegral + simpsonIntegral(regularNoPrimeDerivative, t);
}

close(noPrimePsi(0.2), arithmeticPsi(0.2), 2e-11, "small-t Psi representation");

const smallTValues = [0.1, 0.03, 0.01, 0.003, 0.001];
const smallTDiscriminator = smallTValues.map((t) => {
  const feature = featureParts(t);
  const primitive = applyMobiusToParts(feature);
  const sourceDiagonal = realGramEntry(feature, feature, MAX_N, greenWeight);
  const dualDiagonal = realGramEntry(primitive, primitive, MAX_N, greenWeight);
  const targetDiagonal = 2 * noPrimePsi(t);
  return {
    t,
    targetDiagonal,
    targetOverTLogInverseT: targetDiagonal / (t * Math.log(1 / t)),
    targetOverTSquared: targetDiagonal / (t * t),
    sourceDiagonal,
    sourceOverTSquared: sourceDiagonal / (t * t),
    greenDualDiagonal: dualDiagonal,
    greenDualOverTSquared: dualDiagonal / (t * t)
  };
});
assert.ok(
  smallTDiscriminator.at(-1).targetOverTSquared
    > 10 * smallTDiscriminator[0].targetOverTSquared,
  "target cusp must separate from quadratic Gram regularity"
);

// ---------------------------------------------------------------------------
// 5. Returning to a combined-argument ledger does not equal K_xi.
// ---------------------------------------------------------------------------

function digamma(x) {
  let value = 0;
  while (x < 10) {
    value -= 1 / x;
    x += 1;
  }
  const inverse = 1 / x;
  const inverse2 = inverse * inverse;
  return value + Math.log(x) - 0.5 * inverse
    - inverse2 / 12 + inverse2 ** 2 / 120
    - inverse2 ** 3 / 252 + inverse2 ** 4 / 240
    - 5 * inverse2 ** 5 / 660;
}

const LOG_DERIVATIVE_LIMIT = 1_000_000;
const mangoldtLarge = vonMangoldtValues(LOG_DERIVATIVE_LIMIT);

function xiLogDerivativeReal(s) {
  let zetaLogDerivative = 0;
  for (let n = 2; n <= LOG_DERIVATIVE_LIMIT; n++) {
    if (mangoldtLarge[n] !== 0) zetaLogDerivative -= mangoldtLarge[n] * n ** (-s);
  }
  return 1 / s + 1 / (s - 1) - 0.5 * Math.log(PI)
    + 0.5 * digamma(s / 2) + zetaLogDerivative;
}

function xiPickReal(s, t) {
  return (xiLogDerivativeReal(s) + xiLogDerivativeReal(t)) / (s + t - 1);
}

const equalSumPairs = [[2, 5], [3, 4]];
const equalSumPickValues = equalSumPairs.map(([s, t]) => ({ s, t, value: xiPickReal(s, t) }));
const equalSumPickDefect = Math.abs(equalSumPickValues[0].value - equalSumPickValues[1].value);
assert.ok(equalSumPickDefect > 1e-5);

// Every returned all-integer Dirichlet kernel F(s+t) has equal values on the
// two pairs because both sums are 7. K_xi demonstrably does not.

const results = {
  analysisDate: "2026-10-14",
  title: "TTI double Möbius inversion and Weil-completion test",
  verdict: {
    weilPositivityProved: false,
    secondInversionExistsAsExactBlockInvolution: true,
    inducesCanonicalWeilCompletion: false,
    conclusion: "the inverse second face returns the all-integer ledger; a literal second Mobius extraction is not an inverse; and the natural adjoint completion is either unbounded or, after Green regularisation, too smooth at t=0 to equal Suzuki's screw/Weil kernel"
  },
  operatorAlgebra: {
    convention: "M a=mu*a, Z a=1*a",
    matrixSize: MATRIX_N,
    maximumMZError: maximumMatrixError(MZ, I),
    maximumZMError: maximumMatrixError(ZM, I),
    maximumM2IdentityError: maximumMatrixError(M2, I),
    blockInvolution: "P=[[0,Z],[M,0]]",
    maximumP2IdentityError: maximumMatrixError(P2, I2),
    transportedMetric: "G=diag(I,Z^T Z)",
    maximumTransportedMetricInvarianceError: maximumMatrixError(metricAfterP, transportedMetric),
    euclideanOrthogonalityDefect,
    interpretation: "P is an exact two-face involution only after the primitive face receives the pullback metric; that metric transports the original norm and does not derive the Weil form"
  },
  featureTest: {
    sigma: FEATURE_SIGMA,
    maxN: MAX_N,
    points: TARGET_POINTS,
    maximumInverseReturnFeatureError: maximumReturnFeatureError,
    rawPrimitiveNormGrowth,
    statement: "the unweighted adjoint norm grows with truncation, while kappa/n^2 Green weighting regularises it"
  },
  screwComparison: {
    target: "G_g(t,u)=Psi(t)+Psi(u)-Psi(t-u)",
    targetLdlPivots: targetPivots,
    completionComparisons,
    warning: "finite matrix fits are diagnostics; non-equality is independently forced by the t=0 regularity mismatch"
  },
  localRegularityNoGo: {
    targetAsymptotic: "G_g(t,t)=2 Psi(t)=t log(1/t)+O(t)",
    boundedGreenGramAsymptotic: "D(t,t)=C t^2+o(t^2) when the differentiated feature has finite norm",
    smallTDiscriminator,
    conclusion: "a bounded or Green-regularised adjoint completion of the TTI log-integer path cannot equal G_g near the origin"
  },
  allIntegerReturnVsXiPick: {
    equalSumPairs,
    equalSumPickValues,
    equalSumPickDefect,
    combinedArgumentFact: "the returned ledger has the form F(s+conj(t)) and therefore agrees on equal-sum pairs",
    conclusion: "K_xi is not a combined-argument all-integer Dirichlet kernel"
  },
  remainingPossibleRoute: {
    requirement: "derive an additional nontrivial residue/cocycle channel B from TTI and prove W(f*tilde(f))=||Bf||^2 on the full admissible test space",
    recoveryForm: "equivalently derive C_q-J_q as a norm square at every recovery witness",
    warning: "choosing a pullback metric to force the target form is circular unless that metric is independently fixed by TTI"
  }
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(results, null, 2)}\n`);

console.log("TTI double Möbius/Weil completion investigation complete.");
console.log(`  MZ and ZM max error: ${results.operatorAlgebra.maximumMZError}`);
console.log(`  M^2 identity defect: ${results.operatorAlgebra.maximumM2IdentityError}`);
console.log(`  P^2 max error: ${results.operatorAlgebra.maximumP2IdentityError}`);
console.log(`  raw primitive norm at N=${MAX_N}: ${rawPrimitiveNormGrowth.at(-1).rawNormSquared}`);
console.log(`  green primitive norm at N=${MAX_N}: ${rawPrimitiveNormGrowth.at(-1).greenNormSquared}`);
console.log(`  equal-sum K_xi defect: ${equalSumPickDefect}`);
console.log("  Verdict: canonical second inversion returns the ledger; no Weil factorisation obtained.");
