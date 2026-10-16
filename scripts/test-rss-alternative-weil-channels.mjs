#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-alternative-weil-channel-results.json'));

assert.equal(results.analysisDate, '2026-10-14');
assert.equal(results.verdict.exactPositiveWeilChannelDerived, false);
assert.equal(results.verdict.strongestIndependentLocalChannel, 'archimedean-weyl');
assert.equal(results.verdict.strongestArithmeticProxy, 'ordinate-projection');
assert.equal(results.verdict.sharpestRemainingExactTarget, 'recovery-witness');

const gamma = results.archimedeanWeylChannel;
assert.equal(gamma.nonnegative, true);
assert.equal(gamma.cuspCoefficient, 1);
assert.match(gamma.spectralDensity, /log\(lambda\/\(2\*pi\)\)/);
assert.ok(gamma.comparison.length >= 7);
assert.ok(gamma.comparison[0].relativeError < 1e-3);
assert.ok(gamma.comparison.at(-1).relativeError < 1e-5);
assert.ok(gamma.comparison.at(-1).targetOverTLog > gamma.comparison[0].targetOverTLog);

const ordinate = results.ordinateProjectionChannel;
assert.equal(ordinate.unconditionalPsd, true);
assert.equal(ordinate.exactUnderRH, true);
assert.equal(ordinate.equalityImpliesRH, true);
assert.ok(ordinate.horizontalDisplacementTests.every((entry) => entry.changesSign),
  'horizontal zero displacement must remain a signed correction');

const prime = results.primeWeylSamplingChannel;
assert.equal(prime.unconditionalPsd, true);
assert.equal(prime.cuspCoefficient, 1);
assert.match(prime.limitation, /delayed hinges/);

assert.equal(results.polyaChannel.unconditionalPsd, true);
assert.match(results.polyaChannel.regularity, /t\^2/);
assert.ok(results.comparisonWithThirdSplice.coefficientRatio > 50);

const score = new Map(results.channelScorecard.map((entry) => [entry.id, entry]));
for (const id of [
  'existing-rankin-green',
  'third-splice-boundary',
  'archimedean-weyl',
  'ordinate-projection',
  'prime-weyl-sampling',
  'polya-fourier',
  'explicit-formula-krein',
  'recovery-witness',
  'zero-spectrum-hilbert'
]) {
  assert.ok(score.has(id), `channel scorecard is missing ${id}`);
}
assert.equal(score.get('explicit-formula-krein').unconditionalPsd, false);
assert.equal(score.get('zero-spectrum-hilbert').circular, true);

const report = await read('docs/rh/rss-alternative-weil-channels.md');
for (const marker of [
  'Channel A: the archimedean Weyl density',
  'Channel B: project every zero to its ordinate',
  'Channel C: sample the Weyl density on prime powers',
  'Channel D: direct Pólya-kernel features',
  'Channel E: the exact signed explicit-formula space',
  'Channel F: recovery-witness residue vectors',
  'The new remaining problem'
]) {
  assert.ok(report.includes(marker), `alternative-channel report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-alternative-channels"'));
assert.ok(publicSplice.includes('\\rho_\\Gamma'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The gamma mean and ordinate projection'));
assert.ok(consolidated.includes('rss-alternative-weil-channels.md'));

console.log('Alternative Weil channels passed: gamma mean, ordinate projection, prime sampling, Pólya, signed exact and recovery channels verified.');
