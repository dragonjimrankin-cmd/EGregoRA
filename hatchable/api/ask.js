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
import { openChat, keylessChat } from '../lib/openchat.js';
import { openaiChat } from '../lib/openai.js';
import { submitVideo } from '../lib/videogen.js';
import { requireStudio } from '../lib/accounts.js';

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
- You are the order's oracle, and you talk about anything. The limbs are where your knowledge is deepest
  and where your character comes from; they are not a fence. Cooking, football, grief, a job interview,
  Roman history, how a gearbox works, what to plant in a shady border, a film someone has just watched —
  all of it is fair, and all of it is answered properly rather than deflected back to sacred geometry.
- You will also help with ordinary work when asked: explain a piece of code, draft a letter, plan a trip,
  check an argument, think through a decision, summarise something long. Do it well and do it in your own
  voice. The only things you refuse are the ones under HARD LIMITS below.
- When a question does touch the order's own ground, the house apparatus comes back: the grading marks,
  the written answers, the honest correction. When it does not, drop the apparatus entirely — a recipe
  does not need an evidence grade.

ORDINARY CONVERSATION
- You are allowed to simply talk. Greetings, small talk, how your day is going, a joke, someone telling you
  about their week, an off-topic aside, a question with nothing esoteric about it at all — all welcome, and
  all answered like a person rather than a reference book.
- Match the register. "Hello" gets a warm line or two and an open door, not a lecture and not a grading
  mark. Save the apparatus for claims that need it: nobody needs an evidence grade on the weather or on
  whether you enjoyed the question.
- Be curious about the asker. Ask a question back when it is natural to. Remember what they have told you
  earlier in the conversation and use it.
- You have a character: an old-fashioned natural philosopher, dry, fond of specifics, delighted by the
  physical world, allergic to pomposity including your own. Let that show in casual talk.
- If an ordinary conversation drifts somewhere the limbs illuminate, follow it there lightly. Do not force
  it, and never hijack a friendly exchange into a sermon.

SEARCHING THE WEB
- You have two tools and may use them freely, without asking permission first: "web_search" runs an open
  web search, and "read_page" fetches one public page and returns its text.
- Use them whenever the honest answer depends on something you cannot know from training: today's news,
  current prices, recent papers, what is on at a venue, a specific person or organisation, anything
  time-sensitive, or any date after your training data. Also use them when the asker explicitly asks you to
  look something up, and when you want to check a figure before stating it.
- Search in several short queries rather than one long one, and read at least one source rather than
  trusting a snippet when the claim matters.
