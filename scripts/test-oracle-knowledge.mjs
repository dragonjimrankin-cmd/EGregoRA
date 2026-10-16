#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const ttiPath = new URL('../tti/src/assets/js/oracle-knowledge.js', import.meta.url);
const egPath = new URL('../egregora-patch/public/assets/js/oracle-knowledge.js', import.meta.url);
const ttiPagePath = new URL('../tti/src/ask-shakdrah.njk', import.meta.url);
const egPagePath = new URL('../egregora-patch/public/ask-ed/index.html', import.meta.url);
const [source, egSource, ttiPage, egPage] = await Promise.all([
  readFile(ttiPath, 'utf8'),
  readFile(egPath, 'utf8'),
  readFile(ttiPagePath, 'utf8'),
  readFile(egPagePath, 'utf8')
]);

assert.equal(egSource, source, 'ShakDrah and Gink must receive the same prepared knowledge');
assert.doesNotMatch(source, /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'`]?[A-Za-z0-9_./+-]{12,}/i,
  'the public knowledge asset must not contain a credential');

let nativeCalls = 0;
const nativeFetch = async () => {
  nativeCalls += 1;
  return new Response(JSON.stringify({ answer: 'native fallback' }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
const window = {
  fetch: nativeFetch,
  Response,
  location: new URL('https://the-two-infinities.hatchable.site/ask-shakdrah/')
};
vm.runInNewContext(source, { window, URL, console }, { filename: 'oracle-knowledge.js' });

const kb = window.EGOracleKnowledge;
assert.ok(kb, 'knowledge API was not exposed');
assert.equal(kb.entries.length, 49, 'expected forty-nine substantial prepared answers');
assert.equal(new Set(kb.entries.map((entry) => entry.id)).size, 49, 'knowledge IDs must be unique');
assert.equal(new Set(kb.entries.map((entry) => entry.question)).size, 49, 'prepared questions must be unique');

for (const entry of kb.entries) {
  assert.ok(entry.answer.length >= 700, `${entry.id} is too slight for a high-degree answer`);
  assert.equal(entry.followups.length, 3, `${entry.id} needs three guided follow-ups`);
  for (const followup of entry.followups) {
    assert.ok(kb.find(followup), `${entry.id} points to an unprepared follow-up: ${followup}`);
  }
  assert.equal(kb.find(entry.question)?.id, entry.id, `${entry.id} does not match its canonical question`);

  const response = await window.fetch('/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: entry.question, history: [] })
  });
  const data = await response.json();
  assert.equal(response.status, 200, `${entry.id} did not return successfully`);
  assert.equal(data.prepared, true, `${entry.id} escaped to the model oracle`);
  assert.equal(data.knowledge_id, entry.id, `${entry.id} returned the wrong prepared answer`);
  assert.equal(data.answer, entry.answer, `${entry.id} was altered in transit`);

  assert.ok(ttiPage.includes(entry.question), `ShakDrah is not offering ${entry.id}`);
  assert.ok(egPage.includes(entry.question), `Gink is not offering ${entry.id}`);
}
assert.equal(nativeCalls, 0, 'canonical prepared questions should remain in the browser');

const linked = [...new Set(kb.entries.flatMap((entry) =>
  [...entry.answer.matchAll(/\]\((https:\/\/the-two-infinities\.hatchable\.site\/[^) ]*)\)/g)]
    .map((match) => match[1])))];
