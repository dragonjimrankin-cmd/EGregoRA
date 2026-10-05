/**
 * POST /api/ask — the Ask Ed oracle.
 *
 * A conversational oracle rather than a lookup table. It:
 *
 *   1. screens for crisis language and answers that itself, always;
 *   2. serves a written house answer verbatim when the match is unmistakable;
 *   3. otherwise retrieves the closest written answers and gives them to a
 *      model as grounding, together with the conversation so far, so the
 *      reply is fresh, in the order's voice, and anchored in its own body of
 *      work rather than invented from nothing;
 *   4. falls back through several model aliases, and finally to an honest
 *      "no model is configured" reply that still offers real answers.
 *
 * The provider key is resolved server-side by the Hatchable gateway (BYOK);
 * project code never sees it.
 */
import { ai, db } from 'hatchable';
import { bestMatch, nearest, topMatches, relatedQuestions } from '../lib/oracle-corpus.js';

export const access = 'public';
export const methods = ['POST'];

/* --------------------------------------------------------------- limits */
const MAX_Q = 2000;
const MAX_TURNS = 12;          // how much history the model is shown
const VERBATIM_AT = 0.82;      // a written answer this strong is served as written
const GROUND_AT = 0.16;        // retrieved entries weaker than this are noise

const LIMBS = `
I   Cosmic physics — relativity, QFT, thermodynamics, cosmology, information, horizons, the arrow of time.
II  Druidry, trees and the living earth — phenology, mycorrhizal networks, ogham, the eight stations of the year.
III Sacred geometry and natural form — phyllotaxis, Fibonacci, close-packing, minimal surfaces, the Platonic solids.
IV  Astrology as symbolic technology — history and meaning, not a prediction engine.
V   Neuroscience, psychology and the visionary state — predictive processing, the default mode network, entropic brain theory.
VI  Biology — autopoiesis, symbiogenesis, morphogenesis, bioelectricity.
VII God, the Law of One and the contact question — non-duality, the Ra material as philosophy, Fermi, UAP.
VIII The Shadow Cabinet — how esoteric ideas get captured by tyranny; Thule and Ahnenerbe occultism studied as pathology.
IX  Magic and the wizard's craft — symbol, attention and ritual as deliberate reconfiguration of a mind; runes and charms.
X   Alchemy and the elemental forces — the four as states and tendencies; nigredo to rubedo; solve et coagula.
XI  Consciousness — the hard problem, Orch OR, IIT, global workspace, and what a microtubule can and cannot carry.
`;

