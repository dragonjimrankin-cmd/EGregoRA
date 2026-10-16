#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-xi-ledger-stationarity-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.sameXiStationarityProved, false);
assert.equal(results.verdict.stationarityEquivalentToRh, true);
assert.equal(results.verdict.functionalEquationSufficient, false);
assert.equal(results.verdict.centralNormalizationSufficient, false);
assert.equal(results.verdict.kappaGeometrySufficient, false);
assert.equal(results.verdict.principalPrimeStationarityProved, false);

const equivalence = results.stationarityEquivalence;
assert.match(equivalence.statement, /RH iff/);
assert.match(equivalence.reverseFiniteHeight, /M2=0/);
assert.match(equivalence.reverseDiscrete, /accumulating/);

const weak = results.weakGeneratorAudit;
assert.match(weak.generator, /-eta partial_eta/);
assert.match(weak.quadraticTest, /-2eta\^2/);
assert.equal(weak.examples.length, 3);
assert.equal(weak.examples[0].weaklyStationaryForQuadraticTest, true);
assert.ok(weak.examples.slice(1).every((row) => row.weaklyStationaryForQuadraticTest === false));

const quartet = results.quartetFirstVariation;
assert.match(quartet.derivative, /4eta\^2/);
assert.equal(quartet.preservedWithoutStationarity.length, 4);
assert.equal(quartet.rows.length, 3);
assert.ok(quartet.rows.every((row) => Math.abs(row.infinitesimalDerivative.z2) > 0));
assert.ok(quartet.rows.every((row) => Math.abs(row.infinitesimalDerivative.z0) > 0));
assert.ok(quartet.rows.every((row) => row.centralNormalizedVariations.some((item) => Math.abs(item.timeDerivativeLogCentralNormalizedFactor) > 1e-12)));

const residue = results.centralResidueDissipation;
assert.match(residue.derivative, /-8x\(3-x\)/);
assert.equal(residue.rows.length, 9);
assert.ok(residue.rows.every((row) => row.timeDerivative < 0));
assert.ok(residue.rows.every((row) => row.goldenStepRatio < 1));
assert.ok(residue.syntheticLedger.timeDerivative < 0);
assert.ok(residue.syntheticLedger.goldenStepResidue < residue.syntheticLedger.residue);
assert.match(residue.stationarityConsequence, /force RH/);

assert.match(results.functionLevelAudit.poleArgument, /nonzero principal part/);
assert.match(results.functionLevelAudit.status, /unless RH already holds/);
assert.match(results.primeSideAudit.requiredIdentity, /Re\(s\)>1/);
assert.match(results.primeSideAudit.failure, /no Euler-product identity/);
assert.equal(results.routeAudit.length, 4);
assert.match(results.status, /RH remains open/);

const report = await read('docs/rh/rss-xi-ledger-stationarity.md');
for (const marker of [
  'Even weak stationarity is already sufficient',
  'First variation of one completed quartet',
  'A convergent aggregate has strict negative variation',
  'Why functional symmetry is insufficient',
  'The function-level and prime-side requirements',
  'Routes tested',
  'Final status',
  'RH remains open.'
]) {
  assert.ok(report.includes(marker), `xi stationarity report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const decimalPage = await read('tti/src/decimal-splice.njk');
assert.ok(decimalPage.includes('id="t-xi-stationarity"'));
assert.ok(decimalPage.includes('Stationarity Is Exactly the Remaining RH Theorem'));

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-xi-ledger-stationarity"'));
assert.ok(splice.includes('Can the actual ξ ledger be proved stationary?'));
assert.ok(splice.includes('rss-xi-ledger-stationarity.md'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-xi-ledger-stationarity'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Xi-ledger stationarity is exactly RH'));
assert.ok(consolidated.includes('rss-xi-ledger-stationarity.md'));
assert.ok(consolidated.includes('Completed xi-ledger stationarity attempt'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The principal-prime follow-up reduces the required conservation theorem to the single absolutely convergent anchor'));

const [oracle, mirror] = await Promise.all([
  read('tti/src/assets/js/oracle-knowledge.js'),
  read('egregora-patch/public/assets/js/oracle-knowledge.js')
]);
assert.equal(oracle, mirror);
assert.ok(oracle.includes('The stationarity attempt then tests the actual completed xi ledger.'));
assert.ok(oracle.includes('#t-rh-xi-ledger-stationarity'));

console.log('Xi-ledger stationarity tests passed: RH equivalence, quartet motion, residue dissipation and prime-side boundary verified.');