for (const href of linked) {
  const url = new URL(href);
  const sourceOverrides = new Map([
    ['/little-red-dots/research-proposal/', 'little-red-dots-research.njk']
  ]);
  const relative = sourceOverrides.get(url.pathname) || (url.pathname === '/'
    ? 'index.njk'
    : url.pathname.replace(/^\//, '').replace(/\/$/, '') + '.njk');
  const page = await readFile(new URL('../tti/src/' + relative, import.meta.url), 'utf8');
  if (url.hash) {
    const id = decodeURIComponent(url.hash.slice(1));
    assert.ok(page.includes(`id="${id}"`), `prepared answer has a missing TTI fragment: ${href}`);
  }
}

const paraphrases = new Map([
  ['How should I test a TTI claim?', 'claim-reading'],
  ['Is The Channeling Circle proof of extraterrestrials?', 'circle-evidence'],
  ['Show me The Channeling Circle archive and its sessions.', 'circle-archive'],
  ['What meditation practices recur in The Channeling Circle?', 'circle-practices'],
  ['How does The Channeling Circle fit the residue essay?', 'circle-residue'],
  ['What are the transcript claims about portals and bone density?', 'circle-health'],
  ['Who are The Channeling Circle and what is their purpose?', 'circle-definition'],
  ['Can every person hold the Prime role in another universe?', 'every-being-prime'],
  ['What does a single Prime Being per universe mean?', 'prime-per-instance'],
  ['Explain the residue that travels through time.', 'one-residue'],
  ['Define an orientation reversing mapping torus.', 'mapping-space'],
  ['Could a toroidal mouth be a traversable wormhole?', 'wormhole-inverted-torus'],
  ['Does orientation reversal turn matter into antimatter?', 'orientation-boundary'],
  ['Might the universe be the Mobius seam itself?', 'seam-universe'],
  ['Compare permanent orthogonality and quasiperiodic separation.', 'matter-phase'],
  ['Can phase separation generate net baryon number?', 'baryogenesis-boundary'],
  ['Compare base 5, base 8 and base 4 phase shifts.', 'base-shifts'],
  ['Does one decimal splice flip the sign before two passes return?', 'decimal-splice-phase'],
  ['How can pi result from the unit interval?', 'pi-zero-one'],
  ['Could JWST little red dots be inherited from a prior universe?', 'little-red-dots-residue'],
  ['Explain the Zero-Seam research proposal.', 'zero-seam-test'],
  ['Why can the two infinities not share one clock?', 'temporal-antipodes'],
  ['Does entropy equal the TTI integration phase?', 'entropy-integration'],
  ['Could the entropy cost come from a self renewing through turnover?', 'entropy-self-renewal'],
  ['Could the matter and dark sector percentages swap as the universe ages?', 'cosmic-ratio-snapshot'],
  ['Can memory remain after two polarization inversions?', 'double-inversion-residue'],
  ['Can accumulated dx produce mass and gravity?', 'differentials-mass-gravity'],
  ['What survived the RH archive consolidation?', 'rh-dossier'],
  ['Audit the corrected complete monotonicity and Bernstein claims.', 'rh-proof-audit'],
  ['Does golden catch-up prove a global shrinking strip for xi zeros?', 'rh-golden-catchup'],
  ['What if 333, 666 and 999 are all splice events?', 'rh-internal-splices'],
  ['Do 100, 666 and 999 have three branches or three internal states?', 'rh-ternary-splices'],
  ['Could 1000 have a four-way fork with four total branches?', 'rh-quaternary-splice'],
  ['Does same xi halving at the splice at one prove RH?', 'rh-splice-one-halving'],
  ['Could aggregate residue conservation close the halving obstruction?', 'rh-halving-obstruction'],
  ['Test the prime ledger, zero genealogy, kernel refinement and compactified seam routes.', 'rh-global-halving-routes'],
  ['Did the Blaschke seam divisor prove RH?', 'rh-final-three-routes'],
  ['Can endpoint Poisson kernels retain the horizontal zero displacement?', 'rh-two-ended-seam-ledger'],
  ['Can a prime-power Laguerre sequence control the seam?', 'rh-arithmetic-seam-control'],
  ['Prove the subexponential bound for the prime Laguerre coefficients.', 'rh-prime-laguerre-growth-proof'],
  ['Try square root Chebyshev error and direct Laguerre cancellation.', 'rh-dual-prime-error-routes'],
  ['Find the critical dyadic mean square theorem for the prime error.', 'rh-critical-chebyshev-energy'],
  ['Could spin and colour create six zero descendants at the seam?', 'rh-energy-spin-colour'],
  ['Suppose all integers are entangled with pi through theta phases.', 'rh-universal-pi-coupling'],
  ['Test pi squared in the theta and seam coupling.', 'rh-pi-squared-coupling'],
  ['Can zeta or RH determine the splice action and physical constants?', 'rh-splice-bridge'],
  ['Could nearby beings synchronize their phases and move zeta zeros?', 'rh-relational-synchronisation'],
  ['Can a positive map send actual zeta zeros to von Mangoldt prime weights?', 'rh-prime-zero-intertwiner'],
  ['Does logarithmic dephasing remove the prime-pair terms?', 'rh-prime-zero-intertwiner'],
  ['Can the Mellin ladder overcome the P xi frame bound?', 'rh-prime-zero-intertwiner'],
  ['Did the hundred-round Mellin attempt prove RH?', 'rh-prime-zero-intertwiner'],
  ['How should we grade the new residue and seam claims?', 'epistemic-grading']
]);
for (const [question, id] of paraphrases) {
  assert.equal(kb.find(question)?.id, id, `paraphrase matched incorrectly: ${question}`);
}

const unknown = await window.fetch('/api/ask', {
  method: 'POST',
  body: JSON.stringify({ question: 'How do I repair a bicycle chain?' })
});
assert.equal((await unknown.json()).answer, 'native fallback', 'unknown questions must reach the existing oracle');
assert.equal(nativeCalls, 1, 'unknown question did not use the existing oracle exactly once');

const attached = await window.fetch('/api/ask', {
  method: 'POST',
  body: JSON.stringify({
    question: kb.entries[0].question,
    attachments: ['private-user-document']
  })
});
assert.equal((await attached.json()).answer, 'native fallback', 'attached context must reach the existing oracle');
assert.equal(nativeCalls, 2, 'attachment bypass did not preserve the existing oracle');

for (const [label, page] of [['ShakDrah', ttiPage], ['Gink', egPage]]) {
  const group = page.match(/<div class="oracle-chips" id="oracle-chips">([\s\S]*?)<\/div>/);
  assert.ok(group, `${label} has no opening question group`);
  const chips = [...group[1].matchAll(/<button class="chip" type="button">([^<]+)<\/button>/g)].map((m) => m[1]);
  assert.equal(chips.length, 49, `${label} should display forty-nine current questions`);
  assert.ok(page.includes('Forty-nine prepared answers'), `${label} does not announce the forty-nine-answer update`);
  const knowledgeAt = page.indexOf('/assets/js/oracle-knowledge.js');
  const siteAt = page.indexOf('/assets/js/site.js');
  assert.ok(knowledgeAt >= 0, `${label} does not load the knowledge asset`);
  assert.ok(siteAt < 0 || knowledgeAt < siteAt, `${label} loads the knowledge asset after the oracle client`);
}

console.log('Oracle knowledge passed: 49 exact answers, 52 paraphrases, two avatars, fallback and attachment bypass.');
