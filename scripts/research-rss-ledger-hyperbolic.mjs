#!/usr/bin/env node
/**
 * Reproducible checks for the two remaining RSS-to-modular bridge premises:
 *
 * 1. the consecutive splice-multiplicity ledger and its projective update;
 * 2. the upper half-plane as unit-area two-cycle shape space, with its
 *    affine-invariant relative-strain metric.
 *
 * The program uses no prime table, zeta zero, or fitted physical parameter.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/rh/rss-ledger-hyperbolic-results.json");
const TOLERANCE = 1e-12;

const I_BIG = [[1n, 0n], [0n, 1n]];
const T_BIG = [[1n, 1n], [0n, 1n]]; // unit addition: (u,v) -> (u+v,v)
const R_BIG = [[0n, 1n], [1n, 0n]]; // register exchange: (u,v) -> (v,u)
const B_BIG = [[0n, 1n], [1n, 1n]]; // RSS/Fibonacci shift register

function bigMatMul(left, right) {
  return [
    [left[0][0] * right[0][0] + left[0][1] * right[1][0],
      left[0][0] * right[0][1] + left[0][1] * right[1][1]],
    [left[1][0] * right[0][0] + left[1][1] * right[1][0],
      left[1][0] * right[0][1] + left[1][1] * right[1][1]]
  ];
}

function bigMatVec(matrix, vector) {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1]
  ];
}

function bigMatPow(matrix, exponent) {
  let result = I_BIG;
  let base = matrix;
  let power = exponent;
  while (power > 0) {
    if (power % 2 === 1) result = bigMatMul(result, base);
    base = bigMatMul(base, base);
    power = Math.floor(power / 2);
  }
  return result;
}

function bigDet(matrix) {
  return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

function gcd(a, b) {
  let left = a < 0n ? -a : a;
  let right = b < 0n ? -b : b;
  while (right !== 0n) [left, right] = [right, left % right];
  return left;
}

function fibonacci(n) {
  let previous = 0n;
  let current = 1n;
  for (let index = 0; index < n; index++) {
    [previous, current] = [current, previous + current];
  }
  return previous;
}

function bigMatrixStrings(matrix) {
  return matrix.map((row) => row.map(String));
}

function almostEqual(actual, expected, tolerance = TOLERANCE) {
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  assert.ok(
    Math.abs(actual - expected) <= tolerance * scale,
    `Expected ${actual} to equal ${expected} within relative tolerance ${tolerance}`
  );
}

function matMul(left, right) {
  return [
    [left[0][0] * right[0][0] + left[0][1] * right[1][0],
      left[0][0] * right[0][1] + left[0][1] * right[1][1]],
    [left[1][0] * right[0][0] + left[1][1] * right[1][0],
      left[1][0] * right[0][1] + left[1][1] * right[1][1]]
  ];
}

function determinant(matrix) {
  return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

function inverse2(matrix) {
  const det = determinant(matrix);
  return [
    [matrix[1][1] / det, -matrix[0][1] / det],
    [-matrix[1][0] / det, matrix[0][0] / det]
  ];
}

function trace(matrix) {
  return matrix[0][0] + matrix[1][1];
}

function transpose(matrix) {
  return [[matrix[0][0], matrix[1][0]], [matrix[0][1], matrix[1][1]]];
}

function scaleMatrix(scalar, matrix) {
  return matrix.map((row) => row.map((entry) => scalar * entry));
}

function addMatrices(left, right) {
  return left.map((row, i) => row.map((entry, j) => entry + right[i][j]));
}

function shapeMatrix(x, y) {
  assert.ok(y > 0, "The oriented shape coordinate y must be positive");
  return scaleMatrix(1 / y, [[1, x], [x, x * x + y * y]]);
}

function shapeDerivatives(x, y) {
  return {
    x: scaleMatrix(1 / y, [[0, 1], [1, 2 * x]]),
    y: [[-1 / (y * y), -x / (y * y)],
      [-x / (y * y), 1 - x * x / (y * y)]]
  };
}

function strainInnerProduct(Q, tangentA, tangentB) {
  const inverse = inverse2(Q);
  return 0.5 * trace(matMul(matMul(matMul(inverse, tangentA), inverse), tangentB));
}

function dot(left, right) {
  return left[0] * right[0] + left[1] * right[1];
}

function orientedArea(first, second) {
  return first[0] * second[1] - first[1] * second[0];
}

function gramMatrix(first, second) {
  return [[dot(first, first), dot(first, second)],
    [dot(first, second), dot(second, second)]];
}

function coordinatesFromGram(G) {
  const area = Math.sqrt(determinant(G));
  return {
    x: G[0][1] / G[0][0],
    y: area / G[0][0],
    area
  };
}

function modularTransform(matrix, point) {
  const [[a, b], [c, d]] = matrix;
  const denominatorReal = c * point.x + d;
  const denominatorImag = c * point.y;
  const denominatorSquared = denominatorReal ** 2 + denominatorImag ** 2;
  const determinantValue = a * d - b * c;
  return {
    x: ((a * point.x + b) * denominatorReal + a * c * point.y ** 2) / denominatorSquared,
    y: determinantValue * point.y / denominatorSquared,
    denominatorSquared
  };
}

function transformTangent(matrix, point, tangent) {
  const c = matrix[1][0];
  const d = matrix[1][1];
  const denominatorReal = c * point.x + d;
  const denominatorImag = c * point.y;
  const squareReal = denominatorReal ** 2 - denominatorImag ** 2;
  const squareImag = 2 * denominatorReal * denominatorImag;
  const squareNorm = squareReal ** 2 + squareImag ** 2;
  const derivativeReal = squareReal / squareNorm;
  const derivativeImag = -squareImag / squareNorm;
  return {
    dx: derivativeReal * tangent.dx - derivativeImag * tangent.dy,
    dy: derivativeImag * tangent.dx + derivativeReal * tangent.dy
  };
}

// ---------------------------------------------------------------------------
// 1. The existing RSS Fibonacci counts already provide a concrete ledger.
// ---------------------------------------------------------------------------

assert.deepEqual(bigMatMul(R_BIG, T_BIG), B_BIG);
assert.equal(bigDet(T_BIG), 1n);
assert.equal(bigDet(R_BIG), -1n);
assert.equal(bigDet(B_BIG), -1n);
assert.deepEqual(bigMatPow(R_BIG, 2), I_BIG);

const phi = (1 + Math.sqrt(5)) / 2;
const ledgerRows = [];
for (let n = 1; n <= 24; n++) {
  const u = fibonacci(n);
  const v = fibonacci(n + 1);
  const state = [u, v];
  const nextState = [fibonacci(n + 1), fibonacci(n + 2)];
  assert.deepEqual(bigMatVec(B_BIG, state), nextState);
  assert.equal(gcd(u, v), 1n);

  const cumulativeReturners = fibonacci(n + 2) - 1n;
  assert.equal(cumulativeReturners, u + v - 1n);
  const depositFromCumulative = Number(cumulativeReturners) * phi ** (-n);
  const depositFromLedger = Number(u + v - 1n) * phi ** (-n);
  almostEqual(depositFromLedger, depositFromCumulative);

  const x = Number(u) / Number(v);
  const nextX = Number(nextState[0]) / Number(nextState[1]);
  almostEqual(nextX, 1 / (1 + x));

  ledgerRows.push({
    n,
    previousMultiplicity_u: u.toString(),
    currentMultiplicity_v: v.toString(),
    nextState: nextState.map(String),
    gcd: gcd(u, v).toString(),
    cumulativeReturners: cumulativeReturners.toString(),
    cumulativeFromLedger: (u + v - 1n).toString(),
    depositFromCumulative,
    depositFromLedger,
    projectiveRatio: x
  });
}

const finalRatio = ledgerRows.at(-1).projectiveRatio;
almostEqual(finalRatio, 1 / phi, 1e-9);

// A scalar current register is not an autonomous state for the whole
// second-order recurrence family: equal current values with different previous
// values have different successors. This is the relevant minimality claim; a
// single preselected Fibonacci orbit can of course be indexed externally by n.
const oneRegisterCollision = {
  firstState: [1n, 3n],
  secondState: [2n, 3n]
};
const firstSuccessor = bigMatVec(B_BIG, oneRegisterCollision.firstState);
const secondSuccessor = bigMatVec(B_BIG, oneRegisterCollision.secondState);
assert.equal(firstSuccessor[0], secondSuccessor[0]);
assert.notEqual(firstSuccessor[1], secondSuccessor[1]);

// Variable completed-unit counts give the inverse continued-fraction branches.
const generalizedBranches = [];
for (let a = 1; a <= 12; a++) {
  const TPower = [[1n, BigInt(a)], [0n, 1n]];
  const branchMatrix = bigMatMul(R_BIG, TPower);
  const testState = [5n, 13n];
  const transformed = bigMatVec(branchMatrix, testState);
  const x = Number(testState[0]) / Number(testState[1]);
  const transformedX = Number(transformed[0]) / Number(transformed[1]);
  assert.deepEqual(branchMatrix, [[0n, 1n], [1n, BigInt(a)]]);
  assert.equal(bigDet(branchMatrix), -1n);
  assert.equal(gcd(...transformed), gcd(...testState));
  almostEqual(transformedX, 1 / (a + x));
  generalizedBranches.push({
    completedUnits: a,
    matrix: bigMatrixStrings(branchMatrix),
    update: `(u,v)->(v,u+${a}v)`,
    projectiveBranch: `x->1/(${a}+x)`
  });
}

// ---------------------------------------------------------------------------
// 2. Two torus periods produce tau=x+iy and the unit-area shape matrix Q.
// ---------------------------------------------------------------------------

const periodSamples = [
  { lengthScale: 1, x: 0, y: 1 },
  { lengthScale: 2.75, x: 0.4, y: 1.3 },
  { lengthScale: 0.3, x: -1.2, y: 0.25 },
  { lengthScale: 8, x: 2.1, y: 4.5 }
];

const recoveredPeriods = periodSamples.map(({ lengthScale, x, y }) => {
  const omegaIntegration = [lengthScale, 0];
  const omegaReturn = [lengthScale * x, lengthScale * y];
  const G = gramMatrix(omegaIntegration, omegaReturn);
  const recovered = coordinatesFromGram(G);
  almostEqual(recovered.x, x);
  almostEqual(recovered.y, y);
  almostEqual(recovered.area, orientedArea(omegaIntegration, omegaReturn));

  const Q = scaleMatrix(1 / recovered.area, G);
  const expectedQ = shapeMatrix(x, y);
  almostEqual(determinant(Q), 1);
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) almostEqual(Q[i][j], expectedQ[i][j]);
  }

  return {
    omegaIntegration,
    omegaReturn,
    gram: G,
    recovered: { x: recovered.x, y: recovered.y, orientedArea: recovered.area },
    unitAreaShape: Q,
    determinant: determinant(Q)
  };
});

// Directly verify the pullback of the affine-invariant matrix metric.
const metricSamples = [
  { x: 0, y: 1 },
  { x: 0.4, y: 1.3 },
  { x: -0.7, y: 0.2 },
  { x: 2.3, y: 3.5 }
];

const metricChecks = metricSamples.map(({ x, y }) => {
  const Q = shapeMatrix(x, y);
  const derivatives = shapeDerivatives(x, y);
  const gxx = strainInnerProduct(Q, derivatives.x, derivatives.x);
  const gxy = strainInnerProduct(Q, derivatives.x, derivatives.y);
  const gyy = strainInnerProduct(Q, derivatives.y, derivatives.y);
  const expected = 1 / (y * y);
  almostEqual(determinant(Q), 1);
  almostEqual(gxx, expected);
  almostEqual(gxy, 0);
  almostEqual(gyy, expected);
  return { x, y, determinantQ: determinant(Q), gxx, gxy, gyy, expectedDiagonal: expected };
});

// Basis-independent congruence invariance of the strain metric:
// Q -> M^T Q M and dQ -> M^T dQ M for determinant-one M.
const congruenceMatrices = [
  [[1, 1], [0, 1]],
  [[0, -1], [1, 0]],
  [[2, 1], [1, 1]]
];
const baseQ = shapeMatrix(0.37, 1.4);
const tangentA = addMatrices(scaleMatrix(0.19, shapeDerivatives(0.37, 1.4).x),
  scaleMatrix(-0.11, shapeDerivatives(0.37, 1.4).y));
const tangentB = addMatrices(scaleMatrix(-0.07, shapeDerivatives(0.37, 1.4).x),
  scaleMatrix(0.23, shapeDerivatives(0.37, 1.4).y));
const baseInnerProduct = strainInnerProduct(baseQ, tangentA, tangentB);

const congruenceChecks = congruenceMatrices.map((matrix) => {
  almostEqual(determinant(matrix), 1);
  const matrixTranspose = transpose(matrix);
  const transformedQ = matMul(matMul(matrixTranspose, baseQ), matrix);
  const transformedA = matMul(matMul(matrixTranspose, tangentA), matrix);
  const transformedB = matMul(matMul(matrixTranspose, tangentB), matrix);
  const transformedInnerProduct = strainInnerProduct(transformedQ, transformedA, transformedB);
  almostEqual(determinant(transformedQ), 1);
  almostEqual(transformedInnerProduct, baseInnerProduct);
  return { matrix, baseInnerProduct, transformedInnerProduct };
});

// Equivalent direct check in upper-half-plane coordinates for modular maps.
const modularMatrices = [
  { name: "T", matrix: [[1, 1], [0, 1]] },
  { name: "S", matrix: [[0, -1], [1, 0]] },
  { name: "gamma", matrix: [[2, 1], [1, 1]] }
];
const modularPoints = [
  { x: 0.31, y: 0.82 },
  { x: -1.7, y: 2.4 },
  { x: 3.2, y: 0.17 }
];
const tangent = { dx: 0.23, dy: -0.14 };
const modularInvariance = [];
for (const { name, matrix } of modularMatrices) {
  for (const point of modularPoints) {
    const transformedPoint = modularTransform(matrix, point);
    const transformedVector = transformTangent(matrix, point, tangent);
    const originalNorm = (tangent.dx ** 2 + tangent.dy ** 2) / point.y ** 2;
    const transformedNorm = (transformedVector.dx ** 2 + transformedVector.dy ** 2)
      / transformedPoint.y ** 2;
    assert.ok(transformedPoint.y > 0);
    almostEqual(transformedPoint.y, point.y / transformedPoint.denominatorSquared);
    almostEqual(transformedNorm, originalNorm);
    modularInvariance.push({
      transformation: name,
      matrix,
      point,
      transformedPoint: { x: transformedPoint.x, y: transformedPoint.y },
      originalHyperbolicSquaredNorm: originalNorm,
      transformedHyperbolicSquaredNorm: transformedNorm
    });
  }
}

// At unit area, y also measures reciprocal cycle-scale separation. The first
// marked period has length y^{-1/2}; the transverse part of the second has
// length y^{1/2}. Their product is one.
const cuspScaleSamples = [1, 10, 100, 10_000].map((y) => {
  const firstCycleLength = 1 / Math.sqrt(y);
  const transverseReturnLength = Math.sqrt(y);
  almostEqual(firstCycleLength * transverseReturnLength, 1);
  return { y, firstCycleLength, transverseReturnLength };
});

const result = {
  analysisDate: "2026-10-14",
  title: "RSS projective ledger and intrinsic hyperbolic torus-shape completion",
  sourceObservables: {
    spliceMultiplicity: "m_n=F_n",
    cumulativeReturners: "R_n=sum_(k=1)^n F_k=F_(n+2)-1",
    deposit: "deltaPi_n=R_n phi^(-n)",
    torusMemory: "(p,q) in Z^2 records two independent winding counts"
  },
  ledger: {
    definition: "L_n=(m_n,m_(n+1))=(F_n,F_(n+1))",
    matrix: bigMatrixStrings(B_BIG),
    factorization: {
      unitAdditionT: bigMatrixStrings(T_BIG),
      exchangeR: bigMatrixStrings(R_BIG),
      relation: "B=R*T for column vectors; unit addition is followed by register-role exchange"
    },
    determinant: bigDet(B_BIG).toString(),
    update: "(u,v)->(v,u+v)",
    projectiveUpdate: "x=u/v -> 1/(1+x)",
    cumulativeRecovery: "R_n=u+v-1",
    depositRecovery: "deltaPi_n=(u+v-1) phi^(-n)",
    primitivity: "gcd(F_n,F_(n+1))=1",
    rows: ledgerRows,
    minimality: {
      scope: "minimal autonomous local state for the full second-order recurrence family, without an external stage label",
      caveat: "one fixed Fibonacci orbit can be encoded by its externally supplied index n",
      collision: {
        statesWithSameCurrentRegister: [
          oneRegisterCollision.firstState.map(String),
          oneRegisterCollision.secondState.map(String)
        ],
        distinctNextStates: [firstSuccessor.map(String), secondSuccessor.map(String)]
      }
    },
    generalizedBranches
  },
  torusShape: {
    definitions: {
      periods: "omega_I, omega_R are oriented vectors representing the marked integration/circulation and return cycles",
      gram: "G_ij=omega_i dot omega_j",
      x: "G_12/G_11",
      y: "sqrt(det G)/G_11 = det(omega_I,omega_R)/|omega_I|^2 > 0",
      interpretation: "y is dimensionless oriented cell area, equivalently transverse return separation in units of the first-cycle length",
      tau: "tau=x+i y",
      shapeMatrix: "Q(tau)=G/sqrt(det G)=y^(-1)[[1,x],[x,x^2+y^2]]",
      shapeSpace: "{Q positive definite symmetric: det Q=1}=SL(2,R)/SO(2), parameterized by the upper half-plane"
    },
    periodRecoveryChecks: recoveredPeriods,
    metric: {
      coordinateFree: "g_Q(U,V)=1/2 tr(Q^(-1) U Q^(-1) V)",
      pullback: "ds^2=(dx^2+dy^2)/y^2",
      normalization: "the displayed 1/2 convention gives curvature -1 in these coordinates",
      metricChecks,
      congruenceChecks,
      modularInvariance
    },
    cuspScaleSamples
  },
  bridgeAssessment: {
    mathematicalLedger: "discharged by consecutive declared RSS multiplicities and their exact recurrence",
    seamSwap: "discharged as an involutive register-role exchange in the factorization B=R*T; not established as a separate material event",
    windingIdentification: "the recurrence ledger and torus winding coefficients are both primitive Z^2 vectors, but identifying their entries requires a marked physical channel map",
    positiveImaginaryCoordinate: "discharged as the normalized oriented area/transverse separation of the two marked torus periods",
    intrinsicMetric: "discharged on unit-area torus shape space after imposing affine basis invariance and homogeneous determinant-one shape comparison; SL(2,Z) invariance alone would not make the metric unique",
    physicalScope: "the hyperbolic geometry is the geometry of RSS two-cycle state shapes, not a derivation that physical spacetime is hyperbolic",
    remainingEmpiricalDebt: "identify observables carrying both recurrence registers and both period vectors, and test that seam passage implements the stated channel relabelling"
  }
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);

console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
console.log(`Verified ${ledgerRows.length} exact consecutive-Fibonacci ledger states and ${generalizedBranches.length} projective branches.`);
console.log("Recovered tau=x+iy from four scale-independent period Gram matrices.");
console.log(`Verified the trace metric at ${metricChecks.length} shapes, ${congruenceChecks.length} congruence maps, and ${modularInvariance.length} modular point/tangent cases.`);
console.log("Result: the two bridges close mathematically on RSS count and torus-shape state space; a physical carrier remains an empirical requirement.");
