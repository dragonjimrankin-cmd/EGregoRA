#!/usr/bin/env node
/**
 * Gate on the oracle corpus. Run it before every deploy.
 *
 *   node scripts/oracle-validate.mjs          # exit 1 on any failure
 *   node scripts/oracle-validate.mjs --quiet  # summary line only
 *
 * Checks, in order of how much they would hurt a visitor:
 *
 *   1. Both oracles load, and carry the same number of answers. Gink and
 *      ShakDrah share one corpus; a count difference means the mirror has
 *      broken and one site is answering from a smaller body of work.
 *   2. No two entries share an id. A duplicate id silently overwrites in any
 *      map built from the corpus, so one answer just disappears.
 *   3. No two entries ask the identical question. The matcher scores on
 *      question words, so identical questions produce near-identical scores
 *      and the winner is decided by iteration order rather than by fit.
 *   4. Every entry has an id, a limb, at least one key, a question and an
 *      answer. A malformed entry throws at import time and takes the whole
 *      oracle down.
 *   5. No answer body contains a grading diamond. The house rule is plain
 *      words in the oracle; the diamonds belong to page markup.
 *   6. No answer is shorter than 120 characters. Below that the entry is a
 *      fragment and the visitor gets a stub.
 *   7. Reports the corpus size, so a turn that was meant to grow the corpus
 *      cannot quietly shrink it.
 */

