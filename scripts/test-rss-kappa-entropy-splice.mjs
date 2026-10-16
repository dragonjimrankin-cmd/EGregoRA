#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-kappa-entropy-splice-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.newKernelDerived, false);
assert.equal(results.verdict.existingKappaKernelUsed, true);
assert.equal(results.verdict.completedXiLedgerInvariantUnderRandomReflection, true);
assert.equal(results.verdict.strictBranchEntropyContractionDerived, true);
assert.equal(results.verdict.zeroSupportContracted, false);
assert.equal(results.verdict.uniqueCriticalLineInvariantStateDerived, false);

const geometry = results.establishedGeometry;
assert.ok(Math.abs(geometry.kappaR - 1 / (4 * Math.PI ** 2)) < 1e-16);
assert.match(geometry.kernel, /K_kappa/);
assert.match(geometry.feature, /sqrt\(kappa_R\)/);
assert.match(geometry.notRederived, /previously derived/);

const phi = (1 + Math.sqrt(5)) / 2;
const channel = results.goldenRandomReflectionChannel;
assert.ok(Math.abs(channel.stayWeight - phi / 2) < 1e-15);
assert.ok(Math.abs(channel.contrast - 1 / phi) < 1e-15);
assert.deepEqual(channel.stationaryDistribution, [0.5, 0.5]);
assert.equal(channel.rows.length, 6);
assert.ok(channel.rows.every((row) => row.entropyProductionNats > 0));
assert.ok(channel.rows.every((row) => row.relativeEntropyRatio <= channel.contrast ** 2 + 2e-13));
assert.ok(channel.maxStressTestRatio <= channel.contrast ** 2 + 2e-9);
assert.match(channel.proof, /second derivative/);

const ledger = results.xiLedgerInvariance;
assert.match(ledger.functionalEquationConsequence, /R_push/);
assert.match(ledger.invariance, /S_push\(mu_xi\)=mu_xi/);
assert.match(ledger.fixedPointSet, /every reflection-symmetric measure/);
assert.match(ledger.decisiveLimitation, /branch imbalance/);

const pair = results.kappaPairGeometry;
assert.match(pair.reflectionOverlap, /zeta\(3\)/);
assert.match(pair.featureMixerNonidentity, /not v_/);
assert.equal(pair.rows.length, 5);
assert.ok(pair.rows.every((row) => row.normalizedReflectionOverlap > 0 && row.normalizedReflectionOverlap < 1));
assert.ok(pair.rows.every((row) => row.equalPairVonNeumannEntropyNats > 0));
assert.ok(pair.rows.every((row) => row.equalPairEntropyAfterCoordinateContractionNats < row.equalPairVonNeumannEntropyNats));
assert.ok(pair.rows.every((row) => row.coordinateContractionRatio < 1));
assert.ok(pair.rows.every((row) => row.randomReflectionDistanceRatioFromPlus > 1));
assert.ok(pair.rows.every((row) => row.featureMixerResidual > 0));

const reflection = results.globalReflectionAudit;
assert.equal(reflection.tests.length, 3);
assert.ok(reflection.tests.some((row) => row.absoluteDifference > 1e-3));
assert.match(reflection.conclusion, /no single global reflection unitary/);

assert.match(results.twoPassNoGo.statement, /exact involution cannot/);
assert.match(results.twoPassNoGo.proof, /lambda\^2/);
assert.match(results.twoPassNoGo.consequence, /environment/);
assert.match(results.boundedTransformBoundary.existingResult, /K_xi diverges/);
assert.match(results.boundedTransformBoundary.remainingPositivity, /RH-equivalent/);
assert.equal(results.sharpenedRequirement.requirements.length, 4);
assert.match(results.sharpenedRequirement.status, /RH remains open/);

const report = await read('docs/rh/rss-kappa-entropy-splice.md');
for (const marker of [
  'The golden binary channel',
  'Why the completed xi ledger is invariant',
  'Entropy inside the established kappa feature space',
  'The kappa distance separates mixing from movement',
  'Exact two-pass return forbids strict global contraction',
  'Why data processing cannot bypass the xi-kernel boundary',
  'The narrower remaining target',
  'RH remains open.'
]) {
  assert.ok(report.includes(marker), `kappa entropy report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const decimalPage = await read('tti/src/decimal-splice.njk');
assert.ok(decimalPage.includes('id="t-splice-entropy"'));
assert.ok(decimalPage.includes('Entropy Contracts the Branch Record, Not the Zero Support'));

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-kappa-entropy-splice"'));
assert.ok(splice.includes('Does splice entropy make the golden contraction spectral?'));
assert.ok(splice.includes('rss-kappa-entropy-splice.md'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-kappa-entropy-splice'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Entropy contracts the branch label, not horizontal support'));
assert.ok(consolidated.includes('rss-kappa-entropy-splice.md'));
assert.ok(consolidated.includes('Kappa-entropy splice attempt'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The principal-prime follow-up reduces the required conservation theorem to the single absolutely convergent anchor'));

const [oracle, mirror] = await Promise.all([
  read('tti/src/assets/js/oracle-knowledge.js'),
  read('egregora-patch/public/assets/js/oracle-knowledge.js')
]);
assert.equal(oracle, mirror);
assert.ok(oracle.includes('The entropy follow-up makes that boundary exact.'));
assert.ok(oracle.includes('#t-rh-kappa-entropy-splice'));

console.log('Kappa-entropy splice tests passed: binary data processing, xi-ledger invariance and non-contraction of zero support verified.');
