#!/usr/bin/env node
/**
 * Exact and numerical checks for the projective RSS-to-modular derivation.
 *
 * No primes or zeta zeros are used to choose the state map. The modular
 * generators are built from a unit-integration update, a coordinate swap at
 * the seam, and the RSS mirror. Primes enter only in the final independent
 * check of the Euler factorisation of the cusp totient series.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/rh/rss-modular-closure-results.json");

const I = [[1n, 0n], [0n, 1n]];
const minusI = [[-1n, 0n], [0n, -1n]];
const T = [[1n, 1n], [0n, 1n]];     // (u,v) -> (u+v,v), x -> x+1
const R = [[0n, 1n], [1n, 0n]];     // (u,v) -> (v,u), x -> 1/x
const N = [[-1n, 0n], [0n, 1n]];    // (u,v) -> (-u,v), x -> -x

function matMul(left, right) {
  return [
    [left[0][0] * right[0][0] + left[0][1] * right[1][0],
      left[0][0] * right[0][1] + left[0][1] * right[1][1]],
    [left[1][0] * right[0][0] + left[1][1] * right[1][0],
      left[1][0] * right[0][1] + left[1][1] * right[1][1]]
  ];
}

function matPow(matrix, exponent) {
  let result = I;
  let base = matrix;
  let power = exponent;
  while (power > 0) {
    if (power % 2 === 1) result = matMul(result, base);
    base = matMul(base, base);
    power = Math.floor(power / 2);
  }
  return result;
}

function determinant(matrix) {
  return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

function matrixStrings(matrix) {
  return matrix.map((row) => row.map(String));
}

function gcd(a, b) {
  let left = a < 0n ? -a : a;
  let right = b < 0n ? -b : b;
  while (right !== 0n) [left, right] = [right, left % right];
  return left;
}

function fibonacci(n) {
  let a = 0n;
  let b = 1n;
  for (let index = 0; index < n; index++) [a, b] = [b, a + b];
  return a;
}

function gaussDigits(numerator, denominator) {
  if (!(0n < numerator && numerator < denominator)) {
    throw new Error("Gauss input must lie strictly between zero and one");
  }
  let p = numerator;
  let q = denominator;
  const digits = [];
  while (p !== 0n) {
    const digit = q / p;
    const remainder = q % p;
    digits.push(Number(digit));
    [p, q] = [remainder, p];
  }
  return digits;
}

function fractionFromDigits(digits) {
  let numerator = 0n;
  let denominator = 1n;
  for (let index = digits.length - 1; index >= 0; index--) {
    // y <- 1/(a+y) when y=numerator/denominator.
    [numerator, denominator] = [
      denominator,
      BigInt(digits[index]) * denominator + numerator
    ];
  }
  const divisor = gcd(numerator, denominator);
  return [numerator / divisor, denominator / divisor];
}

function totients(limit) {
  const phi = new Uint32Array(limit + 1);
  for (let n = 0; n <= limit; n++) phi[n] = n;
  for (let p = 2; p <= limit; p++) {
    if (phi[p] !== p) continue;
    for (let multiple = p; multiple <= limit; multiple += p) {
      phi[multiple] = Math.floor(phi[multiple] / p * (p - 1));
    }
  }
  if (limit >= 1) phi[1] = 1;
  return phi;
}

function primeSieve(limit) {
  const isPrime = new Uint8Array(limit + 1);
  isPrime.fill(1, 2);
  for (let p = 2; p * p <= limit; p++) {
    if (!isPrime[p]) continue;
    for (let multiple = p * p; multiple <= limit; multiple += p) isPrime[multiple] = 0;
  }
  return isPrime;
}

const S = matMul(N, R); // x -> -1/x, orientation-preserving modular inversion
const ST = matMul(S, T);
const groupChecks = {
  T: matrixStrings(T),
  R: matrixStrings(R),
  N: matrixStrings(N),
  S: matrixStrings(S),
  determinants: {
    T: determinant(T).toString(),
    R: determinant(R).toString(),
    N: determinant(N).toString(),
    S: determinant(S).toString()
  },
  R2: matrixStrings(matPow(R, 2)),
  N2: matrixStrings(matPow(N, 2)),
  S2: matrixStrings(matPow(S, 2)),
  ST3: matrixStrings(matPow(ST, 3)),
  projectiveRelations: {
    S2: "identity in PSL(2,Z), because S^2=-I",
    ST3: "identity in PSL(2,Z), because (ST)^3=-I",
    TOrder: "infinite"
  }
};

assert.deepEqual(matPow(R, 2), I);
assert.deepEqual(matPow(N, 2), I);
assert.deepEqual(matPow(S, 2), minusI);
assert.deepEqual(matPow(ST, 3), minusI);

// The inverse branch g_a(x)=1/(a+x) is represented by R T^a.
const branches = [];
for (let a = 1; a <= 10; a++) {
  const matrix = matMul(R, matPow(T, a));
  branches.push({
    digit: a,
    interval: `(1/${a + 1}, 1/${a}]`,
    inverseBranch: `g_${a}(x)=1/(${a}+x)`,
    matrix: matrixStrings(matrix),
    determinant: determinant(matrix).toString()
  });
}

// The digit-one inverse branch is conjugate to the Fibonacci adjacency matrix.
const A = [[1n, 1n], [1n, 0n]];
const B1 = matMul(R, T);
assert.deepEqual(matMul(matMul(R, A), R), B1);
const fibonacciMatrixPowers = [];
for (let n = 1; n <= 12; n++) {
  const power = matPow(A, n);
  const expected = [
    [fibonacci(n + 1), fibonacci(n)],
    [fibonacci(n), fibonacci(n - 1)]
  ];
  assert.deepEqual(power, expected);
  fibonacciMatrixPowers.push({ n, matrix: matrixStrings(power) });
}

const phi = (1 + Math.sqrt(5)) / 2;
const goldenFixedPoint = 1 / phi;
assert.ok(Math.abs(1 / (1 + goldenFixedPoint) - goldenFixedPoint) < 1e-15);

// Every primitive rational ledger state in (0,1) has a terminating Gauss word.
const MAX_DENOMINATOR = 32;
const rationalStates = [];
const firstDigits = new Set();
for (let q = 2n; q <= BigInt(MAX_DENOMINATOR); q++) {
  for (let p = 1n; p < q; p++) {
    if (gcd(p, q) !== 1n) continue;
    const digits = gaussDigits(p, q);
    const reconstructed = fractionFromDigits(digits);
    assert.deepEqual(reconstructed, [p, q]);
    firstDigits.add(digits[0]);
    rationalStates.push({
      numerator: p.toString(),
      denominator: q.toString(),
      gaussDigits: digits
    });
  }
}

// Cusp coefficients: for denominator c there are phi(c) primitive residue classes.
const SERIES_LIMIT = 200_000;
const phiValues = totients(SERIES_LIMIT);
const isPrime = primeSieve(SERIES_LIMIT);
const w = 4;
let totientDirichletPartial = 0;
for (let n = 1; n <= SERIES_LIMIT; n++) {
  totientDirichletPartial += phiValues[n] / n ** w;
}
let totientEulerPartial = 1;
let primeCount = 0;
for (let p = 2; p <= SERIES_LIMIT; p++) {
  if (!isPrime[p]) continue;
  primeCount++;
  totientEulerPartial *= (1 - p ** (-w)) / (1 - p ** (1 - w));
}

// Check phi(n)=n product_{p|n}(1-1/p) exactly over a finite range.
for (let n = 1; n <= 10_000; n++) {
  let value = n;
  let remaining = n;
  for (let p = 2; p * p <= remaining; p++) {
    if (remaining % p !== 0) continue;
    value = Math.floor(value / p * (p - 1));
    while (remaining % p === 0) remaining /= p;
  }
  if (remaining > 1) value = Math.floor(value / remaining * (remaining - 1));
  assert.equal(value, phiValues[n]);
}

const cuspArithmetic = {
  primitiveRationalStateCountThroughDenominator32: rationalStates.length,
  identity: "sum_(c>=1) phi(c)/c^(2s) = zeta(2s-1)/zeta(2s)",
  geometricMeaning: "phi(c) counts primitive residue classes d mod c with gcd(c,d)=1",
  fullVsPrimitiveLatticeIdentity: "E_all(z,s) = zeta(2s) E_primitive(z,s)",
  scatteringCoefficient: "sqrt(pi) Gamma(s-1/2)/Gamma(s) * zeta(2s-1)/zeta(2s)",
  numericalCheckAtW4: {
    seriesLimit: SERIES_LIMIT,
    primeCount,
    totientDirichletPartial,
    totientEulerPartial,
    absoluteDifference: Math.abs(totientDirichletPartial - totientEulerPartial)
  }
};

const result = {
  generatedAt: new Date().toISOString(),
  title: "Projective RSS closure: unit integration plus seam inversion",
  declaredBridgePremise: "Represent the integrated/residual ledger by a primitive two-coordinate integer vector and let seam maps act by GL(2,Z), consistent with the existing RSS winding-lattice formalism.",
  projectiveCoordinate: "x=u/v on P^1(R)",
  groupChecks,
  consequence: {
    orientationPreservingGroup: "<S,T> = PSL(2,Z)",
    fullGroupWithMirror: "<S,T,N> = PGL(2,Z)",
    orbifoldSignature: "(2,3,infinity)",
    gaussReturnMap: "G(x)=1/x-floor(1/x)",
    digitMeaning: "a=floor(1/x) is the number of completed unit integrations before the next normalized seam return",
    cuspMeaning: "T has infinite order and fixes infinity; quotienting by unit integration produces the modular cusp"
  },
  branches,
  fibonacciSector: {
    adjacencyMatrix: matrixStrings(A),
    inverseBranchMatrix: matrixStrings(B1),
    conjugacy: "B_1 = R A R",
    fixedPoint: goldenFixedPoint,
    fixedPointFormula: "x=1/(1+x)=1/phi",
    powers: fibonacciMatrixPowers
  },
  rationalGaussCoding: {
    maxDenominator: MAX_DENOMINATOR,
    stateCount: rationalStates.length,
    firstDigitsObserved: [...firstDigits].sort((a, b) => a - b),
    allReconstructionsExact: true,
    sample: rationalStates.slice(0, 40)
  },
  cuspArithmetic,
  rivalClosures: [3, 4, 5, 6].map((q) => ({
    q,
    translationLength: 2 * Math.cos(Math.PI / q),
    signature: `(2,${q},infinity)`,
    interpretation: q === 3
      ? "unit-threshold modular closure"
      : q === 5
        ? "golden-translation Hecke rival"
        : "alternative Hecke triangle closure"
  })),
  status: {
    digits: "derived conditionally from the projective ledger; no prime input",
    cusp: "forced after the canonical upper-half-plane/hyperbolic completion is adopted",
    riemannZeta: "emerges exactly in primitive/full lattice decomposition and cusp scattering",
    limitation: "this derives zeta as dilation and scattering data, not as the primitive-geodesic Euler product; the projective ledger and hyperbolic completion remain explicit bridge premises to justify physically"
  }
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);

console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
console.log(`Verified S^2=(ST)^3=1 projectively and ${branches.length} displayed Gauss branches.`);
console.log(`Exactly reconstructed ${rationalStates.length} primitive rational states through denominator ${MAX_DENOMINATOR}.`);
console.log(`Golden fixed point: ${goldenFixedPoint.toFixed(15)}; 1/(1+x) residual=${Math.abs(1 / (1 + goldenFixedPoint) - goldenFixedPoint).toExponential(2)}.`);
console.log(`Totient-series/Euler-product check at w=4 through ${SERIES_LIMIT}: |difference|=${Math.abs(totientDirichletPartial - totientEulerPartial).toExponential(3)}.`);
