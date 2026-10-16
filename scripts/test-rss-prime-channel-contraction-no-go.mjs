#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const data = JSON.parse(await read('docs/rh/rss-prime-channel-contraction-no-go-results.json'));
const report = await read('docs/rh/rss-prime-channel-contraction-no-go.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.ok(Math.abs(data.verdict.goldenContractionFactor - 1 / ((1 + Math.sqrt(5)) / 2)) < 1e-15);
assert.equal(data.verdict.fixedMarkovKernelExistsForOpenParameterInterval, false);
assert.equal(data.verdict.proofIsExact, true);
assert.equal(data.verdict.actualXiZeroLedgerInvarianceProved, false);
assert.equal(data.verdict.rhProved, false);

const proof = data.proof;
assert.match(proof.analyticContinuation, /holomorphic/);
assert.match(proof.firstSupportPoint, /K delta_2=delta_2/);
assert.match(proof.availableMassAtThree, /\(2\/3\)\^a/);
assert.match(proof.requiredTargetMassAtThree, /\(2\/3\)\^\(a_c\)/);
assert.match(proof.contradiction, /tends to infinity/);
assert.match(proof.scope, /discrete unknown set/);
assert.equal(data.goldenAsymptoticDiagnostics.length, 4);
assert.ok(data.goldenAsymptoticDiagnostics.every((row) => row.targetOverAvailableTailLeadingFactor > 1));
assert.ok(data.goldenAsymptoticDiagnostics.at(-1).targetOverAvailableTailLeadingFactor
  > data.goldenAsymptoticDiagnostics[0].targetOverAvailableTailLeadingFactor);

for (const marker of [
  'Forty-fifth-stage investigation',
  'Prime-index Markov channel no-go',
  'The target needs more mass at 3',
  'What the no-go does not say',
  'No new zero-free strip or RH proof is obtained'
]) {
  assert.ok(report.includes(marker), `prime-channel no-go report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const prior = await read('docs/rh/rss-prime-pair-splice-link.md');
assert.ok(prior.includes('rss-prime-channel-contraction-no-go.md'));
const primePower = await read('docs/rh/rss-prime-power-dissipative-law.md');
assert.ok(primePower.includes('rss-prime-channel-contraction-no-go.md'));
const kappa = await read('docs/rh/rss-kappa-natural-gradient-flow.md');
assert.ok(kappa.includes('rss-prime-channel-contraction-no-go.md'));
const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-prime-channel-contraction-no-go.md'));
assert.ok(consolidated.includes('No fixed prime-index Markov channel implements the golden eta contraction'));

console.log('Prime-channel contraction no-go passed: analytic continuation, first-tail asymptotics, golden case and scope boundaries verified.');
