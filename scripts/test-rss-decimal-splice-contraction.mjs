#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-decimal-splice-contraction-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.sameXiZeroInvarianceDerived, false);
assert.equal(results.verdict.untwistedCriticalEnergyProved, false);
assert.equal(results.verdict.exactGoldenContractionCoefficientDerived, true);
assert.equal(results.verdict.twoDescendantSeamDefectContracts, true);

const phi = (1 + Math.sqrt(5)) / 2;
const mixer = results.goldenDecimalMixer;
assert.ok(Math.abs(mixer.reflectionWeight - phi / 2) < 1e-15);
assert.ok(Math.abs(mixer.contraction - 1 / phi) < 1e-15);
assert.match(mixer.map, /2p-1/);
assert.match(mixer.interpretation, /barycentre/);
assert.match(mixer.interpretation, /support points remain/);

const seam = results.seamDefectTest;
assert.ok(seam.cSquared < 0.382);
assert.ok(seam.twoDescendantUpperFactor < 1);
assert.ok(seam.threeDescendantSmallEtaFactor > 1);
assert.equal(seam.twoDescendantsContractUniformly, true);
assert.equal(seam.threeDescendantsContractUniformly, false);
assert.equal(seam.rows.length, 6);
assert.ok(seam.rows.every((row) => row.oneDescendantRatio < seam.cSquared));
assert.ok(seam.rows.every((row) => row.twoDescendantRatio < 1));
assert.ok(seam.rows.some((row) => row.threeDescendantRatio > 1));

const central = results.centralResidueTest;
assert.equal(central.rows.length, 9);
assert.ok(central.rows.every((row) => row.twoDescendantRatio < 1));
assert.match(central.ratioFormula, /x=eta\^2\/gamma\^2/);
assert.equal(central.uniformCriticalStripBound.twoDescendantsContract, true);
assert.ok(central.uniformCriticalStripBound.xUpperBound < 0.001252);
assert.ok(central.uniformCriticalStripBound.upperFactor < 0.766);

const sameXi = results.sameXiAudit;
assert.match(sameXi.functionLevelReflectionAverage, /=xi\(s\)/);
assert.match(sameXi.zeroBarycentreWarning, /not generally another zero/);
assert.match(sameXi.horizontalMap, /nonholomorphic/);
assert.match(sameXi.holomorphicAlternative, /accumulation/);
assert.ok(Math.abs(sameXi.quartetStressTest.differences.z2) > 0);
assert.ok(Math.abs(sameXi.quartetStressTest.differences.z0) > 0);

const branches = results.branchAndProjectionAudit;
assert.match(branches.equalHalfBarycentre, /support remains/);
assert.match(branches.goldenWeightedBarycentre, /without moving/);
assert.match(branches.unitaryBoundary, /preserves total norm/);
assert.match(branches.projectionBoundary, /postselection/);

const prime = results.finitePrimeDiagnostic;
assert.equal(prime.period, 20);
assert.equal(prime.rows.length, 11);
assert.ok(prime.rows.every((row) => row.scope === 'finite diagnostic only'));
assert.ok(Math.hypot(prime.reducedResiduePhaseSumReal, prime.reducedResiduePhaseSumImag) < 1e-14);
assert.ok(prime.fourierCounterexample.modeOne < 1e-14);
assert.equal(prime.fourierCounterexample.principalMode, 20);
assert.match(prime.interpretation, /does not bound the untwisted/);

const theorem = results.conditionalTheorem;
assert.match(theorem.statement, /at most two descendants/);
assert.match(theorem.newGain, /c=1\/phi/);
assert.equal(theorem.missingPremises.length, 3);
assert.match(theorem.status, /RH remains open/);

const report = await read('docs/rh/rss-decimal-splice-contraction.md');
for (const marker of [
  'The golden decimal mixer',
  'Why the nonlinear seam defect really contracts',
  'The support-versus-barycentre obstruction',
  'Function-level reflection gives identity, not root movement',
  'Horizontal-only contraction is nonholomorphic',
  'The decimal prime phase is a different Fourier mode',
  'The sharpened conditional theorem',
  'RH remains open.'
]) {
  assert.ok(report.includes(marker), `decimal contraction report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const decimalPage = await read('tti/src/decimal-splice.njk');
assert.ok(decimalPage.includes('id="t-golden-mixer"'));
assert.ok(decimalPage.includes('π/10 Produces an Exact Golden Mixer—but Not a New Zero'));
assert.ok(decimalPage.includes('2\\varepsilon(\\eta/\\varphi)'));
assert.ok(decimalPage.includes('Stage-28 research note'));

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-decimal-splice-contraction"'));
assert.ok(splice.includes('Does π/10 close the contraction gap?'));
assert.ok(splice.includes('rss-decimal-splice-contraction.md'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-decimal-splice-contraction'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The decimal phase derives a golden barycentre, not zero transport'));
assert.ok(consolidated.includes('rss-decimal-splice-contraction.md'));
assert.ok(consolidated.includes('Decimal golden contraction attempt'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The principal-prime follow-up reduces the required conservation theorem to the single absolutely convergent anchor'));

const [oracle, oracleMirror] = await Promise.all([
  read('tti/src/assets/js/oracle-knowledge.js'),
  read('egregora-patch/public/assets/js/oracle-knowledge.js')
]);
assert.equal(oracle, oracleMirror);
assert.ok(oracle.includes('The angle also yields one exact RH candidate.'));
assert.ok(oracle.includes('#t-rh-decimal-splice-contraction'));

console.log('Decimal-splice contraction tests passed: golden barycentre, two-branch seam bound and same-xi/principal-channel obstructions verified.');
