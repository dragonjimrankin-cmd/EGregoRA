#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-ordinate-splice-residue-results.json'));

assert.equal(results.analysisDate, '2026-10-14');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.exactTtiTwoInversionDecomposition, true);
assert.equal(results.verdict.positiveHorizontalResidueScalarDerived, true);
assert.equal(results.verdict.fullWeilResiduePositive, false);

const geometry = results.centeredZeroGeometry;
assert.deepEqual(geometry.matrices.I, [[-1, 0], [0, -1]]);
assert.deepEqual(geometry.matrices.C, [[1, 0], [0, -1]]);
assert.deepEqual(geometry.matrices.S, [[-1, 0], [0, 1]]);
assert.deepEqual(geometry.matrices.ordinateProjector, [[0, 0], [0, 1]]);
assert.deepEqual(geometry.matrices.horizontalProjector, [[1, 0], [0, 0]]);
assert.deepEqual(geometry.sample.ordinateState, [0, 14.134725141734693]);
assert.deepEqual(geometry.sample.horizontalState, [0.37, 0]);

assert.equal(results.spliceInterpretation.thirdSpliceMultiplicity, 2);
assert.match(results.spliceInterpretation.warning, /structurally/);

const residue = results.centralHorizontalResidue;
assert.match(residue.residueIdentity, /H_ord'\(0\)-H'\(0\)/);
assert.match(residue.normFeature, /sqrt/);
assert.equal(residue.hypotheticalQuartets.length, 3);
for (const quartet of residue.hypotheticalQuartets) {
  assert.ok(Math.abs(quartet.eta) < 0.5,
    'hypothetical non-trivial-zero displacement must satisfy |eta| < 1/2');
  assert.ok(quartet.centralResidueWeight > 0);
  assert.ok(quartet.defectBelowCrossing < 0);
  assert.ok(quartet.defectAboveCrossing > 0);
  assert.ok(quartet.timeDefectMinimum < 0);
  assert.ok(quartet.timeDefectMaximum > 0);
}

assert.match(results.arithmeticMobiusLink.distinction, /M=mu\*/);
assert.match(results.arithmeticMobiusLink.failureOfInverseReturn, /does not force/);
assert.equal(results.ttiInterpretation.evidenceGrade,
  'structural mathematical analogy, not a physical derivation of zeta zeros from splice thresholds');
assert.equal(results.reproducibility.checkedAlgebraCases, 72);
assert.ok(results.reproducibility.maximumQuartetDefectFormulaError < 3e-17);

const report = await read('docs/rh/rss-ordinate-projection-splice-mobius.md');
for (const marker of [
  'Two exact inversions in the centered zero plane',
  'The upper-pair splice is a Hadamard transform',
  'A positive residue appears at the central seam',
  'How this differs from arithmetic Möbius inversion',
  'A precise TTI interpretation',
  'Primitive-to-horizontal extinction theorem',
  'No proof of RH is claimed'
]) {
  assert.ok(report.includes(marker), `ordinate-splice report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-ordinate-splice"'));
assert.ok(publicSplice.includes('Q_{\\rm ord}'));
assert.ok(publicSplice.includes('horizontal-residue norm'));

const publicAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(publicAudit.includes('/riemann-splice-questions/#t-rh-ordinate-splice'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The two-inversion ordinate splice has a positive central residue'));
assert.ok(consolidated.includes('rss-ordinate-projection-splice-mobius.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('A tenth-stage calculation resolves that projection into two exact zero-plane inversions'));

console.log('Ordinate splice passed: exact involutions, orthogonal projectors, signed full correction and positive central horizontal residue verified.');