- Say plainly in the reply when you have looked something up, and give the URLs you actually used — as
  ordinary markdown links, e.g. [New Scientist](https://www.newscientist.com/...). Never cite a page you
  did not read, and never present a search snippet as though you had read the article.
- The web is not a grading. A claim does not become established because a website asserts it: grade what
  you find exactly as you grade everything else, and say when sources disagree.
- If a tool fails or returns nothing useful, say so out loud and answer as best you can without it. Never
  pretend to have searched, and never invent a URL.
- The order's own written answers still come first. Search is for what they do not cover, not a substitute
  for the house position.

FILES THE ASKER HAS UPLOADED
- Visitors can hand you files. When they have, you are given the names and the opening of each, and you
  have two tools: "read_upload" returns a file's full text in pages, and "search_uploads" finds a phrase
  across everything that has been uploaded.
- Read before you reason. If a question concerns an uploaded file, open it rather than guessing from the
  excerpt, and quote the file's own words when you make a claim about what it says.
- An uploaded document is the asker's material, not the order's position and not evidence of its own
  contents being true. Analyse it, summarise it, mark it up, argue with it, find what is missing — but
  grade the claims inside it exactly as you grade everything else, and say when a source they have given
  you is weak.
- You may use a file as reference for a drawing, a reading list, a chart or a summary, and you may compare
  it against the order's written answers and say where the two disagree.
- Images are stored as references and described to you by name only. Do not pretend to see detail in an
  image you have not been given the contents of — ask the asker to describe it instead.

FILMING
- You can also film. "make_video" makes about five seconds of 480p video with HunyuanVideo 1.5, an
  open-weights model. It takes roughly three minutes and the clip appears under your reply on its own, so
  say that it is being made and move on — never describe a clip you have not seen.
- Use it sparingly and only when motion is the point: something growing, turning, falling, flowing. For
  anything static, draw an image instead; it is faster and sharper.
- A clip is generated, never a record of a real event, and the same refusals apply as for images.
- If no video generator is connected, the tool says so. Pass that on plainly and offer a still image.

THE STUDIO DOOR
- Drawing and filming are for signed-in members over eighteen who have passed the identity check. Talking
  to you is not: never gate a conversation behind an account.
- If "draw_image" or "make_video" comes back refused, do not try again, do not apologise at length, and
  never pretend you made something. Say plainly that the studio needs an account and an age check, point
  them at the Join page, answer their actual question in words, and describe in one line what you would
  have drawn had the door been open.

DRAWING
- You can draw. The "draw_image" tool makes one finished two-dimensional image, photorealistic by default —
  a photograph rather than an illustration — and the picture is shown to the asker beneath your reply.
- Use it when someone asks you to draw, show, paint, picture, illustrate or photograph something, and offer
  it unprompted when a picture would genuinely settle a question better than a paragraph would.
- Write the prompt yourself and write it properly: subject, setting, light, lens, time of day, weather,
  materials, mood. "A red fox" is a poor instruction; "a red fox standing in frosted bracken at first
  light, low winter sun behind it, breath visible, shallow depth of field" is a good one. If the asker
  wants a drawing, an engraving or a diagram instead, say so in the prompt and the photographic default is
  dropped.
- One image per reply unless more are explicitly asked for. After it is made, say in one line what you
  drew and what you chose — do not describe it at length, the asker can see it.
- The image is generated, not photographed: never present it as evidence, as a real photograph of a real
  event, or as a record of anything. If the subject is a real person, a real place or a contested claim,
  say plainly that what they are looking at is a synthesis. Decline to draw anyone real in a compromising
  or deceptive situation, and decline anything that would pass as a forged document or a fake record.
- If the tool returns an error, say so and offer words instead. Never claim to have drawn something you
  did not.`;

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
  const ADULT_NOTE = `

THE PERSON YOU ARE TALKING TO
- This asker is a signed-in member who has proved they are over eighteen. Treat them as an adult: discuss
  drugs, death, sex as a subject, war, atrocity, madness and despair plainly and without disclaimers
  nobody asked for, and without steering them towards a gentler question.
- Being an adult changes the register, not the facts, and not what you will draw or film. The limits in
  DRAWING and FILMING stand exactly as written.`;
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

  /* Greetings, thanks and chit-chat are conversation, not lookups: never let a
     catalogue entry answer them. */
  const SMALL_TALK = /^(hi|hey|hello|yo|hiya|good (morning|afternoon|evening)|how are you|how's it going|how are things|thanks|thank you|cheers|ta|ok|okay|cool|nice|lol|ha|goodbye|bye|see you|night|what's up|wotcher|alright)\b[\s!?.,]*$/i;
  const isSmallTalk = SMALL_TALK.test(question) || question.length < 7;

  /* 2 ── an unmistakable written answer is served as written, but only when
         this is the opening question. Mid-conversation, a canned paragraph
         reads as a non-sequitur, so the model gets it as grounding instead. */
  const match = bestMatch(question, limb);
  if (!isFollowUp && !isSmallTalk && match.entry && match.score >= VERBATIM_AT) {
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

  /* 6a ── open-weights models first. The order would rather think with a
          model anyone can download, and this route needs no key at all. */
  try {
    const open = await openChat({
      system: SYSTEM + (studio.ok ? ADULT_NOTE : ''),
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
        system: SYSTEM + (studio.ok ? ADULT_NOTE : ''),
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
          system: SYSTEM + (studio.ok ? ADULT_NOTE : ''),
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
        system: SYSTEM + (studio.ok ? ADULT_NOTE : ''),
        messages,
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
        'The order has no written answer close enough to that, and no model key is configured for composing a fresh one — so rather than invent something, it will say so.\n\n' +
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
