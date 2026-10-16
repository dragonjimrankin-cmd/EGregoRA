#!/usr/bin/env node
/**
 * Tenth-stage RSS/RH investigation.
 *
 * Resolve the zero-ordinate projection into TTI's two inversions, splice
 * projectors and arithmetic Möbius extraction. The principal new result is an
 * exact nonnegative central horizontal-residue norm for every hypothetical
 * off-critical zero quartet.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/rh/rss-ordinate-splice-residue-results.json");
const FIRST_ZERO_ORDINATE = 14.134725141734693;

function multiply2(left, right) {
  return [
    [
      left[0][0] * right[0][0] + left[0][1] * right[1][0],
      left[0][0] * right[0][1] + left[0][1] * right[1][1]
    ],
    [
      left[1][0] * right[0][0] + left[1][1] * right[1][0],
      left[1][0] * right[0][1] + left[1][1] * right[1][1]
    ]
  ];
}

function add2(left, right) {
  return left.map((row, i) => row.map((value, j) => value + right[i][j]));
}

function subtract2(left, right) {
  return left.map((row, i) => row.map((value, j) => value - right[i][j]));
}

function scale2(matrix, scalar) {
  return matrix.map((row) => row.map((value) => scalar * value));
}

function maxError2(left, right) {
  return Math.max(...left.flatMap((row, i) => row.map((value, j) =>
    Math.abs(value - right[i][j])
  )));
}

function apply2(matrix, vector) {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1]
  ];
}

const identity = [[1, 0], [0, 1]];
const zero = [[0, 0], [0, 0]];
const functionalInversion = [[-1, 0], [0, -1]]; // z -> -z
const conjugation = [[1, 0], [0, -1]]; // z -> conjugate(z)
const upperReflection = multiply2(functionalInversion, conjugation); // z -> -conjugate(z)
const ordinateProjector = scale2(add2(identity, upperReflection), 0.5);
const horizontalProjector = scale2(subtract2(identity, upperReflection), 0.5);

assert.equal(maxError2(multiply2(functionalInversion, functionalInversion), identity), 0);
assert.equal(maxError2(multiply2(conjugation, conjugation), identity), 0);
assert.equal(maxError2(multiply2(upperReflection, upperReflection), identity), 0);
assert.equal(maxError2(multiply2(ordinateProjector, ordinateProjector), ordinateProjector), 0);
assert.equal(maxError2(multiply2(horizontalProjector, horizontalProjector), horizontalProjector), 0);
assert.equal(maxError2(multiply2(ordinateProjector, horizontalProjector), zero), 0);
assert.equal(maxError2(add2(ordinateProjector, horizontalProjector), identity), 0);

const sampleState = [0.37, FIRST_ZERO_ORDINATE];
const reflectedState = apply2(upperReflection, sampleState);
const ordinateState = apply2(ordinateProjector, sampleState);
const horizontalState = apply2(horizontalProjector, sampleState);
assert.deepEqual(reflectedState, [-0.37, FIRST_ZERO_ORDINATE]);
assert.deepEqual(ordinateState, [0, FIRST_ZERO_ORDINATE]);
assert.deepEqual(horizontalState, [0.37, 0]);

function exactQuartetLogDerivative(w, eta, gamma) {
  const denominatorReal = w * w - eta * eta + gamma * gamma;
  const denominatorImag = -2 * eta * gamma;
  const denominatorNorm = denominatorReal ** 2 + denominatorImag ** 2;
  // 2w/(w^2-a^2) plus its conjugate.
  return 4 * w * denominatorReal / denominatorNorm;
}

function projectedQuartetLogDerivative(w, gamma) {
  // Two upper-half-plane zeros at the same ordinate after projection.
  return 4 * w / (w * w + gamma * gamma);
}

function quartetDefectClosed(w, eta, gamma) {
  const denominator = (w * w + gamma * gamma)
    * ((w * w - eta * eta + gamma * gamma) ** 2 + 4 * eta * eta * gamma * gamma);
  return 4 * w * eta * eta * (w * w - eta * eta - 3 * gamma * gamma)
    / denominator;
}

function centralResidueWeight(eta, gamma) {
  return 4 * eta * eta * (eta * eta + 3 * gamma * gamma)
    / (gamma * gamma * (eta * eta + gamma * gamma) ** 2);
}

function exactQuartetCentralDerivative(eta, gamma) {
  return 4 * (gamma * gamma - eta * eta) / (eta * eta + gamma * gamma) ** 2;
}

function projectedQuartetCentralDerivative(gamma) {
  return 4 / (gamma * gamma);
}

function exactQuartetPotential(t, eta, gamma) {
  const numeratorReal = Math.cosh(eta * t) * Math.cos(gamma * t) - 1;
  const numeratorImag = Math.sinh(eta * t) * Math.sin(gamma * t);
  const denominatorReal = eta * eta - gamma * gamma;
  const denominatorImag = 2 * eta * gamma;
  const denominatorNorm = denominatorReal ** 2 + denominatorImag ** 2;
  // Full quartet: twice the one-factor real contribution.
  return 4 * (numeratorReal * denominatorReal + numeratorImag * denominatorImag)
    / denominatorNorm;
}

function projectedQuartetPotential(t, gamma) {
  return 4 * (1 - Math.cos(gamma * t)) / (gamma * gamma);
}

const algebraChecks = [];
for (const eta of [0.01, 0.1, 0.25, 0.49]) {
  for (const gamma of [FIRST_ZERO_ORDINATE, 21.022039638771556, 50]) {
    for (const w of [0.01, 0.2, 1, 5, 20, 100]) {
      const direct = exactQuartetLogDerivative(w, eta, gamma)
        - projectedQuartetLogDerivative(w, gamma);
      const closed = quartetDefectClosed(w, eta, gamma);
      const error = Math.abs(direct - closed);
      assert.ok(error < 1e-14 * Math.max(1, Math.abs(direct), Math.abs(closed)));
      algebraChecks.push({ eta, gamma, w, direct, closed, error });
    }
  }
}

const hypotheticalQuartets = [0.1, 0.25, 0.49].map((eta) => {
  const gamma = FIRST_ZERO_ORDINATE;
  const crossing = Math.sqrt(eta * eta + 3 * gamma * gamma);
  const residueWeight = centralResidueWeight(eta, gamma);
  const derivativeDefect = projectedQuartetCentralDerivative(gamma)
    - exactQuartetCentralDerivative(eta, gamma);
  assert.ok(residueWeight > 0);
  assert.ok(Math.abs(derivativeDefect - residueWeight) < 2e-12 * residueWeight);

  const below = quartetDefectClosed(0.5 * crossing, eta, gamma);
  const above = quartetDefectClosed(2 * crossing, eta, gamma);
  assert.ok(below < 0 && above > 0);

  const timeDefects = [];
  for (let index = 1; index <= 2000; index++) {
    const t = index * 0.005;
    timeDefects.push(
      exactQuartetPotential(t, eta, gamma) - projectedQuartetPotential(t, gamma)
    );
  }
  const timeMinimum = Math.min(...timeDefects);
  const timeMaximum = Math.max(...timeDefects);
  assert.ok(timeMinimum < 0 && timeMaximum > 0);

  return {
    eta,
    gamma,
    reflectedUpperZero: [-eta, gamma],
    ordinateProjection: [0, gamma],
    horizontalResidue: [eta, 0],
    EuclideanPairEnergy: 2 * (eta * eta + gamma * gamma),
    ordinatePairEnergy: 2 * gamma * gamma,
    horizontalPairEnergy: 2 * eta * eta,
    centralResidueWeight: residueWeight,
    realAxisDefectCrossing: crossing,
    defectBelowCrossing: below,
    defectAboveCrossing: above,
    timeDefectMinimum: timeMinimum,
    timeDefectMaximum: timeMaximum
  };
});

const results = {
  analysisDate: "2026-10-14",
  title: "Zero-ordinate projection as a TTI splice and horizontal residue",
  verdict: {
    rhProved: false,
    exactTtiTwoInversionDecomposition: true,
    positiveHorizontalResidueScalarDerived: true,
    fullWeilResiduePositive: false,
    conclusion: "functional inversion followed by conjugation is the reflection across the critical line; its orthogonal splice separates every upper zero pair into an ordinate channel and a horizontal residue, whose central weighted norm is nonnegative and vanishes exactly under RH, while the full time-domain correction remains signed"
  },
  centeredZeroGeometry: {
    coordinate: "z=rho-1/2=eta+i gamma",
    functionalInversion: "I(z)=-z, induced by xi(s)=xi(1-s)",
    conjugation: "C(z)=conj(z), induced by real xi coefficients",
    composedReflection: "S=I C: z -> -conj(z), or (eta,gamma)->(-eta,gamma)",
    matrices: {
      I: functionalInversion,
      C: conjugation,
      S: upperReflection,
      ordinateProjector,
      horizontalProjector
    },
    identities: [
      "I^2=C^2=S^2=1",
      "Q_ord=(1+S)/2 and Q_hor=(1-S)/2",
      "Q_ord^2=Q_ord, Q_hor^2=Q_hor, Q_ord Q_hor=0",
      "z=Q_ord z+Q_hor z=i gamma+eta"
    ],
    sample: {
      state: sampleState,
      reflectedState,
      ordinateState,
      horizontalState
    }
  },
  spliceInterpretation: {
    upperPair: "eta+i gamma and -eta+i gamma",
    normalizedHadamardSplice: "q=(z+S z)/sqrt(2)=sqrt(2) i gamma; r=(z-S z)/sqrt(2)=sqrt(2) eta",
    conservedPairEnergy: "|z|^2+|S z|^2=2 gamma^2+2 eta^2=|q|^2+|r|^2",
    thirdSpliceMultiplicity: 2,
    warning: "F_3=2 matches the two upper members structurally, but TTI arithmetic does not derive the zeta quartet from that count"
  },
  centralHorizontalResidue: {
    projectedLogDerivative: "H_ord(w)=sum_{rho: gamma>0} 2w/(w^2+gamma^2)",
    exactQuartetLogDerivative: "H_q(w)=2w/(w^2-a^2)+2w/(w^2-conj(a)^2)",
    quartetDefect: "H_q-H_ord=4w eta^2(w^2-eta^2-3gamma^2)/[(w^2+gamma^2)((w^2-eta^2+gamma^2)^2+4eta^2gamma^2)]",
    residueIdentity: "H_ord'(0)-H'(0)=sum_quartets 4eta^2(eta^2+3gamma^2)/[gamma^2(eta^2+gamma^2)^2]",
    normFeature: "r_(eta,gamma)=2eta sqrt(eta^2+3gamma^2)/[gamma(eta^2+gamma^2)]",
    zeroCountingEquivalent: "H_ord'(0)=4 integral_0^infinity N(T)/T^3 dT; equality with (log xi)''(1/2) is equivalent to RH",
    properties: [
      "every summand is nonnegative",
      "the sum converges",
      "the sum vanishes if and only if every eta is zero",
      "therefore the central residue vanishes if and only if RH"
    ],
    hypotheticalQuartets
  },
  fullKernelDefect: {
    definition: "E(t,u)=G_g(t,u)-D_ord(t,u)",
    status: "exactly zero under RH but signed for a hypothetical off-line quartet",
    realAxisTransformSign: "the quartet defect changes sign at w=sqrt(eta^2+3gamma^2)",
    timeDomainSign: "sampled quartet potential defects take both signs",
    consequence: "the central residue is a norm square, but the full correction is not a positive channel term by term"
  },
  arithmeticMobiusLink: {
    distinction: "arithmetic M=mu* acts on divisor coefficients; S=I C acts on centered zero geometry",
    primePipeline: "log n --M--> Lambda(n) --hinge plus archimedean completion--> Psi --Laplace--> H=xi'/xi",
    zeroPipeline: "zero quartet --S splice--> ordinate projection plus horizontal residue",
    exactBridge: "the completed explicit formula identifies the prime-side H with the zero-side logarithmic derivative",
    failureOfInverseReturn: "Z M returns the all-integer log ledger but does not force the horizontal residue eta to vanish",
    requiredTheorem: "derive from the completed primitive ledger that H_ord'(0)=H'(0), or globally that D_ord=G_g"
  },
  ttiInterpretation: {
    ten: "real/localised displacement channel, analogous only at the level of eta",
    oneHundred: "phase/ordinate channel gamma",
    oneThousand: "two-face reflection separates the returned ordinate state from horizontal history residue",
    evidenceGrade: "structural mathematical analogy, not a physical derivation of zeta zeros from splice thresholds"
  },
  reproducibility: {
    maximumQuartetDefectFormulaError: Math.max(...algebraChecks.map((entry) => entry.error)),
    checkedAlgebraCases: algebraChecks.length
  },
  remainingRoute: {
    scalarTarget: "prove the independently nonnegative central residue norm is zero from prime-side data",
    fullTarget: "prove E(t,u)=0 on the full domain, equivalently D_ord=G_g",
    warning: "defining the ordinate projection is unconditional; proving equality is still RH-equivalent"
  }
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(results, null, 2)}\n`);

console.log("Ordinate-splice residue investigation complete.");
console.log(`  Projectors exact: ${results.verdict.exactTtiTwoInversionDecomposition}`);
console.log(`  Central positive residue: ${results.verdict.positiveHorizontalResidueScalarDerived}`);
console.log(`  Algebra cases checked: ${algebraChecks.length}`);
console.log(`  Maximum formula error: ${results.reproducibility.maximumQuartetDefectFormulaError}`);
console.log("  Verdict: exact scalar residue found; proving its vanishing remains RH-equivalent.");
