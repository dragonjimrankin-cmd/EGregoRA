#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const data = JSON.parse(await read('docs/rh/rss-prime-pair-splice-link-results.json'));
const report = await read('docs/rh/rss-prime-pair-splice-link.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.equal(data.verdict.lambda101IsPrimeSupported, true);
assert.equal(data.verdict.lambda101, 'log(101)');
assert.equal(data.verdict['101SelfPairSurvivesCenteredFisherMetric'], false);
assert.equal(data.verdict.allScalePrimePairEnergyHasExactMellinBridgeToRh, true);
assert.equal(data.verdict.criticalEnergyEstimateProved, false);
assert.equal(data.verdict.sameXiContractionInvarianceProved, false);
assert.equal(data.verdict.rhProved, false);

const fisher = data.fisherPairIdentity;
assert.ok(fisher.identity.includes('log(m/n)'));
assert.ok(fisher.identity.includes('^2'));
assert.equal(fisher.finiteCheckAtA2['101SelfPairContribution'], 0);
assert.ok(fisher.finiteCheckAtA2['101CrossPairSubtotal'] > 0);
assert.ok(Math.abs(
  fisher.finiteCheckAtA2.logVariance - fisher.finiteCheckAtA2.pairwiseLogVariance
) < 5e-13);

const energy = data.criticalChebyshevPairLedger;
assert.equal(energy.rows.length, 5);
assert.equal(energy.rows[0].X, 50);
assert.equal(energy.rows[0].diagonalContribution, 0);
for (const row of energy.rows.filter((item) => item.X >= 101)) {
  assert.equal(row.triangularWeight, row.X);
  assert.ok(Math.abs(
    row.diagonalContribution - row.X * Math.log(101) ** 2
  ) < 1e-8);
}
assert.match(energy.requiredAllScaleEstimate, /for every delta/);
assert.match(energy.status, /equivalent to RH/);

const anchor = data.actualZeroBridge;
assert.ok(anchor.certifiedUpperBound > 0);
assert.ok(anchor.certifiedUpperBound < 9.274e-37);
assert.equal(anchor.certifiedUpperBoundIsZero, false);
assert.match(anchor.criterion, /iff RH/);
assert.match(anchor['101InLinearEulerAnchor'], /Lambda\(101\)\/101\^2/);

for (const marker of [
  'Forty-fourth-stage investigation',
  'prime-pair Fisher metric',
  'Every diagonal self-pair',
  'The same diagonal in the Chebyshev pair ledger',
  'The exact all-scale prime-pair-to-zero link',
  'Direct one-point prime anchor',
  'Where the proposed same-\\(\\xi\\) bridge still breaks',
  'No new zero-free strip or RH proof was found'
]) {
  assert.ok(report.includes(marker), `101 prime-pair link report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const criticalEnergy = await read('docs/rh/rss-critical-chebyshev-energy.md');
assert.ok(criticalEnergy.includes('rss-prime-pair-splice-link.md'));
const dissipative = await read('docs/rh/rss-prime-power-dissipative-law.md');
assert.ok(dissipative.includes('rss-prime-pair-splice-link.md'));
const principalAnchor = await read('docs/rh/rss-principal-prime-anchor.md');
assert.ok(principalAnchor.includes('rss-prime-pair-splice-link.md'));
const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-prime-pair-splice-link.md'));
assert.ok(consolidated.includes('The (101,101) prime-pair term does not close same-xi contraction'));

console.log('101 prime-pair link audit passed: pairwise Fisher identity, diagonal cancellation, O(X) Chebyshev term and RH-equivalent global bridge verified.');
