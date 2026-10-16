#!/usr/bin/env node
/**
 * Eighth-stage RSS/RH investigation.
 *
 * Test whether TTI's already-present third decimal splice (10^3) can
 * independently determine a residue spectrum, its arithmetic deformation,
 * and an exact positive Weil identity.
 *
 * This verifier deliberately separates:
 *   1. weights inherited from the existing splice arithmetic and Rankin Green
 *      metric;
 *   2. a new codimension-one boundary model, which conditionally derives a
 *      first-order 1/lambda covariance;
 *   3. the exact prime-power deformation supplied by the explicit formula;
 *   4. the positive zero-spectrum factorisation, which is conditional on RH.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/rh/rss-third-splice-weil-results.json");
const PI = Math.PI;
const PHI = (1 + Math.sqrt(5)) / 2;
const SQRT5 = Math.sqrt(5);
const KAPPA_R = 1 / (4 * PI * PI);
const SPLICE_BASE = 10;
const START_LEVEL = 3;
const MAX_LEVEL = 36;
const L = PHI * PHI / SQRT5;

function oneMinusCos(x) {
  const sine = Math.sin(x / 2);
  return 2 * sine * sine;
}

function fibonacciValues(limit) {
  const values = new Float64Array(limit + 3);
  values[1] = 1;
  values[2] = 1;
  for (let n = 3; n < values.length; n++) values[n] = values[n - 1] + values[n - 2];
  return values;
}

const fibonacci = fibonacciValues(MAX_LEVEL + 2);
const levels = [];
let cumulative = 0;
for (let n = 1; n <= MAX_LEVEL; n++) {
  const threshold = SPLICE_BASE ** n;
  const returners = fibonacci[n + 2] - 1;
  const depth = PHI ** (-n);
  const deposit = returners * depth;
  const closedDeposit = L - depth
    - ((-1) ** n) * PHI ** (-2 * n - 2) / SQRT5;
  cumulative += deposit;
  const closedCumulative = n * L
    - PHI * (1 - PHI ** (-n))
    + PHI ** (-4) / (SQRT5 * (1 + PHI ** (-2)))
      * (1 - (-(PHI ** (-2))) ** n);
  levels.push({
    n,
    threshold,
    logThreshold: n * Math.log(SPLICE_BASE),
    fibonacciMultiplicity: fibonacci[n],
    returners,
    depth,
    deposit,
    closedDeposit,
    cumulative,
    closedCumulative
  });
}

const maximumDepositIdentityError = Math.max(...levels.map((row) =>
  Math.abs(row.deposit - row.closedDeposit)
));
const maximumCumulativeIdentityError = Math.max(...levels.map((row) =>
  Math.abs(row.cumulative - row.closedCumulative)
));
assert.ok(maximumDepositIdentityError < 1e-11);
assert.ok(maximumCumulativeIdentityError < 1e-10);

const cumulativeConstant = -PHI
  + PHI ** (-4) / (SQRT5 * (1 + PHI ** (-2)));
assert.ok(Math.abs((levels.at(-1).cumulative - MAX_LEVEL * L) - cumulativeConstant) < 1e-7);

function incrementDiagonal(t, frequency, weight) {
  return 2 * weight * oneMinusCos(frequency * t);
}

function kernelDiagonal(t, frequencyOf, weightOf, start = START_LEVEL) {
  let total = 0;
  for (const row of levels) {
    if (row.n < start) continue;
    total += incrementDiagonal(t, frequencyOf(row), weightOf(row));
  }
  return total;
}

// Existing RSS convention: integer label m has log-frequency log(m) and
// inverse-square Green weight kappa/m^2. Restrict m to decimal thresholds.
const ledgerFrequency = (row) => row.logThreshold;
const literalFrequency = (row) => row.threshold;
const generationLedgerWeight = (row) => KAPPA_R * row.deposit / (row.threshold ** 2);
const cumulativeLedgerWeight = (row) => KAPPA_R * row.cumulative / (row.threshold ** 2);

// New conditional model: if the third splice is declared to be the boundary
// trace of a two-dimensional harmonic bulk, the Dirichlet-to-Neumann symbol is
// |lambda| and its covariance is kappa/|lambda|. This is derived from that new
// action, not from the pre-existing inverse-square ledger.
const boundaryWeight = (row) => KAPPA_R * row.cumulative / row.threshold;

const generationSecondMoment = levels
  .filter((row) => row.n >= START_LEVEL)
  .reduce((sum, row) => sum + generationLedgerWeight(row) * ledgerFrequency(row) ** 2, 0);
const cumulativeSecondMoment = levels
  .filter((row) => row.n >= START_LEVEL)
  .reduce((sum, row) => sum + cumulativeLedgerWeight(row) * ledgerFrequency(row) ** 2, 0);
assert.ok(Number.isFinite(generationSecondMoment));
assert.ok(Number.isFinite(cumulativeSecondMoment));

// Small-t Suzuki target, before the first prime event. This isolates the cusp
// without using zeta zeros or assuming RH.
const EULER_GAMMA = 0.5772156649015329;
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

function simpsonIntegral(fn, upper, panels = 1200) {
  if (panels % 2 !== 0) panels++;
  const step = upper / panels;
  let total = fn(0) + fn(upper);
  for (let index = 1; index < panels; index++) {
    total += (index % 2 === 0 ? 2 : 4) * fn(index * step);
  }
  return total * step / 3;
}

function noPrimePsi(t) {
  assert.ok(t > 0 && t < Math.log(2));
  const singularIntegral = 0.5 * t * (Math.log(4 / t) + 1);
  return singularIntegral + simpsonIntegral(regularNoPrimeDerivative, t);
}

const smallTValues = [1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8, 1e-9, 1e-10];
const regularityComparison = smallTValues.map((t) => {
  const target = 2 * noPrimePsi(t);
  const generationLedger = kernelDiagonal(t, ledgerFrequency, generationLedgerWeight);
  const cumulativeLedger = kernelDiagonal(t, ledgerFrequency, cumulativeLedgerWeight);
  const boundaryTower = kernelDiagonal(t, literalFrequency, boundaryWeight);
  return {
    t,
    target,
    targetOverTLog: target / (t * Math.log(1 / t)),
    generationLedger,
    generationLedgerOverTSquared: generationLedger / (t * t),
    cumulativeLedger,
    cumulativeLedgerOverTSquared: cumulativeLedger / (t * t),
    boundaryTower,
    boundaryTowerOverTLog: boundaryTower / (t * Math.log(1 / t))
  };
});

assert.ok(regularityComparison.at(-1).targetOverTLog > regularityComparison[0].targetOverTLog);
assert.ok(Math.abs(
  regularityComparison.at(-1).generationLedgerOverTSquared - generationSecondMoment
) / generationSecondMoment < 1e-8);
assert.ok(Math.abs(
  regularityComparison.at(-1).cumulativeLedgerOverTSquared - cumulativeSecondMoment
) / cumulativeSecondMoment < 1e-8);

// Limiting coefficient along decimal subsequences t=a*10^-N. A pure lacunary
// tower has a log-periodic coefficient rather than Suzuki's single limit 1.
function limitingBoundaryRatio(phase) {
  let sum = 0;
  for (let k = -30; k <= 14; k++) {
    sum += SPLICE_BASE ** (-k) * oneMinusCos(phase * SPLICE_BASE ** k);
  }
  return 2 * KAPPA_R * L * sum / (phase * Math.log(SPLICE_BASE));
}

const decimalPhases = [1, 1.2, 1.5, 2, 3, 5, 8, 9.9];
const limitingBoundaryRatios = decimalPhases.map((phase) => ({
  phase,
  ratio: limitingBoundaryRatio(phase)
}));
const boundaryRatioMinimum = Math.min(...limitingBoundaryRatios.map((row) => row.ratio));
const boundaryRatioMaximum = Math.max(...limitingBoundaryRatios.map((row) => row.ratio));
assert.ok(boundaryRatioMaximum / boundaryRatioMinimum > 1.5,
  "the decimal tower should expose non-vanishing log-periodic modulation");

const phaseOneNormalization = 1 / limitingBoundaryRatio(1);
const normalizedBoundaryRatios = limitingBoundaryRatios.map((row) => ({
  phase: row.phase,
  ratio: row.ratio * phaseOneNormalization
}));
const maximumNormalizedPhaseDefect = Math.max(...normalizedBoundaryRatios.map((row) =>
  Math.abs(row.ratio - 1)
));
assert.ok(maximumNormalizedPhaseDefect > 0.25,
  "no scalar normalization should remove the decimal phase dependence");

// If one adds a further assumption and continuously fills every logarithmic
// decade, dn=d(lambda)/(lambda log 10). The boundary weights then induce
// rho(lambda)=C log(lambda)/lambda^2, which removes the discrete log-periodic
// modulation and has an exact leading cusp coefficient pi*C.
const continuumSpectralDensityCoefficient = KAPPA_R * L / (Math.log(SPLICE_BASE) ** 2);
const continuumCuspCoefficient = PI * continuumSpectralDensityCoefficient;
const continuumNormalizationNeeded = 1 / continuumCuspCoefficient;
assert.ok(continuumCuspCoefficient > 0 && continuumCuspCoefficient < 0.1);

// A coefficient transform on splice levels cannot create arithmetic event
// locations outside the decimal grid {n log 10}. The first prime-power event
// log 2 already proves the support mismatch.
const firstPrimeEvent = Math.log(2);
const decimalEventDistance = Math.min(...levels.map((row) =>
  Math.abs(row.logThreshold - firstPrimeEvent)
));
assert.ok(decimalEventDistance > 1);

const results = {
  analysisDate: "2026-10-14",
  title: "Third decimal splice as a possible Weil residue channel",
  verdict: {
    positiveWeilIdentityDerived: false,
    canonicalExistingWeightMatchesWeil: false,
    conditionalBoundaryWeightHasCorrectCuspOrder: true,
    exactArithmeticDeformationFromDecimalSplices: false,
    conclusion: "the existing splice and Rankin Green laws force a smooth log-frequency kernel; a new codimension-one boundary action conditionally produces the required t log(1/t) order, but with the wrong fixed coefficient, persistent decimal log-periodicity, and no derivation of prime-power event support"
  },
  spliceArithmetic: {
    base: SPLICE_BASE,
    thirdLevel: levels[START_LEVEL - 1],
    depositLimit: L,
    cumulativeAsymptotic: `Pi_N=${L} N + (${cumulativeConstant}) + o(1)`,
    cumulativeConstant,
    maximumDepositIdentityError,
    maximumCumulativeIdentityError,
    note: "the exact constant corrects the earlier rounded website statement Pi_N approximately 1.1708 N - 1.618"
  },
  independentlyInheritedWeights: {
    existingConvention: "frequency log(10^n)=n log 10; weight kappa_R times splice deposit divided by 10^(2n)",
    generationSecondMoment,
    cumulativeSecondMoment,
    regularity: "both inherited kernels are Hilbert-differentiable and have D(t,t)=C t^2+o(t^2)",
    interpretation: "restricting the established all-integer kappa/m^2 Green ledger to m=10^n cannot produce the Weil cusp"
  },
  conditionalBoundaryModel: {
    addedAssumption: "the 1000 splice is a codimension-one boundary trace of a two-dimensional harmonic bulk",
    derivation: "Dirichlet-to-Neumann symbol |lambda| gives covariance kappa_R/|lambda|",
    frequency: "lambda_n=10^n",
    weight: "w_n=kappa_R Pi_n/10^n",
    weightInterpretationAssumption: "Pi_n is treated linearly as channel multiplicity/intensity; treating it as a field amplitude would square Pi_n and produce t log(1/t)^2",
    asymptoticOrder: "D(t,t)=Theta(t log(1/t))",
    limitingBoundaryRatios,
    boundaryRatioMinimum,
    boundaryRatioMaximum,
    phaseOneNormalizationNeededToForceCoefficientOne: phaseOneNormalization,
    normalizedBoundaryRatios,
    maximumNormalizedPhaseDefect,
    continuumFill: {
      addedAssumption: "replace the discrete decimal tower by a uniform continuum in log(lambda)",
      spectralDensity: "rho(lambda)=C log(lambda)/lambda^2",
      spectralDensityCoefficient: continuumSpectralDensityCoefficient,
      resultingCuspCoefficient: continuumCuspCoefficient,
      normalizationNeededForUnitCusp: continuumNormalizationNeeded,
      interpretation: "continuum filling removes log-periodicity but the independently inherited kappa and splice deposit give the wrong coefficient"
    },
    status: "conditional new model, not a consequence of the existing splice or inverse-square Green ledger"
  },
  regularityComparison,
  arithmeticDeformation: {
    decimalEventGrid: "{n log 10}",
    targetEventGrid: "{log(p^k)}",
    firstPrimeEvent,
    distanceFromFirstPrimeEventToDecimalGrid: decimalEventDistance,
    exactAvailableMap: "full all-integer ledger --Mobius extraction--> Lambda(q) --delayed-hinge transform plus archimedean completion--> Psi",
    obstruction: "coefficient transforms on decimal levels preserve decimal event support; moving to all prime powers imports a new all-integer carrier not contained in the third-splice sequence",
    positivity: "the exact delayed-hinge deformation is not positivity preserving"
  },
  exactWeilIdentity: {
    unconditionalStatement: "a Hilbert-space B with G_g(t,u)=<B_t,B_u> for all real t,u exists exactly when G_g is globally PSD",
    suzukiEquivalence: "for this arithmetic kernel, global PSD is equivalent to RH",
    conditionalFactor: "under RH, b_t(gamma)=sqrt(2)*(exp(i gamma t)-1)/gamma over positive zero ordinates",
    circularityWarning: "constructing B from real zero ordinates or choosing a metric as the pullback of G_g assumes the target positivity",
    remainingRequirement: "derive a non-lacunary prime-power/archimedean residue carrier independently and prove its full-domain norm identity"
  }
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(results, null, 2)}\n`);

console.log("Third-splice Weil-channel investigation complete.");
console.log(`  delta Pi limit: ${L}`);
console.log(`  exact Pi_N constant: ${cumulativeConstant}`);
console.log(`  inherited generation t^2 coefficient: ${generationSecondMoment}`);
console.log(`  inherited cumulative t^2 coefficient: ${cumulativeSecondMoment}`);
console.log(`  boundary t log ratio range: ${boundaryRatioMinimum} to ${boundaryRatioMaximum}`);
console.log(`  phase-one normalization required: ${phaseOneNormalization}`);
console.log(`  residual phase defect after normalization: ${maximumNormalizedPhaseDefect}`);
console.log(`  continuum-filled cusp coefficient: ${continuumCuspCoefficient}`);
console.log(`  continuum normalization required: ${continuumNormalizationNeeded}`);
console.log("  Verdict: no independently derived exact Weil factorisation.");
