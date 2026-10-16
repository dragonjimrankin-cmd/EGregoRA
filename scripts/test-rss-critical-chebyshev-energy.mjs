#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-critical-chebyshev-energy-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.criticalEnergyEstimateProved, false);
assert.equal(results.verdict.missingTheoremFoundAsExactEquivalent, true);
assert.equal(results.verdict.strictlyWeakerThanPointwiseSquareRootControl, true);
assert.equal(results.verdict.finiteComputationsProveAllScaleEstimate, false);

const theorem = results.criticalDyadicEnergyTheorem;
assert.match(theorem.statement, /O_delta\(X\^\(2\+delta\)\)/);
assert.match(theorem.normalizedStatement, /X\^\(o\(1\)\)/);
assert.match(theorem.equivalentWeightedStatement, /every epsilon>0/);
assert.match(theorem.status, /not proved/);

assert.match(results.whyItIsWeaker.nonConverseAtFunctionLevel, /sparse sets/);
assert.match(results.whyItIsWeaker.importantQualification, /implies RH/);
assert.match(results.mellinClosure.identity, /log\(\(s-1\)zeta\(s\)\)/);
assert.match(results.mellinClosure.cauchySchwarz, /Re\(s\)>1\/2\+epsilon/);
assert.match(results.mellinClosure.continuation, /no zero there/);

const pair = results.primePairLedger;
assert.match(pair.identity, /Lambda\(m\)Lambda\(n\)/);
assert.equal(pair.verifiedChecks.length, 6);
for (const check of pair.verifiedChecks) {
  assert.ok(check.absoluteDifference < 2e-9 * Math.max(1, check.stepIntegral));
}

const bridge = results.laguerreHilbertBridge;
assert.match(bridge.vectorGeneratingFunction, /z\(2\+z\)/);
assert.match(bridge.diskCondition, /r<c\/\(2-c\)/);
assert.match(bridge.coefficientBaseIdentity, /B_\(1\/2\+epsilon\)/);
assert.equal(bridge.thresholds.length, 5);
for (const row of bridge.thresholds) {
  assert.ok(Math.abs(row.limitingCoefficientBase - row.halfPlaneBaseAtThetaHalfPlusEpsilon) < 1e-13);
  assert.ok(row.limitingCoefficientBase > 1);
}
assert.ok(bridge.thresholds.at(-1).limitingCoefficientBase < bridge.thresholds[0].limitingCoefficientBase);
assert.match(bridge.consequence, /p_n=exp\(o\(n\)\)/);

assert.equal(results.finiteDiagnostics.length, 6);
assert.ok(results.finiteDiagnostics.every((sample) => sample.scope === 'finite diagnostic only'));
assert.match(results.whyKnownAveragesDoNotSupplyIt.distinction, /all-X critical energy/);
assert.match(results.whyKnownAveragesDoNotSupplyIt.singleExceptionalZero, /holomorphic and singular/);
assert.match(results.proofBoundary.whatRemainsUnproved, /O_delta/);
assert.match(results.proofBoundary.status, /RH remains open/);

const report = await read('docs/rh/rss-critical-chebyshev-energy.md');
for (const marker of [
  'Finding the missing theorem: critical Chebyshev energy',
  'The theorem in three equivalent arithmetic forms',
  'Why this is weaker than pointwise square-root error',
  'Mellin closure excludes one exceptional zero',
  'A finite von Mangoldt pair ledger',
  'The exact Hilbert bridge to the Laguerre coefficients',
  'Why established averages do not close it',
  'This is the missing theorem. It has been isolated, not established.',
  'RH remains open'
]) {
  assert.ok(report.includes(marker), `critical-energy report is missing: ${marker}`);
}

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-critical-chebyshev-energy"'));
assert.ok(splice.includes('What is the missing theorem?'));
assert.ok(splice.includes('X^{2+\\delta}'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-critical-chebyshev-energy'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Critical Chebyshev energy isolates the missing theorem'));
assert.ok(consolidated.includes('rss-critical-chebyshev-energy.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('twenty-four isolates the critical dyadic energy theorem'));

const oracle = await read('tti/src/assets/js/oracle-knowledge.js');
assert.ok(oracle.includes('rh-critical-chebyshev-energy'));
assert.ok(oracle.includes('What is the missing arithmetic theorem?'));

console.log('Critical Chebyshev energy passed: dyadic L2 equivalence, prime-pair ledger and Laguerre Hilbert bridge verified.');
