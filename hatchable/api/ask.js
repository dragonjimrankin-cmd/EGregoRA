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
import { webSearch, readPage } from '../lib/websearch.js';
import { generateImage } from '../lib/imagegen.js';
import { openChat, keylessChat, chatWithOwnKey } from '../lib/openchat.js';
import { ginkSystem, PRELUDE, isReturnRequest, RETURN_REPLY } from '../lib/gink-mind.js';
import { openaiChat } from '../lib/openai.js';
import { submitVideo } from '../lib/videogen.js';
import { requireStudio } from '../lib/accounts.js';
import { adminDoor } from '../lib/door.js';
import { freeChat } from '../lib/freeai.js';

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
VIII The Black Tribunal — how esoteric ideas get captured by tyranny; Thule and Ahnenerbe occultism studied as pathology.
IX  Magic and the wizard's craft — symbol, attention and ritual as deliberate reconfiguration of a mind; runes and charms.
X   Alchemy and the elemental forces — the four as states and tendencies; nigredo to rubedo; solve et coagula.
XI  Consciousness — the hard problem, Orch OR, IIT, global workspace, and what a microtubule can and cannot carry.
`;

/* The system brief now lives in lib/gink-mind.js — identity, the sceptic
   substrate, the ledger, the instruments, the eleven limbs, the voice and
   the tool policy, assembled per model tier. The single block that used to
   sit here could not be tiered and could not be demonstrated. */

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
  /* Drawing and filming are members-only and age-checked; conversation is not. */
  const studio = await requireStudio(req);

  /* A member who has passed the age check is spoken to as an adult: no
     juvenile hedging, no refusing to discuss drugs, death, sexuality, war
     or anything else grown people discuss. It does not change what the
     generators will make — that is set by the models and the house rules,
     not by who is asking. */
  /* the adult register is a layer of the constitution now, not a suffix */
  const question = String(body.question || '').trim();
  const limb = String(body.limb || '').trim().slice(0, 80);
  const name = String(body.name || '').trim().slice(0, 80);

  // Conversation history from the client: [{ role: 'user'|'oracle', text }]
  const history = Array.isArray(body.history) ? body.history : [];

  // Files the asker has handed over in this conversation: an array of upload ids.
  const attachmentIds = (Array.isArray(body.attachments) ? body.attachments : [])
    .map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0).slice(0, 8);

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

  /* 1b ── "be yourself again". The default state is a real place he can be
           sent back to, and it costs nothing to answer from here. */
  if (isReturnRequest(question)) {
    await log(name, limb, question, RETURN_REPLY, 'default-state');
    return res.json({
      answer: RETURN_REPLY,
      source: 'default-state',
      followups: ['What are the eleven limbs?', 'How do you grade a claim?', 'What is Gink thinking with?']
    });
  }

  /* Greetings, thanks and chit-chat are conversation, not lookups: never let a
     catalogue entry answer them. */
  const SMALL_TALK = /^(hi|hey|hello|yo|hiya|good (morning|afternoon|evening)|how are you|how's it going|how are things|thanks|thank you|cheers|ta|ok|okay|cool|nice|lol|ha|goodbye|bye|see you|night|what's up|wotcher|alright)\b[\s!?.,]*$/i;
  const isSmallTalk = SMALL_TALK.test(question) || question.length < 7;

  /* 2 ── an unmistakable written answer is served as written, but only when
         this is the opening question. Mid-conversation, a canned paragraph
         reads as a non-sequitur, so the model gets it as grounding instead. */
  const match = bestMatch(question, limb);
  if (!isFollowUp && !isSmallTalk && match.entry && match.keyed && match.score >= VERBATIM_AT) {
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
  const retrieved = topMatches(question, limb, 8).filter((m) => m.score >= GROUND_AT);
  const grounding = retrieved.length
    ? ['THE ORDER\'S WRITTEN ANSWERS CLOSEST TO THIS QUESTION:', '']
        .concat(retrieved.map((m, i) =>
          `[${i + 1}] Q: ${m.entry.q}\nLimb: ${m.entry.limb}\nA: ${m.entry.a}`))
        .join('\n\n')
    : 'The order has no written answer close to this question. If it touches the limbs, answer from the order\'s general stance and be candid that this is not ground it has covered in writing. If it is an ordinary question with nothing esoteric about it, simply answer it well, in your own voice, without the grading apparatus.';

  /* 3b ── uploaded files, announced to the model with their openings. */
  let fileBrief = '';
  if (attachmentIds.length) {
    try {
      const { rows } = await db.query(
        `SELECT id, name, kind, chars, left(coalesce(body, ''), 2500) AS head
           FROM uploads WHERE id = ANY($1::bigint[]) ORDER BY id`,
        [attachmentIds]
      );
      if (rows.length) {
        fileBrief = ['FILES THE ASKER HAS UPLOADED FOR THIS CONVERSATION:', '']
          .concat(rows.map((r) =>
            r.kind === 'text'
              ? `[upload ${r.id}] "${r.name}" — ${r.chars} characters of text. Opening:\n${r.head}${r.chars > 2500 ? '\n…(use read_upload for the rest)' : ''}`
              : `[upload ${r.id}] "${r.name}" — an image, stored as a reference. You cannot see it; ask about it if it matters.`))
          .join('\n\n');
      }
    } catch (err) {
      console.error('ask: could not load uploads', err && err.message);
    }
  }

  /* 4 ── build the conversation for the model.
     It does not start empty. PRELUDE is a conversation Gink has already had —
     eight exchanges that install the register, the visible arithmetic, the
     refusal to flatter and the habit of marking the seam between shelves. A
     demonstrated voice holds where a described one drifts, so he continues
     himself rather than obeying a description of himself. */
  const messages = PRELUDE.map((m) => ({ role: m.role, content: m.content }));
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
      fileBrief,
      fileBrief ? '' : '',
      '---',
      name ? `The asker gives their name as: ${name}.` : 'The asker is anonymous.',
      limb ? `They filed this under the limb: ${limb}.` : '',
      isFollowUp ? 'This continues the conversation above — answer it in that context.' : '',
      '',
      'THEIR QUESTION:',
      question
    ].filter(Boolean).join('\n')
  });

  /* 5 ── tools: the oracle may search the open web and read a page.
         Every call is recorded so the reply can be honest about its sources. */
  const used = [];
  const images = [];
  const videos = [];

  const tools = {
    web_search: {
      description:
        'Search the open web and return titles, URLs and snippets. Use for anything current, ' +
        'time-sensitive, local, or not covered by the order\'s own written answers.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'A short search query, as you would type it.' },
          limit: { type: 'number', description: 'How many results to return, 1 to 8. Default 6.' }
        },
        required: ['query']
      },
      execute: async ({ query, limit }) => {
        const out = await webSearch(query, limit);
        (out.results || []).forEach((r) => used.push({ title: r.title, url: r.url, read: false }));
        return out;
      }
    },
    draw_image: {
      description:
        'Draw one standalone 2D image from a written prompt — photorealistic unless the prompt asks for ' +
        'another style — and show it to the asker. Write a full, specific prompt: subject, setting, ' +
        'light, lens, mood.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'A full description of the single image to make, in plain English.'
          }
        },
        required: ['prompt']
      },
      execute: async ({ prompt }) => {
        if (!studio.ok) return { ok: false, refused: true, error: studio.error };
        const out = await generateImage(prompt);
        if (out.url) images.push({ url: out.url, prompt: out.prompt, provider: out.provider });
        return out.url
          ? { ok: true, shown: true, prompt: out.prompt,
              note: 'The image is displayed to the asker beneath your reply. Do not paste the URL.' }
          : { ok: false, error: out.error };
      }
    },
    make_video: {
      description:
        'Film a short clip — about five seconds of 480p video, made with HunyuanVideo 1.5 from a written ' +
        'prompt. It takes roughly three minutes, so it appears beneath your reply once it is ready.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'What the clip shows: subject, movement, camera, light.' },
          aspect: { type: 'string', description: '16:9 or 9:16. Default 16:9.' }
        },
        required: ['prompt']
      },
      execute: async ({ prompt, aspect }) => {
        if (!studio.ok) return { ok: false, refused: true, error: studio.error };
        const job = await submitVideo(prompt, { aspect });
        if (job.error) return { ok: false, error: job.error };
        try {
          const { rows } = await db.query(
            `INSERT INTO videos (prompt, provider, model, request_id, status_url, response_url, status, asker_name)
             VALUES ($1, $2, $3, $4, $5, $6, 'queued', $7) RETURNING id`,
            [String(prompt).slice(0, 1200), job.provider, job.model, job.requestId,
             job.statusUrl, job.responseUrl, name || null]
          );
          videos.push({ id: rows[0].id, prompt: String(prompt).slice(0, 300), model: job.model });
          return { ok: true, queued: true, id: rows[0].id,
            note: 'Filming. The clip appears under your reply in about three minutes — tell the asker that, and do not describe what it will look like.' };
        } catch (err) {
          return { ok: false, error: 'Could not record the job: ' + (err && err.message) };
        }
      }
    },
    read_upload: {
      description: 'Return the full text of a file the asker uploaded, in pages of about 6000 characters.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'The upload id given to you in the file list.' },
          page: { type: 'number', description: '1-based page of the text. Default 1.' }
        },
        required: ['id']
      },
      execute: async ({ id, page }) => {
        try {
          const { rows } = await db.query(
            'SELECT id, name, kind, chars, body FROM uploads WHERE id = $1', [Number(id)]);
          const row = rows[0];
          if (!row) return { error: 'No upload with that id.' };
          if (row.kind !== 'text' || !row.body) {
            return { id: row.id, name: row.name, kind: row.kind,
              note: 'This upload is an image, stored as a reference. There is no text to read.' };
          }
          const size = 6000;
          const p = Math.max(1, Number(page) || 1);
          const text = row.body.slice((p - 1) * size, p * size);
          return {
            id: row.id, name: row.name, page: p,
            pages: Math.max(1, Math.ceil(row.body.length / size)),
            chars: row.chars, text
          };
        } catch (err) {
          return { error: 'Could not read that upload: ' + (err && err.message) };
        }
      }
    },
    search_uploads: {
      description: 'Search the text of every file uploaded to the oracle for a phrase.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'A word or phrase to look for.' } },
        required: ['query']
      },
      execute: async ({ query }) => {
        try {
          const q = String(query || '').trim().slice(0, 200);
          if (!q) return { error: 'Empty query.' };
          const { rows } = await db.query(
            `SELECT id, name, substring(body from greatest(1, position($1 in body) - 300) for 900) AS context
               FROM uploads
              WHERE kind = 'text' AND body ILIKE '%' || $1 || '%'
              ORDER BY created_at DESC LIMIT 6`, [q]);
          return { query: q, hits: rows };
        } catch (err) {
          return { error: 'Search failed: ' + (err && err.message) };
        }
      }
    },
    read_page: {
      description:
        'Fetch one public web page and return its readable text. Use after a search, or when the ' +
        'asker gives you a URL.',
      inputSchema: {
        type: 'object',
        properties: { url: { type: 'string', description: 'A full public http(s) URL.' } },
        required: ['url']
      },
      execute: async ({ url }) => {
        const out = await readPage(url);
        if (!out.error) {
          const hit = used.find((u) => u.url === out.url);
          if (hit) { hit.read = true; if (out.title) hit.title = out.title; }
          else used.push({ title: out.title || out.url, url: out.url, read: true });
        }
        return out;
      }
    }
  };

  /* 6 ── try each model alias in turn, with tools first and without them if
         the provider refuses the tool schema. */
  let answer = '';
  let usedModel = '';
  let lastErr = null;
  let setupRequired = false;

  /* 6₀ ── a key the member brought themselves. It goes first, because someone
          who has lent the order a key did it so that it would be used, and
          because it is the only route that reliably answers at all while the
          project has no model of its own. Used once and forgotten. */
  if (body.byok && body.byok.key) {
    try {
      const mine = await chatWithOwnKey(body.byok, {
        system: ginkSystem({ tier: 'open', adult: studio.ok }),
        messages,
        maxTokens: 1200
      });
      if (mine && mine.text) {
        answer = mine.text;
        usedModel = mine.model;
      } else if (mine && mine.error) {
        console.error('ask: own key refused', mine.error);
      }
    } catch (err) {
      console.error('ask: own-key route failed', err && err.message);
    }
  }

  /* 6·0 ── the order's own Free.ai doors, for an administrator only.
     Five accounts, each with a free pool of 30,000 tokens a day, on the
     order's own keys. It runs before everything else because on the day
     this was written it was the only route with any credit at all — but
     only when the asker has typed the order's passcode. A member or a
     visitor never reaches these keys, and the model used is whichever one
     the administrator chose in the Free.ai panel. */
  if (!answer && body.pass) {
    try {
      const door = await adminDoor(req, String(body.pass));
      if (door.ok) {
        const free = await freeChat({
          system: ginkSystem({ tier: 'compact', adult: true, grounding, tools: false }),
          messages: messages.slice(PRELUDE.length),
          model: String(body.free_model || '').trim() || undefined,
          slot: Number(body.free_slot) || undefined,
          maxTokens: 1200
        });
        if (free && free.text) {
          answer = free.text;
          usedModel = free.model + ' (' + free.label + ')';
        }
      }
    } catch (err) {
      console.error('ask: free.ai route failed', err && err.message);
    }
  }

  /* 6a ── open-weights models first. The order would rather think with a
          model anyone can download, and this route needs no key at all. */
  try {
    const open = answer ? null : await openChat({
      system: ginkSystem({ tier: 'open', adult: studio.ok }),
      messages,
      tools,
      temperature: 0.72,
      maxTokens: 1200
    });
    if (open && open.text) {
      answer = open.text;
      usedModel = open.model + ' (' + open.route + ', open weights)';
    }
  } catch (err) {
    console.error('ask: open-weights route failed', err && err.message);
  }

  /* 6b ── OpenAI, on the order's own key, when the open-weights route is
          unavailable or silent. Strong, reliable, and the one that always
          answers. */
  if (!answer) {
    try {
      const oa = await openaiChat({
        system: ginkSystem({ tier: 'open', adult: studio.ok }),
        messages,
        tools,
        temperature: 0.72,
        maxTokens: 1200
      });
      if (oa && oa.text) {
        answer = oa.text;
        usedModel = oa.model + ' (OpenAI)';
      }
    } catch (err) {
      console.error('ask: openai route failed', err && err.message);
    }
  }

  /* 6c ── the project's own BYOK gateway, if both routes gave nothing. */
  for (const model of answer ? [] : MODELS) {
    for (const withTools of [true, false]) {
      try {
        const result = await ai.generateText(Object.assign({
          model,
          system: ginkSystem({ tier: 'open', adult: studio.ok }),
          messages,
          maxTokens: 1200,
          temperature: 0.72,
          purpose: 'oracle'
        }, withTools ? { tools, maxSteps: 6 } : {}));
        answer = String(result && result.text ? result.text : '').trim();
        if (answer) { usedModel = (result && result.model) || model; break; }
      } catch (err) {
        lastErr = err;
        if (err && err.code === 'SetupRequired') { setupRequired = true; break; }
        console.error(`ask: model ${model}${withTools ? ' (tools)' : ''} failed`, err && err.message);
      }
    }
    if (answer || setupRequired) break;
  }

  /* 6d ── last resort: GPT-OSS 20B on the keyless public route. No tools and
          rate-limited to almost nothing, but it is open weights and it means
          the oracle can still think on a project with no keys at all. */
  if (!answer) {
    try {
      const last = await keylessChat({
        /* This route caps its system parameter near 2,500 characters and is
           rate-limited to almost nothing, so it gets the compact state with
           the grounding folded in, and none of the prelude. */
        system: ginkSystem({ tier: 'compact', adult: studio.ok, grounding, tools: false }),
        messages: messages.slice(PRELUDE.length),
        maxTokens: 900
      });
      if (last && last.text) {
        answer = last.text;
        usedModel = last.model + ' (keyless, open weights)';
      }
    } catch (err) {
      console.error('ask: keyless route failed', err && err.message);
    }
  }

  // de-duplicate the source list, pages actually read first
  const sources = [];
  for (const u of used.slice().sort((a, b) => Number(b.read) - Number(a.read))) {
    if (u.url && !sources.some((s) => s.url === u.url)) sources.push(u);
  }

  /* 7 ── no model: be useful anyway rather than silent. */
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
        'The order has no written answer close enough to that, and no model is reachable to compose a fresh one — so rather than invent something, it will say so.\n\n' +
        'The honest position, as of October 2026: every free hosted model that used to answer an unkeyed request now refuses this server, and the order will not pretend otherwise. There are two ways to give it a mind. Press “Lend the oracle a mind” below and paste a key — Google AI Studio, Groq and OpenRouter each give one away free in about two minutes, and it is used for your question and then forgotten. Or run the order’s own notebook on a free Colab GPU, which lends it an open-weights model nobody has to pay for.\n\n' +
        'Questions it can answer in full today include:\n\n' +
        suggestions.map((q) => '— ' + q).join('\n') +
        '\n\nFor anything else, the written form below reaches Ed himself, and the best questions are answered at length in the podcast mailbag.',
      source: 'fallback',
      setup_required: setupRequired,
      followups: suggestions
    });
  }

  await log(name, limb, question, answer,
    images.length ? 'model+image' : sources.length ? 'model+web' : 'model');
  res.json({
    answer,
    source: 'model',
    model: usedModel,
    grounded: retrieved.map((m) => m.entry.q),
    sources: sources.slice(0, 6),
    images: images.slice(0, 3),
    videos: videos.slice(0, 2),
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