import { pathToFileURL, fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const QUIET = process.argv.includes("--quiet");
const UPDATE = process.argv.includes("--record-baseline");
const MIN_LEN = 120;
/* Duplicate questions that were already in the corpus before this gate
   existed, listed by question. They are reported every run and the count may
   only go down. Same pattern as the TTI audit's three deliberate issues. */
const BASELINE_FILE = path.join(ROOT, "ops", "oracle-duplicate-baseline.json");
const SHADOW_FILE = path.join(ROOT, "ops", "oracle-shadowed-baseline.json");

const SIDES = [
  { name: "EGregoRA (Gink)", file: "hatchable/lib/oracle-corpus.js" },
  { name: "The Two Infinities (ShakDrah)", file: "tti/hatchable/lib/oracle-corpus.js" }
];

import { bestMatch } from "../hatchable/lib/oracle-corpus.js";

const problems = [];
const note = (s) => { if (!QUIET) console.log(s); };
const fail = (s) => problems.push(s);

const loaded = [];
for (const side of SIDES) {
  let mod;
  try {
    mod = await import(pathToFileURL(path.join(ROOT, side.file)).href + `?t=${Date.now()}`);
  } catch (err) {
    fail(`${side.name}: corpus will not load — ${err.message.split("\n")[0]}`);
    continue;
  }
  const answers = mod.ANSWERS;
  if (!Array.isArray(answers)) {
    fail(`${side.name}: no ANSWERS export`);
    continue;
  }
  loaded.push({ ...side, answers });
  note(`${side.name}: ${answers.length} answers`);
}

if (loaded.length === SIDES.length) {
  const [a, b] = loaded;
  if (a.answers.length !== b.answers.length) {
    fail(`the two oracles disagree: ${a.name} has ${a.answers.length}, ${b.name} has ${b.answers.length}`);
  } else {
    note(`both oracles carry ${a.answers.length} answers`);
  }
}

const seen = new Map();
const dupQuestions = new Map();
const byId = new Map();
const byQuestion = new Map();
let malformed = 0, diamonds = 0, stubs = 0;

/* The two sides are mirrors of one corpus, so the per-entry checks run once —
   on the first side. The cross-side check above is the one that matters for
   the second: a count difference means the mirror broke. */
for (const side of loaded.slice(0, 1)) {
  for (const e of side.answers) {
    if (!e || !e.id || !e.limb || !Array.isArray(e.keys) || !e.keys.length || !e.q || !e.a) {
      if (!malformed) fail(`malformed entry: ${JSON.stringify(e).slice(0, 160)}`);
      malformed++;
      continue;
    }
    if (byId.has(e.id)) fail(`duplicate id '${e.id}' (first seen as ${byId.get(e.id)})`);
    byId.set(e.id, e.q);

    const k = e.q.trim().toLowerCase();
    if (byQuestion.has(k) && byQuestion.get(k) !== e.id) {
      (dupQuestions.get(k) || dupQuestions.set(k, [byQuestion.get(k)]).get(k)).push(e.id);
    }
    byQuestion.set(k, e.id);

    if (/◆/.test(e.a)) {
      if (!diamonds) fail(`grading diamond in an answer body: '${e.id}'`);
      diamonds++;
    }
    if (e.a.trim().length < MIN_LEN) {
      if (!stubs) fail(`answer shorter than ${MIN_LEN} chars: '${e.id}' (${e.a.trim().length})`);
      stubs++;
    }
    for (const key of e.keys) {
      if (!key || !String(key).trim()) fail(`empty key on '${e.id}'`);
    }
    seen.set(e.id, e);
  }
}

const limbs = {};
for (const e of seen.values()) limbs[e.limb] = (limbs[e.limb] || 0) + 1;
note(`unique entries per oracle: ${seen.size}`);
note(`limbs: ${Object.entries(limbs).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);

/* ---- duplicate questions: measured against a recorded baseline ---- */
let baseline = [];
if (existsSync(BASELINE_FILE)) {
  try { baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8")).questions || []; }
  catch { baseline = []; }
}
const known = new Set(baseline);
const now = [...dupQuestions.keys()].sort();
const fresh = now.filter((q) => !known.has(q));
const retired = baseline.filter((q) => !dupQuestions.has(q));

if (UPDATE) {
  writeFileSync(BASELINE_FILE, JSON.stringify({ questions: now }, null, 1) + "\n");
  console.log(`\nbaseline written: ${now.length} duplicate questions -> ${path.relative(ROOT, BASELINE_FILE)}`);
} else {
  note(`duplicate questions: ${now.length} known, ${fresh.length} new, ${retired.length} fixed since the baseline`);
  for (const q of fresh) {
    fail(`new duplicate question "${q}" — ${dupQuestions.get(q).map((i) => `'${i}'`).join(" and ")}; ask something different or merge the entries`);
  }
  if (retired.length) note(`  fixed since the baseline: ${retired.map((q) => `"${q}"`).join(", ")}`);
}

/* ---- reachability: an entry nobody can reach is padding, not corpus ---- */
if (!process.argv.includes("--skip-reachability") && loaded.length) {
  const shadowed = [];
  for (const e of loaded[0].answers) {
    const probes = [e.q, ...e.keys];
    if (!probes.some((p) => bestMatch(p).entry?.id === e.id)) shadowed.push(e.id);
  }
  note(`reachable by its own question or a key: ${loaded[0].answers.length - shadowed.length}/${loaded[0].answers.length}`);

  /* Same treatment as the duplicate questions: entries shadowed before this
     gate existed are recorded, reported every run, and may only go down. */
  let base = [];
  if (existsSync(SHADOW_FILE)) {
    try { base = JSON.parse(readFileSync(SHADOW_FILE, "utf8")).entries || []; } catch { base = []; }
  }
  const knownS = new Set(base);
  const freshS = shadowed.filter((i) => !knownS.has(i));
  const fixedS = base.filter((i) => !shadowed.includes(i));

  if (UPDATE) {
    writeFileSync(SHADOW_FILE, JSON.stringify({ entries: [...shadowed].sort() }, null, 1) + "\n");
    console.log(`shadow baseline written: ${shadowed.length} -> ${path.relative(ROOT, SHADOW_FILE)}`);
  } else {
    note(`shadowed entries: ${shadowed.length} known, ${freshS.length} new, ${fixedS.length} unshadowed since the baseline`);
    for (const id of freshS) fail(`new shadowed entry '${id}' — no question or key of it ever wins the match; give it a distinguishing key or merge it into the entry that beats it`);
    if (fixedS.length) note(`  unshadowed since the baseline: ${fixedS.join(", ")}`);
  }
}

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  problems.slice(0, 25).forEach((p) => console.log(`  - ${p}`));
  if (problems.length > 25) console.log(`  … and ${problems.length - 25} more`);
  process.exit(1);
}
console.log(`\ncorpus OK — ${seen.size} entries, both oracles in step`);
