#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-arithmetic-seam-control-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.exactArithmeticControllerFound, true);
assert.equal(results.verdict.controllerUsesAbsolutelyConvergentPrimeSeriesAtEachFixedIndex, true);
assert.equal(results.verdict.allIndexSubexponentialBoundProved, false);
assert.equal(results.verdict.seamInfimumForcedToOne, false);

const obstruction = results.analyticTestObstruction;
assert.match(obstruction.statement, /no single holomorphic Weil test/);
assert.match(obstruction.reason, /harmonicity gives f''\(y\)=0/);
assert.match(obstruction.consequence, /all-index family/);

const map = results.generalizedLiMap;
assert.equal(map.parameter, -1);
assert.equal(map.basePoint, 2);
assert.equal(map.scale, 3);
assert.match(map.coordinate, /\(s\+a-1\)\/\(s-a\)/);
assert.match(map.inverse, /2\+3z\/\(1-z\)/);
assert.match(map.criticalLineProperty, /=1/);
assert.match(map.functionalPair, /inside the unit disk/);

const generating = results.arithmeticGeneratingFunction;
assert.match(generating.function, /\(s_a\(z\)-1\) zeta/);
assert.match(generating.series, /p_\{n,a\}/);
assert.match(generating.radiusStatement, /radius is one exactly under RH/);
assert.match(generating.growthCriterion, /limsup/);
assert.match(generating.subexponentialForm, /epsilon/);

const prime = results.primeCoefficientFormula;
assert.match(prime.general, /Lambda\(m\)/);
assert.match(prime.general, /L_\(n-1\)\^\(1\)/);
assert.match(prime.aEqualsMinusOne, /m\^\(-2\)/);
assert.match(prime.absoluteConvergence, /converges absolutely/);
assert.match(prime.endpointTerm, /zeta pole/);
assert.match(prime.hardEstimate, /subexponential/);

const diagnostics = results.coefficientDiagnosticsAtAEqualsMinusOne;
assert.equal(diagnostics.table.length, 10);
const expected = [
  0.20719869459000203,
  0.8258355452602285,
  1.8471347627589843,
  3.256805566280704,
  5.0355310855416315,
  7.159624662525872,
  9.601826853057695,
];
for (const [entry, reference] of diagnostics.table.slice(0, 7).map((entry, index) => [entry, expected[index]])) {
  assert.ok(Math.abs(entry.generalizedLiCoefficient - reference) < 1e-8);
  assert.ok(Math.abs(entry.reconstructionError) < 1e-6);
}
assert.ok(diagnostics.table.every((entry) => Number.isFinite(entry.completedPrimeCoefficient)));
assert.match(diagnostics.status, /does not establish all-index growth/);

const seam = results.seamConnection;
assert.match(seam.liRadialExponent, /atanh/);
assert.match(seam.relationship, /all-index coefficient growth amplifies/);
assert.equal(seam.fixedControllerStressDetection.length, 4);
for (let index = 1; index < seam.fixedControllerStressDetection.length; index += 1) {
  assert.ok(
    seam.fixedControllerStressDetection[index].fixedBasePointAEqualsMinusOne.eFoldCoefficientIndex
      > seam.fixedControllerStressDetection[index - 1].fixedBasePointAEqualsMinusOne.eFoldCoefficientIndex
  );
}
assert.ok(
  seam.fixedControllerStressDetection[0].fixedBasePointAEqualsMinusOne.eFoldCoefficientIndex > 900_000
);
assert.ok(
  Math.abs(
    seam.firstZeroQuarterDisplacement.mappedRadius
      * seam.functionalReflectionQuarterDisplacement.mappedRadius - 1
  ) < 1e-14
);
assert.match(seam.optimizedBasePoint, /(?:does not provide|supplies).*one uniform proof/);

const control = results.completedControlStatement;
assert.match(control.sufficientArithmeticTheorem, /exp\(o\(n\)\)/);
assert.match(control.consequence, /two-ended seam infimum equal to one/);
assert.match(control.currentStatus, /not proved/);

const report = await read('docs/rh/rss-arithmetic-seam-control.md');
for (const marker of [
  'Finding an arithmetic controller for the two-ended seam',
  'Why one ordinary explicit-formula test cannot equal the seam defect',
  'Move the arithmetic expansion into the Euler half-plane',
  'Endpoint-complete the prime function first',
  'Exact prime-power formula',
  'The concrete controller at',
  'Relation to the ordinary generalized Li coefficients',
  'How an escaping zero reaches the arithmetic controller',
  'What has and has not been controlled',
  'No proof of RH is obtained'
]) {
  assert.ok(report.includes(marker), `arithmetic seam-control report is missing: ${marker}`);
}

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-arithmetic-seam-control"'));
assert.ok(splice.includes('Can primes control the two-ended seam?'));
assert.ok(splice.includes('L_{n-1}^{(1)}'));
assert.ok(splice.includes('e^{o(n)}'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-arithmetic-seam-control'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The seam now has an exact arithmetic controller'));
assert.ok(consolidated.includes('rss-arithmetic-seam-control.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('twenty-one its prime controller'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-arithmetic-seam-control'));
assert.ok(oracle.includes('Did the two-ended seam acquire arithmetic control?'));

console.log('Arithmetic seam control passed: generalized Li map, prime Laguerre controller and unproved growth bound verified.');
