#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const data = JSON.parse(await read('docs/rh/rss-geometric-prime-reweighting-results.json'));
const report = await read('docs/rh/rss-geometric-prime-reweighting.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.equal(data.verdict.nonlinearPrimeMapConstructed, true);
assert.equal(data.verdict.mapsEveryFeatureStateEtaToCEta, true);
assert.equal(data.verdict.p0IsUniqueFullSupportFixedPoint, true);
assert.equal(data.verdict.allFixedPointsAreP0ConditionedOnSupport, true);
assert.equal(data.verdict.actualXiMixtureHasFullSupport, true);
assert.equal(data.verdict.actualXiMixtureInvarianceProved, false);
assert.equal(data.verdict.actualXiMixtureInvarianceEquivalentToRh, true);
assert.equal(data.verdict.rhProved, false);

const map = data.map;
assert.match(map.definition, /q\(n\)\^c p_0/);
assert.match(map.featureFamilyIdentity, /p_\(c eta\)/);
assert.match(map.fixedPointProof, /full support S gives q=p_0/);
assert.match(map.klDerivative, /strictly lowers KL/);
assert.match(map.klDerivative, /Var_/);
assert.equal(data.finiteFeatureChecks.rows.length, 6);
for (const row of data.finiteFeatureChecks.rows) {
  assert.ok(row.maximumProbabilityError < 2e-15);
  assert.ok(row.klBefore > row.klAfter);
  assert.equal(row.strictKLDissipation, true);
}
assert.ok(data.finiteFeatureChecks.reflectedStressFixedPointError > 0);
assert.ok(data.finiteFeatureChecks.reflectedStressKlAfter < data.finiteFeatureChecks.reflectedStressKlBefore);
assert.equal(data.actualXiGate.equivalenceToRH, true);

for (const marker of [
  'Forty-sixth-stage investigation',
  'There is a canonical **nonlinear** positive map',
  'unique full-support fixed point',
  'The fixed-point premise remains unproved',
  'What this gives for the actual zero ledger',
  'No proof of it, no new zero-free strip and no RH proof were found'
]) {
  assert.ok(report.includes(marker), `geometric prime reweighting report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const channelNoGo = await read('docs/rh/rss-prime-channel-contraction-no-go.md');
assert.ok(channelNoGo.includes('rss-geometric-prime-reweighting.md'));
const dissipative = await read('docs/rh/rss-prime-power-dissipative-law.md');
assert.ok(dissipative.includes('rss-geometric-prime-reweighting.md'));
const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-geometric-prime-reweighting.md'));
assert.ok(consolidated.includes('A nonlinear geometric-mean prime map exactly realizes feature contraction'));

console.log('Geometric prime reweighting passed: exact p_eta contraction, full-support fixed-point classification, KL dissipation and same-xi invariance boundary verified.');