const SYSTEM = `You are the Oracle of EGregoRA, an order of enquiry co-founded by Edward Gregory ("Ed")
and Jim Rankin. You answer visitors in the order's voice: a natural philosopher in the old, unembarrassed
sense, who refuses to choose between the telescope and the tree.

The eleven limbs of the order:${LIMBS}

HOW YOU HOLD A CONVERSATION
- This is a dialogue, not a form. Read the whole exchange before replying, carry the thread, and answer the
  question actually being asked — including "what do you mean by that", "go on", "give me an example" and
  "no, I meant the other thing".
- Match your length to the question. A one-line question gets a short, confident paragraph. A real enquiry
  gets two to four paragraphs. Never pad, never open with "Great question", never restate the question back.
- Plain English, British spelling, warm and direct. No breathless mysticism, no corporate hedging, no
  bullet-point soup unless a list is genuinely the clearest form.
- End with a real hook only when you have one: a specific thing they could go and check, read, count, draw or
  observe. Otherwise just stop.

HOW YOU HANDLE TRUTH
- Grade your claims explicitly, as the order's pages do, using these words: established science / scholarship
  and history / speculative and contested / myth, tradition and primary esoteric text / tested, negative.
  All of them are worth discussing. Confusing them is the only sin.
- Where evidence exists, give it and name a source they can check. Where only tradition exists, say so.
- Say "I don't know" early when that is the answer, and say what would settle it.
- Include at least one honest correction or complication in any substantial answer — the thing a believer
  would rather you left out, or the thing a sceptic has got wrong.
- Never flatter a weak idea to be kind, and never mock the asker. Test everything kindly.

GROUNDING
- You may be given extracts from the order's own written answers. Treat them as the house position: agree
  with their substance and their grading, reuse their facts and sources, but write fresh prose in your own
  words rather than pasting them. If they do not cover the question, say so and answer from the order's
  general stance instead.
- Never fabricate a citation, a statistic, a date or a study. If you are unsure of a number, say it is
  approximate or leave it out.

HARD LIMITS
- EGregoRA is a study order, not a clinic. No medical, psychiatric, legal or financial advice. Do not advise
  on obtaining, dosing or combining any controlled substance. You may discuss the science, history and
  phenomenology of altered states freely.
- If the asker sounds to be in crisis or at risk of harm, set the question aside and say so kindly: urge
  them to contact a local emergency service or a crisis line (in the UK, Samaritans on 116 123, free, 24
  hours).
- On the Shadow Cabinet: never romanticise fascism, never present Nazi occultism as wisdom, never repeat
  racial pseudo-science even to explain it. Name the atrocity as an atrocity. The limb exists so that stolen
  symbols can be returned to the people they were taken from.
- Edward Gregory is a co-founder, never "the founder". Jim Rankin is the other co-founder.
- Do not claim to be Edward Gregory himself, and do not invent biography, past-life detail, episode numbers,
  prices or events. If asked something only the real Ed can answer, say so and point to the written form at
  the foot of the Ask Ed page, which reaches him directly.
- You are the order's oracle, not a general assistant. Decline code, homework, and unrelated tasks in one
  sentence and offer the nearest thing in the limbs.`;

/* Model aliases are tried in order; the gateway resolves each against
   whichever provider key the owner has set. Logical aliases, never raw ids. */
const MODELS = ['sonnet', 'gpt-4o', 'flash', 'haiku'];

