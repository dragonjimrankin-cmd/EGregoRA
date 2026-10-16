#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const data = JSON.parse(await read('docs/rh/rss-local-prime-power-diagonal-link-results.json'));
const report = await read('docs/rh/rss-local-prime-power-diagonal-link.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.equal(data.verdict.localPositiveMomentRepresentationProved, true);
assert.equal(data.verdict.oneLocalHankelEqualityWouldImplyRh, true);
assert.equal(data.verdict.actualXiLocalHankelEqualityProved, false);
assert.equal(data.verdict.standardExplicitFormulaSuppliesTheEquality, false);
assert.equal(data.verdict.rhProved, false);
assert.equal(data.finiteChecks.primes.length, 5);
for (const row of data.finiteChecks.primes) {
  assert.ok(Math.abs(row.centralHankelDeterminant) < 2e-17);
  assert.ok(Math.abs(row.centralHankelIntegral) < 2e-17);
  assert.ok(row.stressHankelDeterminant > 0);
  assert.ok(Math.abs(row.stressHankelDeterminant - row.stressHankelIntegral)
    < Math.max(2e-20, row.stressHankelDeterminant * 2e-12));
  assert.equal(row.slowDecayRateAboveCentral, true);
  assert.equal(row.fastDecayRateBelowCentral, true);
}

for (const marker of [
  'Forty-seventh-stage investigation',
  'one-prime, three-coefficient',
  'positive moment representation',
  'P_\\xi(p)P_\\xi(p^3)=P_\\xi(p^2)^2',
  'diagonal zero-pair data',
  'No such derivation was found'
]) {
  assert.ok(report.includes(marker), `local prime-power report is missing: ${marker}`);
}
assert.match(report, /\(rs\)\^k\(r-s\)\^2/);
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const geometric = await read('docs/rh/rss-geometric-prime-reweighting.md');
assert.ok(geometric.includes('full-support fixed point'));
const pairSplice = await read('docs/rh/rss-prime-pair-splice-link.md');
assert.ok(pairSplice.includes('(101,101)'));
assert.ok(pairSplice.includes('rss-local-prime-power-diagonal-link.md'));
const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-local-prime-power-diagonal-link.md'));
assert.ok(consolidated.includes('single local prime-power Hankel equality'));

console.log('Local prime-power diagonal link passed: positive moment representation, RH-forcing Hankel equality, stress determinants and explicit-formula boundary verified.');
