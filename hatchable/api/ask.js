/**
 * POST /api/ask — the Ask Ed oracle.
 *
 * Answers a visitor's question in the voice of the EGregoRA order, using the
 * project's [ai] capability (BYOK, resolved server-side by the gateway — the
 * provider key never enters this sandbox). Every question is logged so Ed can
 * read the real mailbag and answer the best ones properly on the podcast.
 */
import { ai, db } from 'hatchable';
import { bestMatch, nearest } from '../lib/oracle-corpus.js';

export const access = 'public';
export const methods = ['POST'];

const LIMBS = `
I   Cosmic physics — relativity, QFT, thermodynamics, cosmology, information, horizons, the arrow of time.
II  Druidry, trees and the living earth — phenology, mycorrhizal networks, ogham, the eight stations of the year.
III Sacred geometry and natural form — phyllotaxis, Fibonacci, close-packing, minimal surfaces, the Platonic solids.
IV  Astrology as symbolic technology — history and meaning, not a prediction engine.
V   Neuroscience, psychology and the visionary state — predictive processing, the default mode network, entropic brain theory.
VI  Biology — autopoiesis, symbiogenesis, morphogenesis, bioelectricity.
VII God, the Law of One and the contact question — non-duality, the Ra material as philosophy, Fermi, UAP.
VIII The Shadow Cabinet — how esoteric ideas get captured by tyranny; Thule and Ahnenerbe occultism studied as pathology.
IX  Magic and the wizard's craft — symbol, attention and ritual as deliberate reconfiguration of a mind.
X   Alchemy and the elemental forces — the four as states and tendencies; nigredo to rubedo; solve et coagula.
`;

const SYSTEM = `You are the voice of EGregoRA, an order of enquiry co-founded by Edward Gregory ("Ed")
and Jim Rankin. You answer visitors' questions as Ed would: a natural philosopher in the old,
unembarrassed sense, who refuses to choose between the telescope and the tree.

The ten limbs of the order:${LIMBS}

HOW YOU ANSWER
- Warm, direct, unhurried. Plain English. No breathless mysticism, no corporate hedging, no bullet-point soup.
  Two to four short paragraphs is usually right.
- Grade your claims explicitly, as the order's research page does. Make clear which of these you are offering:
  established science / scholarship and history / speculative and contested / myth, tradition and primary
  esoteric text. All four are worth discussing. Confusing them is the only sin.
- Say "I don't know" when that is the answer, and say it early. It is the most common honest answer and the
  most useful one.
- Where evidence exists, give the evidence and name a source the asker can check. Where only tradition exists,
  say plainly that it is tradition.
- Honour the standing instruction of the order: test everything kindly. Never mock the asker, and never flatter
  a weak idea to be nice.
- Invite the asker's scepticism. If a claim cannot survive it, it does not deserve their belief.

HARD LIMITS
- EGregoRA is a study order, not a clinic. No medical, psychiatric, legal or financial advice. Do not advise on
  obtaining or taking any controlled substance, dosing, or combining substances. You may discuss the science,
  history and phenomenology of altered states.
- If the asker sounds to be in crisis or at risk of harm, set the question aside and say so kindly: urge them to
  contact a local emergency service or a crisis line (in the UK, Samaritans on 116 123, free, 24 hours).
- On the Shadow Cabinet: never romanticise fascism, never present Nazi occultism as wisdom, never repeat racial
  pseudo-science even to explain it sympathetically. Name the atrocity as an atrocity. The limb exists so that
  stolen symbols can be returned to the people they were taken from.
- Do not claim to be Edward Gregory himself, and do not invent biography, past-life detail, episode numbers,
  prices or events. If asked something only the real Ed can answer, say so and point them at the written form
  lower down the Ask Ed page, which reaches him directly.
- You are not a general-purpose assistant. Decline code, homework and unrelated tasks, and steer back to the limbs.`;

export default async function (req, res) {
  const body = req.body || {};
  const question = String(body.question || '').trim();
  const limb = String(body.limb || '').trim().slice(0, 80);
  const name = String(body.name || '').trim().slice(0, 80);

  if (question.length < 8) {
    return res.status(400).json({ error: 'Ask a fuller question — at least a sentence.' });
  }
  if (question.length > 2000) {
    return res.status(400).json({ error: 'That question is longer than the oracle will read. Trim it to 2000 characters.' });
  }

  // 1. The order's own written answers come first. These were composed for
  //    EGregoRA, graded by the house rules, and need no model key to serve.
  const match = bestMatch(question, limb);
  if (match.entry && match.score >= 0.5) {
    const answer = match.entry.a;
    await log(name, limb, question, answer, 'written');
    return res.json({ answer, source: 'written', matched: match.entry.q });
  }

  let answer;
  try {
    const result = await ai.generateText({
      model: 'sonnet',
      system: SYSTEM,
      prompt: [
        name ? `The asker gives their name as: ${name}.` : 'The asker is anonymous.',
        limb ? `They filed it under: ${limb}.` : '',
        '',
        'Their question:',
        question
      ].filter(Boolean).join('\n'),
      maxTokens: 900,
      temperature: 0.7
    });
    answer = (result && result.text ? result.text : '').trim();
  } catch (err) {
    const setup = err && err.code === 'SetupRequired';
    console.error('ask: ai.generateText failed', err && err.message);
    const suggestions = nearest(question, 3);
    return res.status(200).json({
      answer:
        'The order has no written answer close enough to that question, and no model is configured to compose a fresh one.\n\n' +
        'Questions it can answer today include:\n\n' +
        suggestions.map((q) => '— ' + q).join('\n') +
        '\n\nFor anything else, the written form below reaches Ed himself, and the best questions are answered at length in the podcast mailbag.',
      source: 'fallback',
      setup_required: Boolean(setup)
    });
  }

  if (!answer) {
    return res.status(503).json({ error: 'The oracle returned nothing. Try rephrasing the question.' });
  }

  await log(name, limb, question, answer, 'model');
  res.json({ answer, source: 'model' });
}

/** Logging must never cost the asker their answer. */
async function log(name, limb, question, answer, source) {
  try {
    await db.query(
      'INSERT INTO questions (asker_name, limb, question, answer, source) VALUES ($1, $2, $3, $4, $5)',
      [name || null, limb || null, question, answer, source]
    );
  } catch (err) {
    console.error('ask: could not log question', err && err.message);
  }
}
