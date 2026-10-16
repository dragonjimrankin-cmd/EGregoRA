#!/usr/bin/env node
/**
 * Ninth-stage RSS/RH investigation.
 *
 * Survey and discriminate other plausible positive channels for the Weil/screw
 * kernel after the canonical double inversion and the third decimal splice.
 *
 * The principal numerical test is an independently normalized archimedean
 * Weyl channel derived from the Riemann-von Mangoldt mean zero density. Other
 * channels are classified algebraically by positivity, regularity, arithmetic
 * support, exactness and circularity.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/rh/rss-alternative-weil-channel-results.json");
const THIRD_SPLICE_RESULTS = path.join(ROOT, "docs/rh/rss-third-splice-weil-results.json");
const PI = Math.PI;
const KAPPA_R = 1 / (4 * PI * PI);
const EULER_GAMMA = 0.5772156649015329;
const GAMMA_THRESHOLD = 2 * PI;

function oneMinusCos(x) {
  const sine = Math.sin(x / 2);
  return 2 * sine * sine;
}

function simpsonIntegral(fn, lower, upper, panels) {
  if (!(upper > lower)) return 0;
  if (panels % 2 !== 0) panels++;
  const step = (upper - lower) / panels;
  let total = fn(lower) + fn(upper);
  for (let index = 1; index < panels; index++) {
    total += (index % 2 === 0 ? 2 : 4) * fn(lower + index * step);
  }
  return total * step / 3;
}

// The positive archimedean Weyl measure is
//   rho_Gamma(lambda)=log(lambda/(2*pi))/(pi*lambda^2), lambda>=2*pi.
// It follows by multiplying the main Riemann-von Mangoldt density
// (1/(2*pi))*log(lambda/(2*pi)) by the conditional screw weight 2/lambda^2.
function archimedeanWeylDiagonal(t) {
  const a = GAMMA_THRESHOLD * t;
  assert.ok(a < 1);

  // y=lambda*t. On [a,1], use y=a*exp(r) so the logarithmic endpoint is stable.
  const logSpan = Math.log(1 / a);
  const lowPanels = Math.max(1200, 2 * Math.ceil(logSpan * 250 / 2));
  const low = simpsonIntegral((r) => {
    const y = a * Math.exp(r);
    return oneMinusCos(y) * r / y;
  }, 0, logSpan, lowPanels);

  // Resolve the oscillatory middle directly. The nonoscillatory tail is exact
  // up to a cosine integral bounded by O(log(Y/a)/Y^2).
  const upper = 5000;
  const middlePanels = 100000;
  const middle = simpsonIntegral((y) =>
    oneMinusCos(y) * Math.log(y / a) / (y * y),
  1, upper, middlePanels);
  const tailWithoutCosine = (Math.log(upper / a) + 1) / upper;

  return 2 * t / PI * (low + middle + tailWithoutCosine);
}

// Exact no-prime Suzuki potential for 0<t<log 2, reused as an unconditional
// local comparison. No zero data and no RH assumption enter.
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

function noPrimePsi(t) {
  assert.ok(t > 0 && t < Math.log(2));
  const singularIntegral = 0.5 * t * (Math.log(4 / t) + 1);
  return singularIntegral + simpsonIntegral(regularNoPrimeDerivative, 0, t, 1200);
}

const testValues = [1e-2, 3e-3, 1e-3, 3e-4, 1e-4, 3e-5, 1e-5];
const archimedeanComparison = testValues.map((t) => {
  const target = 2 * noPrimePsi(t);
  const channel = archimedeanWeylDiagonal(t);
  return {
    t,
    target,
    channel,
    relativeError: Math.abs(channel - target) / target,
    targetOverTLog: target / (t * Math.log(1 / t)),
    channelOverTLog: channel / (t * Math.log(1 / t)),
    differenceOverTSquared: (target - channel) / (t * t)
  };
});
assert.ok(archimedeanComparison.at(-1).relativeError < 1e-5);
assert.ok(archimedeanComparison[0].relativeError < 1e-3);
assert.ok(archimedeanComparison.at(-1).channelOverTLog > archimedeanComparison[0].channelOverTLog);

const thirdSplice = JSON.parse(fs.readFileSync(THIRD_SPLICE_RESULTS, "utf8"));
const decimalContinuumCoefficient = thirdSplice.conditionalBoundaryModel
  .continuumFill.resultingCuspCoefficient;
assert.ok(Math.abs(decimalContinuumCoefficient - 1) > 0.9);

// The exact high-frequency coefficient of the archimedean channel is one:
// 2 * (1/pi) * integral_0^infty (1-cos y)/y^2 dy = 1.
const archimedeanCuspCoefficient = 2 * (1 / PI) * (PI / 2);
assert.equal(archimedeanCuspCoefficient, 1);

// Test whether the horizontal displacement discarded by the ordinate channel
// could itself be restored as a positive diagonal correction. For one zero
// parameter a=eta+i*gamma, inverse Laplace transformation contributes
// 2 Re[(cosh(a t)-1)/a^2]. Its difference from the projected eta=0 term changes
// sign, so an off-line correction is not a positive channel zero by zero.
function horizontalDisplacementDifference(eta, gamma, t) {
  const numeratorRe = Math.cosh(eta * t) * Math.cos(gamma * t) - 1;
  const numeratorIm = Math.sinh(eta * t) * Math.sin(gamma * t);
  const denominatorRe = eta * eta - gamma * gamma;
  const denominatorIm = 2 * eta * gamma;
  const denominatorNorm = denominatorRe ** 2 + denominatorIm ** 2;
  const actual = 2 * (numeratorRe * denominatorRe + numeratorIm * denominatorIm)
    / denominatorNorm;
  const projected = 2 * oneMinusCos(gamma * t) / (gamma * gamma);
  return actual - projected;
}

const horizontalDisplacementTests = [0.1, 0.25, 0.49].map((eta) => {
  const gamma = 14.134725141734693;
  const values = [];
  for (let index = 1; index <= 2000; index++) {
    values.push(horizontalDisplacementDifference(eta, gamma, index * 0.005));
  }
  return {
    eta,
    gamma,
    minimum: Math.min(...values),
    maximum: Math.max(...values),
    changesSign: Math.min(...values) < 0 && Math.max(...values) > 0
  };
});
assert.ok(horizontalDisplacementTests.every((entry) => entry.changesSign));

const channels = [
  {
    id: "existing-rankin-green",
    name: "Existing inverse-square Rankin splice channel",
    unconditionalPsd: true,
    cusp: "t^2",
    arithmeticSupport: "decimal subsequence of the all-integer log spectrum",
    exactWeilIdentity: false,
    circular: false,
    verdict: "excluded by local regularity"
  },
  {
    id: "third-splice-boundary",
    name: "Third-splice harmonic boundary channel",
    unconditionalPsd: true,
    cusp: "t log(1/t), with decimal modulation",
    arithmeticSupport: "literal decimal frequencies",
    exactWeilIdentity: false,
    circular: false,
    verdict: "right order; wrong coefficient, modulation and arithmetic support"
  },
  {
    id: "archimedean-weyl",
    name: "Archimedean Weyl-density channel",
    unconditionalPsd: true,
    cusp: "t log(1/t) with exact unit leading coefficient",
    arithmeticSupport: "continuous mean zero density from the gamma factor",
    exactWeilIdentity: false,
    circular: false,
    verdict: "best independent local channel; misses discrete prime/zero fluctuations"
  },
  {
    id: "ordinate-projection",
    name: "Unconditional zero-ordinate projection channel",
    unconditionalPsd: true,
    cusp: "t log(1/t) with exact unit leading coefficient",
    arithmeticSupport: "actual imaginary ordinates of all nontrivial zeros, horizontal displacement discarded",
    exactWeilIdentity: "if and only if RH",
    circular: false,
    verdict: "exact under RH; equality with the arithmetic screw kernel is itself RH-equivalent"
  },
  {
    id: "prime-weyl-sampling",
    name: "Positive prime-power sampling of the Weyl density",
    unconditionalPsd: true,
    cusp: "t log(1/t) asymptotically under the prime number theorem",
    arithmeticSupport: "prime-power log frequencies",
    exactWeilIdentity: false,
    circular: false,
    verdict: "right support type and mean cusp; wrong weights and turns events into frequencies"
  },
  {
    id: "polya-fourier",
    name: "Direct Pólya-kernel Fourier feature channel",
    unconditionalPsd: true,
    cusp: "t^2 because every moment is finite",
    arithmeticSupport: "continuous Pólya kernel",
    exactWeilIdentity: false,
    circular: false,
    verdict: "log-concavity cannot repair the regularity mismatch"
  },
  {
    id: "explicit-formula-krein",
    name: "Signed explicit-formula/Krein channel",
    unconditionalPsd: false,
    cusp: "exact",
    arithmeticSupport: "exact prime-power hinges plus archimedean completion",
    exactWeilIdentity: true,
    circular: false,
    verdict: "exact but indefinite; the missing theorem is conversion to a Hilbert norm"
  },
  {
    id: "recovery-witness",
    name: "Recovery-witness reserve channel",
    unconditionalPsd: "unknown",
    cusp: "not a local spectral construction",
    arithmeticSupport: "exact recovery-conditioned prime history",
    exactWeilIdentity: "would follow from C_q-J_q=||R_q||^2 at every witness",
    circular: "if positivity of C_q-J_q is assumed",
    verdict: "sharpest arithmetic target, still open"
  },
  {
    id: "zero-spectrum-hilbert",
    name: "Real zero-spectrum Hilbert channel",
    unconditionalPsd: "conditional on RH",
    cusp: "exact",
    arithmeticSupport: "real zero ordinates with weights 2/gamma^2",
    exactWeilIdentity: "under RH",
    circular: true,
    verdict: "the desired factorisation after the theorem has been assumed"
  }
];

const results = {
  analysisDate: "2026-10-14",
  title: "Alternative positive channels for the Weil/screw kernel",
  verdict: {
    exactPositiveWeilChannelDerived: false,
    strongestIndependentLocalChannel: "archimedean-weyl",
    strongestArithmeticProxy: "ordinate-projection",
    sharpestRemainingExactTarget: "recovery-witness",
    conclusion: "the gamma-factor Weyl channel independently fixes the non-lacunary spectral density and unit cusp coefficient; the zero-ordinate projection adds exact arithmetic spectral locations without assuming their horizontal confinement; neither equals the screw kernel unconditionally"
  },
  archimedeanWeylChannel: {
    derivation: "Riemann-von Mangoldt mean density (1/(2*pi)) log(lambda/(2*pi)) multiplied by screw weight 2/lambda^2",
    spectralDensity: "rho_Gamma(lambda)=log(lambda/(2*pi))/(pi*lambda^2), lambda>=2*pi",
    nonnegative: true,
    cuspCoefficient: archimedeanCuspCoefficient,
    comparison: archimedeanComparison,
    interpretation: "the local cusp and its normalization are archimedean zero-density effects, not consequences of decimal scaling",
    limitation: "continuous mean density omits the fluctuating zero/prime measure and is not the exact global screw kernel"
  },
  ordinateProjectionChannel: {
    measure: "nu_ord=2 sum_{rho: Im(rho)>0} multiplicity(rho)/Im(rho)^2 delta_{Im(rho)}",
    feature: "b_t(rho)=sqrt(2 multiplicity(rho)) (exp(i Im(rho)t)-1)/Im(rho)",
    unconditionalPsd: true,
    convergence: "follows from the unconditional Riemann-von Mangoldt zero count",
    exactUnderRH: true,
    equalityImpliesRH: true,
    horizontalDisplacementTests,
    horizontalCorrection: "the one-zero correction 2 Re[(cosh((eta+i gamma)t)-1)/(eta+i gamma)^2] minus its eta=0 projection changes sign",
    missingData: "the channel deliberately discards beta-1/2, so equality is precisely the horizontal-confinement problem"
  },
  primeWeylSamplingChannel: {
    measure: "(1/pi) sum_{q=p^k, log q>2*pi} [Lambda(q)/q] [log(log(q)/(2*pi))/(log q)^2] delta_{log q}",
    unconditionalPsd: true,
    asymptoticJustification: "the prime number theorem turns (Lambda(q)/q) sampling into d lambda at frequency lambda=log q",
    cuspCoefficient: 1,
    limitation: "the exact explicit formula uses Lambda(q)/sqrt(q) delayed hinges, not these positive spectral weights"
  },
  polyaChannel: {
    feature: "b_t(u)=sqrt(Phi(u)) (exp(i t u)-1)",
    unconditionalPsd: true,
    regularity: "super-exponential decay of Phi gives finite moments and a t^2 diagonal",
    logConcavityImpact: "even a completed proof of log-concavity would not change this moment regularity"
  },
  channelScorecard: channels,
  comparisonWithThirdSplice: {
    decimalContinuumCuspCoefficient: decimalContinuumCoefficient,
    archimedeanCuspCoefficient,
    coefficientRatio: archimedeanCuspCoefficient / decimalContinuumCoefficient,
    conclusion: "the gamma normalization supplies the factor missing from the fixed decimal boundary channel, but replacing one measure by the other is a new arithmetic construction, not a splice identity"
  },
  remainingRoute: {
    requirement: "identify an independently positive correction carrying the fluctuating difference between the continuous gamma density and the exact prime/zero distribution",
    equivalentArithmeticForm: "prove C_q-J_q is a norm square at every recovery witness",
    warning: "the ordinate channel or real-zero Hilbert factor cannot prove equality without resolving horizontal zero displacement"
  }
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(results, null, 2)}\n`);

console.log("Alternative Weil-channel investigation complete.");
console.log(`  Archimedean cusp coefficient: ${archimedeanCuspCoefficient}`);
console.log(`  Smallest-t gamma/target relative error: ${archimedeanComparison.at(-1).relativeError}`);
console.log(`  Decimal continuum coefficient: ${decimalContinuumCoefficient}`);
console.log(`  Coefficient ratio gamma/decimal: ${results.comparisonWithThirdSplice.coefficientRatio}`);
console.log("  Verdict: gamma mean and ordinate projection are strong proxies; no unconditional exact Weil channel.");
