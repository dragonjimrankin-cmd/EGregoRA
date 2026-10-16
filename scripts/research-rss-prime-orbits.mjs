#!/usr/bin/env node
/**
 * Reproducible calculations for the RSS prime-orbit investigation.
 *
 * This script deliberately tests constructions fixed before looking at prime
 * data. It does not fit zeta zeros, import a prime list, or claim a proof of RH.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/rh/rss-prime-orbit-results.json");
const phi = (1 + Math.sqrt(5)) / 2;

function fibonacci(n) {
  let a = 0n;
  let b = 1n;
  for (let index = 0; index < n; index++) [a, b] = [b, a + b];
  return a;
}

function lucas(n) {
  if (n === 0) return 2n;
  if (n === 1) return 1n;
  let a = 2n;
  let b = 1n;
  for (let index = 2; index <= n; index++) [a, b] = [b, a + b];
  return b;
}

function divisors(n) {
  const values = [];
  for (let d = 1; d * d <= n; d++) {
    if (n % d !== 0) continue;
    values.push(d);
    if (d * d !== n) values.push(n / d);
  }
  return values.sort((a, b) => a - b);
}

function mobius(n) {
  let value = n;
  let factors = 0;
  for (let p = 2; p * p <= value; p++) {
    if (value % p !== 0) continue;
    value /= p;
    factors++;
    if (value % p === 0) return 0;
  }
  if (value > 1) factors++;
  return factors % 2 === 0 ? 1 : -1;
}

function primitiveNumerator(n, fixedPointCount) {
  return divisors(n).reduce((sum, d) =>
    sum + BigInt(mobius(d)) * fixedPointCount(n / d), 0n);
}

function primitiveOrbitCount(n, fixedPointCount) {
  const numerator = primitiveNumerator(n, fixedPointCount);
  const denominator = BigInt(n);
  if (numerator % denominator !== 0n) return null;
  return numerator / denominator;
}

function sieve(limit) {
  const prime = new Uint8Array(limit + 1);
  prime.fill(1, 2);
  for (let p = 2; p * p <= limit; p++) {
    if (!prime[p]) continue;
    for (let multiple = p * p; multiple <= limit; multiple += p) prime[multiple] = 0;
  }
  const pi = new Uint32Array(limit + 1);
  let count = 0;
  for (let n = 0; n <= limit; n++) {
    if (prime[n]) count++;
    pi[n] = count;
  }
  return { prime, pi };
}

function matMul(left, right) {
  return [
    [left[0][0] * right[0][0] + left[0][1] * right[1][0],
      left[0][0] * right[0][1] + left[0][1] * right[1][1]],
    [left[1][0] * right[0][0] + left[1][1] * right[1][0],
      left[1][0] * right[0][1] + left[1][1] * right[1][1]]
  ];
}

function continuedFractionMatrix(word) {
  return word.reduce((product, digit) =>
    matMul(product, [[BigInt(digit), 1n], [1n, 0n]]), [[1n, 0n], [0n, 1n]]);
}

function canonicalRotation(word) {
  const rotations = word.map((_, index) => word.slice(index).concat(word.slice(0, index)));
  rotations.sort((a, b) => a.join(",").localeCompare(b.join(",")));
  return rotations[0];
}

function isPrimitiveWord(word) {
  for (let period = 1; period < word.length; period++) {
    if (word.length % period !== 0) continue;
    if (word.every((value, index) => value === word[index % period])) return false;
  }
  return true;
}

function enumerateWords(length, alphabet, prefix = [], result = []) {
  if (prefix.length === length) {
    result.push(prefix);
    return result;
  }
  for (const symbol of alphabet) enumerateWords(length, alphabet, prefix.concat(symbol), result);
  return result;
}

function isPrimeInteger(value) {
  if (value < 2n) return false;
  if (value % 2n === 0n) return value === 2n;
  for (let divisor = 3n; divisor * divisor <= value; divisor += 2n) {
    if (value % divisor === 0n) return false;
  }
  return true;
}

const MAX_N = 30;
const populationCandidate = (n) => fibonacci(n + 2) - 1n;
const fibonacciShiftFixed = (n) => lucas(n); // tr([[1,1],[1,0]]^n)

const populationDold = [];
const shiftOrbits = [];
let cumulativeCycles = 0n;
for (let n = 1; n <= MAX_N; n++) {
  const candidateNumerator = primitiveNumerator(n, populationCandidate);
  const candidateDenominator = BigInt(n);
  populationDold.push({
    n,
    fixedCandidate: populationCandidate(n).toString(),
    primitiveNumerator: candidateNumerator.toString(),
    primitiveDenominator: candidateDenominator.toString(),
    integral: candidateNumerator % candidateDenominator === 0n,
    impliedPrimitiveOrbits: candidateNumerator % candidateDenominator === 0n
      ? (candidateNumerator / candidateDenominator).toString()
      : `${candidateNumerator}/${candidateDenominator}`
  });

  const primitive = primitiveOrbitCount(n, fibonacciShiftFixed);
  if (primitive === null || primitive < 0n) throw new Error(`Invalid Fibonacci-shift orbit count at n=${n}`);
  cumulativeCycles += primitive;
  shiftOrbits.push({
    n,
    periodicPoints: fibonacciShiftFixed(n).toString(),
    primitiveCycles: primitive.toString(),
    cumulativePrimitiveCycles: cumulativeCycles.toString()
  });
}

// The asymptotically calibrated x-scale follows from
// cumulative primitive cycles ~ phi^2 phi^n / n and pi(c phi^n) ~ c phi^n/(n log phi).
const calibration = phi * phi * Math.log(phi);
const maxScale = Math.floor(calibration * Math.pow(phi, MAX_N));
const { pi } = sieve(maxScale);
const envelopeComparison = shiftOrbits.map((entry) => {
  const n = entry.n;
  const rawX = Math.max(2, Math.floor(Math.pow(phi, n)));
  const calibratedX = Math.max(2, Math.floor(calibration * Math.pow(phi, n)));
  const cycles = Number(BigInt(entry.cumulativePrimitiveCycles));
  const rawPi = pi[rawX];
  const calibratedPi = pi[calibratedX];
  return {
    n,
    rawX,
    calibratedX,
    cumulativePrimitiveCycles: entry.cumulativePrimitiveCycles,
    piRawX: rawPi,
    piCalibratedX: calibratedPi,
    calibratedRelativeError: calibratedPi === 0 ? null : (cycles - calibratedPi) / calibratedPi
  };
});

const comparisonWindow = envelopeComparison.filter((row) => row.n >= 12);
const envelopeRmsRelativeError = Math.sqrt(comparisonWindow.reduce((sum, row) =>
  sum + row.calibratedRelativeError ** 2, 0) / comparisonWindow.length);

// A small continued-fraction completion sample. Cyclic words in digits 1..3
// are canonicalised by rotation. Trace is integral, while a multiplicative
// norm candidate comes from the spectral radius and is quadratic irrational.
const continuedFractionSamples = [];
for (let length = 1; length <= 4; length++) {
  const seen = new Set();
  for (const word of enumerateWords(length, [1, 2, 3])) {
    if (!isPrimitiveWord(word)) continue;
    const canonical = canonicalRotation(word);
    const key = canonical.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    const matrix = continuedFractionMatrix(canonical);
    const trace = matrix[0][0] + matrix[1][1];
    const determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    const traceNumber = Number(trace);
    const determinantNumber = Number(determinant);
    const discriminant = traceNumber ** 2 - 4 * determinantNumber;
    const spectralRadius = (traceNumber + Math.sqrt(discriminant)) / 2;
    const squared = matMul(matrix, matrix);
    const repeatedTrace = squared[0][0] + squared[1][1];
    continuedFractionSamples.push({
      word: canonical.join(""),
      length,
      matrix: matrix.map((row) => row.map(String)),
      trace: trace.toString(),
      traceIsPrime: isPrimeInteger(trace),
      determinant: determinant.toString(),
      spectralRadius,
      spectralRadiusSquared: spectralRadius ** 2,
      repeatedTrace: repeatedTrace.toString(),
      traceSquared: (trace * trace).toString(),
      traceIsMultiplicativeUnderRepetition: repeatedTrace === trace * trace
    });
  }
}

const phaseClosures = [40, 60].map((period) => ({
  model: `Fibonacci shift tensor a ${period}-state cyclic clock`,
  period,
  lucasCoefficient: lucas(period).toString(),
  determinantForm: `1 - L_${period} z^${period} + z^${2 * period}`,
  determinantPower: 1,
  poleFamiliesIncludingMultiplicity: 2 * period,
  zeroOrPoleCountingOrder: "O(T), because this is a rational function of exp(-a s)"
}));
phaseClosures.push({
  model: "Fibonacci shift tensor simultaneous 40- and 60-state clocks",
  period: 120,
  lucasCoefficient: lucas(120).toString(),
  determinantForm: `(1 - L_120 z^120 + z^240)^20`,
  determinantPower: 20,
  poleFamiliesIncludingMultiplicity: 2 * 120 * 20,
  explanation: "The 2,400 clock pairs split into 20 copies of the 120-step joint phase orbit.",
  zeroOrPoleCountingOrder: "O(T), because this is a rational function of exp(-a s)"
});

const firstPopulationFailure = populationDold.find((row) => !row.integral);
const exactEnvelopeMatches = envelopeComparison.filter((row) =>
  Number(row.cumulativePrimitiveCycles) === row.piCalibratedX).map((row) => row.n);

assert.deepEqual(firstPopulationFailure, {
  n: 2,
  fixedCandidate: "2",
  primitiveNumerator: "1",
  primitiveDenominator: "2",
  integral: false,
  impliedPrimitiveOrbits: "1/2"
});
assert.equal(shiftOrbits[1].primitiveCycles, "1");
assert.equal(shiftOrbits.at(-1).cumulativePrimitiveCycles, "172577");
assert.equal(continuedFractionSamples.some((sample) => sample.traceIsMultiplicativeUnderRepetition), false);

const result = {
  generatedAt: new Date().toISOString(),
  question: "Can primitive RSS return cycles generate the Euler product and Riemann explicit formula without presupposing either?",
  constants: {
    phi,
    calibration,
    maxPrimeSieve: maxScale,
    fibonacciShiftAdjacency: [[1, 1], [1, 0]],
    fibonacciShiftZeta: "1/(1-z-z^2)"
  },
  directPopulationAsFixedPoints: {
    explanation: "Dold/Mobius orbit integrality test for Fix(T^n)=F_(n+2)-1.",
    firstFailure: firstPopulationFailure,
    rows: populationDold
  },
  fibonacciShift: {
    explanation: "Natural closed-orbit completion of Fibonacci growth; Fix(sigma^n)=Lucas(n).",
    rows: shiftOrbits
  },
  primeNumberTheoremEnvelope: {
    explanation: "Compares cumulative primitive Fibonacci-shift cycles with pi(c phi^n); c=phi^2 log(phi) is derived from the main asymptotic, not fitted to the table.",
    rmsRelativeErrorN12To30: envelopeRmsRelativeError,
    exactMatchIndices: exactEnvelopeMatches,
    rows: envelopeComparison
  },
  finitePhaseDecorations: phaseClosures,
  continuedFractionCompletion: {
    explanation: "Primitive cyclic words over digits 1..3 under matrices [[a,1],[1,0]]. Trace can be prime accidentally, but is not multiplicative under cycle repetition; spectral radius is multiplicative under repetition but quadratic irrational.",
    sampleCount: continuedFractionSamples.length,
    primeTraceCount: continuedFractionSamples.filter((sample) => sample.traceIsPrime).length,
    multiplicativeTraceCount: continuedFractionSamples.filter((sample) => sample.traceIsMultiplicativeUnderRepetition).length,
    samples: continuedFractionSamples
  }
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);

console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
console.log(`Direct population first fails orbit integrality at n=${result.directPopulationAsFixedPoints.firstFailure.n}: ${result.directPopulationAsFixedPoints.firstFailure.impliedPrimitiveOrbits}`);
console.log(`Fibonacci shift primitive cycles through n=${MAX_N}: ${shiftOrbits.at(-1).cumulativePrimitiveCycles}`);
console.log(`Prime-envelope RMS relative error (n=12..${MAX_N}): ${envelopeRmsRelativeError.toFixed(6)}`);
console.log(`Continued-fraction samples: ${continuedFractionSamples.length}; prime traces=${result.continuedFractionCompletion.primeTraceCount}; multiplicative traces=${result.continuedFractionCompletion.multiplicativeTraceCount}`);