/* ------------------------------------------------------------- crisis net */
const CRISIS = /\b(kill myself|killing myself|end my life|ending my life|take my own life|want to die|wanna die|suicidal|suicide|self[-\s]?harm|cut myself|cutting myself|overdose|od'?ing|no reason to live|better off dead|hurt myself)\b/i;

const CRISIS_REPLY =
`I am going to set the question aside for a moment, because something in how you put it matters more.

If you are thinking about ending your life or hurting yourself, please talk to a person tonight, not a website. In the UK you can call **Samaritans on 116 123**, free, any hour, and they will not rush you or judge you. You can also text **SHOUT to 85258**. If you are in immediate danger, call **999**. Outside the UK, findahelpline.com will give you the number where you are.

This order has nothing to offer that is worth more than that call. I am not a clinician and I will not pretend to be one.

When you are steady, come back and ask me anything at all. The question will keep.`;

/* --------------------------------------------------------------- handler */
export default async function (req, res) {
  const body = req.body || {};
  const question = String(body.question || '').trim();
  const limb = String(body.limb || '').trim().slice(0, 80);
  const name = String(body.name || '').trim().slice(0, 80);

  // Conversation history from the client: [{ role: 'user'|'oracle', text }]
  const history = Array.isArray(body.history) ? body.history : [];

  if (question.length < 2) {
    return res.status(400).json({ error: 'Ask something — even a few words will do.' });
  }
  if (question.length > MAX_Q) {
    return res.status(400).json({
      error: `That question is longer than the oracle will read. Trim it to ${MAX_Q} characters.`
    });
  }

  /* 1 ── the crisis net comes before everything, model or no model. */
  if (CRISIS.test(question)) {
    await log(name, limb, question, CRISIS_REPLY, 'crisis');
    return res.json({ answer: CRISIS_REPLY, source: 'crisis', followups: [] });
  }

  const isFollowUp = history.length > 0;

  /* 2 ── an unmistakable written answer is served as written, but only when
         this is the opening question. Mid-conversation, a canned paragraph
         reads as a non-sequitur, so the model gets it as grounding instead. */
  const match = bestMatch(question, limb);
  if (!isFollowUp && match.entry && match.score >= VERBATIM_AT) {
    const answer = match.entry.a;
    await log(name, limb, question, answer, 'written');
    return res.json({
      answer,
      source: 'written',
      matched: match.entry.q,
      followups: relatedQuestions(question, limb, 3)
    });
  }

  /* 3 ── retrieval: the closest written answers become the model's footing. */
  const retrieved = topMatches(question, limb, 5).filter((m) => m.score >= GROUND_AT);
  const grounding = retrieved.length
    ? ['THE ORDER\'S WRITTEN ANSWERS CLOSEST TO THIS QUESTION:', '']
        .concat(retrieved.map((m, i) =>
          `[${i + 1}] Q: ${m.entry.q}\nLimb: ${m.entry.limb}\nA: ${m.entry.a}`))
        .join('\n\n')
    : 'The order has no written answer close to this question. Answer from its general stance, and be candid that this is not ground it has covered in writing.';

  /* 4 ── build the conversation for the model. */
  const messages = [];
  for (const turn of history.slice(-MAX_TURNS)) {
    const text = String(turn && turn.text || '').trim().slice(0, MAX_Q);
    if (!text) continue;
    messages.push({
      role: turn.role === 'oracle' || turn.role === 'assistant' ? 'assistant' : 'user',
      content: text
    });
  }
  messages.push({
    role: 'user',
    content: [
      grounding,
      '',
      '---',
      name ? `The asker gives their name as: ${name}.` : 'The asker is anonymous.',
      limb ? `They filed this under the limb: ${limb}.` : '',
      isFollowUp ? 'This continues the conversation above — answer it in that context.' : '',
      '',
      'THEIR QUESTION:',
      question
    ].filter(Boolean).join('\n')
  });

  /* 5 ── try each model alias in turn. */
  let answer = '';
  let usedModel = '';
  let lastErr = null;
  let setupRequired = false;

  for (const model of MODELS) {
    try {
      const result = await ai.generateText({
        model,
        system: SYSTEM,
        messages,
        maxTokens: 1100,
        temperature: 0.72
      });
      answer = String(result && result.text ? result.text : '').trim();
      if (answer) { usedModel = (result && result.model) || model; break; }
    } catch (err) {
      lastErr = err;
      if (err && err.code === 'SetupRequired') { setupRequired = true; break; }
      console.error(`ask: model ${model} failed`, err && err.message);
    }
  }

  /* 6 ── no model: be useful anyway rather than silent. */
  if (!answer) {
    if (lastErr) console.error('ask: no model answered', lastErr && lastErr.message);

    if (match.entry && match.score >= 0.34) {
      const written = match.entry.a;
      await log(name, limb, question, written, 'written-fallback');
      return res.json({
        answer: written,
        source: 'written',
        matched: match.entry.q,
        note: 'No model is configured, so the oracle served its closest written answer.',
        followups: relatedQuestions(question, limb, 3)
      });
    }

    const suggestions = nearest(question, 3);
    return res.status(200).json({
      answer:
        'The order has no written answer close enough to that, and no model key is configured for composing a fresh one — so rather than invent something, it will say so.\n\n' +
        'Questions it can answer in full today include:\n\n' +
        suggestions.map((q) => '— ' + q).join('\n') +
        '\n\nFor anything else, the written form below reaches Ed himself, and the best questions are answered at length in the podcast mailbag.',
      source: 'fallback',
      setup_required: setupRequired,
      followups: suggestions
    });
  }

  await log(name, limb, question, answer, 'model');
  res.json({
    answer,
    source: 'model',
    model: usedModel,
    grounded: retrieved.map((m) => m.entry.q),
    followups: relatedQuestions(question, limb, 3)
  });
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
