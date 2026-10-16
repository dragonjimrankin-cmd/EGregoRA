#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const data = JSON.parse(await read('docs/rh/rss-global-annihilation-proof-search-results.json'));
const report = await read('docs/rh/rss-global-annihilation-proof-search.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.equal(data.verdict.conditionalGlobalAnnihilationTheoremProved, true);
assert.equal(data.verdict.unconditionalSameXiArithmeticDissipationLawFound, false);
assert.equal(data.verdict.rhProved, false);
assert.equal(data.verdict.reflectionSuppliesInvariance, true);
assert.equal(data.verdict.reflectionSuppliesStrictDissipation, false);
assert.equal(data.verdict.supportContractionSuppliesStrictDissipation, true);
assert.equal(data.verdict.supportContractionSuppliesSameXiInvariance, false);
assert.equal(data.verdict.tinyDefectPlusIntegerIndexForcesZero, false);
assert.equal(data.verdict.finiteReturnStrictContractionExistsOffCriticalLine, false);

const theorem = data.globalAnnihilationTheorem;
assert.match(theorem.proof, /\(1-q\)V/);
assert.match(theorem.arithmeticInvarianceNeeded, /T_# mu_xi=mu_xi/);
assert.match(theorem.strictDissipationNeeded, /q<1/);
assert.match(theorem.status, /implication is proved/);
assert.match(data.finiteReturnTheorem.proof, /q\^m/);
assert.match(data.finiteReturnTheorem.ttiTwoPassTest, /T\^2 eta=c\^2 eta/);
assert.match(data.finiteReturnTheorem.missingPremise, /actual xi divisor/);

const census = data.wordCensus;
assert.equal(census.lengthsTested, 8);
assert.equal(census.totalWords, 9840);
assert.equal(census.strictlyDissipativeWords, 9832);
assert.equal(census.dissipativeFiniteReturnWords, 0);
assert.equal(census.identityWordsWithoutContraction, 4);
assert.equal(census.lengthRows.length, 8);
assert.ok(census.lengthRows.every((row) => row.dissipativeFiniteReturnWords === 0));
assert.ok(census.representativeWords.some((row) => row.word === 'R' && row.finiteOrderReturn));
assert.ok(census.representativeWords.some((row) => row.word === 'RGRG' && !row.finiteOrderReturn));

const gap = data.indexDefectGapStress;
assert.equal(gap.rows.length, 5);
assert.ok(gap.rows.every((row) => row.negativeSquares === 2));
assert.ok(gap.rows.every((row, index, rows) => index === 0 || Number(row.phaseDefect) < Number(rows[index - 1].phaseDefect)));
assert.ok(Number(gap.rows.at(-1).phaseDefect) < 1e-40);
assert.deepEqual(gap.rows.at(-1).unweightedReflectionEigenvalues, ['1', '-1']);
assert.equal(gap.normalizedTraceRows.length, 5);
assert.ok(gap.normalizedTraceRows.every((row) => !row.traceClassUniformlyBoundedAsQuartetsGrow));

assert.equal(data.candidateLawGates.length, 9);
assert.ok(!data.candidateLawGates.some((row) =>
  row.sameXiDivisorInvariant === true && row.strictHorizontalDefectDissipation === true));
assert.ok(data.candidateLawGates.some((row) => row.candidate === 'de Bruijn-Newman heat flow'));
assert.match(data.stripMapNoGo.statement, /Schwarz/);
assert.equal(data.deBruijnNewmanGate.knownLowerBound, 'Lambda>=0');
assert.match(data.deBruijnNewmanGate.rhCriterion, /Lambda=0/);
assert.match(data.nextNarrowTarget.statement, /fixed von Mangoldt ledger/);
assert.match(data.status, /RH-strength step/);

for (const marker of [
  'Thirty-eighth-stage investigation',
  'The two-pass proof',
  'Exhaustive return-versus-contraction test',
  'Holomorphic return has the same obstruction',
  'Why the exact tiny defect and integer index do not close the proof',
  'The de Bruijn--Newman comparison',
  'The global-annihilation implication is proved; a same-'
]) {
  assert.ok(report.includes(marker), `global-annihilation report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const transport = await read('docs/rh/rss-relational-defect-transport.md');
assert.ok(transport.includes('rss-global-annihilation-proof-search.md'));
const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-global-annihilation-proof-search.md'));
assert.ok(consolidated.includes('Global annihilation has a proof theorem but no same-xi arithmetic law'));

console.log('Global-annihilation proof search passed: Lyapunov theorem, finite-return no-go, 9,840-word census, index-gap stress and heat-flow gate verified.');
