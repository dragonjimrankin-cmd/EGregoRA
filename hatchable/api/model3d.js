/**
 * POST /api/model3d — a model from a sentence.
 *
 * There is no honest text-to-mesh service the order can reach for nothing,
 * and a generated triangle soup would not belong on a bench where every
 * piece can be moved, recoloured and exported. So this does the thing the
 * Turning Shop is actually built for: it asks a model to write a *plan* —
 * which pieces from the shop's own pattern book, at what size, turned which
 * way, standing where — and the page builds that plan out of the same
 * primitives a person would have dragged into place by hand.
 *
 * What comes back is therefore editable, exportable as OBJ, and made of
 * parts with names. A chair is a seat, a back and four legs, not a mesh.
 *
 * The browser sends the catalogue it actually has, so the plan can never
 * name a piece this version of the shop cannot build.
 */
import { openaiKey, CHAT_MODELS } from '../lib/openai.js';
import { requireStudio } from '../lib/accounts.js';
import { checkToken } from '../lib/tokens.js';
import { openChat } from '../lib/openchat.js';

export const access = 'public';
export const methods = ['POST'];

const SOLIDS = ['box', 'sphere', 'cylinder', 'cone', 'torus'];
const MAX_PARTS = 48;

const BRIEF = `You are the draughtsman of a small 3D modelling bench. You answer only with JSON.

The bench builds a model out of parts. Every part is either one of the plain solids
${SOLIDS.join(', ')} or a ready-made piece from the pattern book, named by its id.

Answer with exactly this shape and nothing else:

{"name":"a short name","note":"one sentence on how it is put together",
 "parts":[{"solid":"box","colour":"#8a6b40","p":[x,y,z],"r":[rx,ry,rz],"s":[sx,sy,sz]}]}

Rules that matter:
- Each part has EITHER "solid" (one of the plain solids) OR "book" (a pattern book id). Never both.
- p is the centre of the part in metres. y is up. The floor is y = 0, so nothing should
  sit below it: a part of height h standing on the floor has y = h/2.
- r is rotation in degrees about x, y, z.
- s is the size in metres along each axis — a plain solid is one metre across before scaling,
  so a table top 1.6 long, 0.05 thick and 0.9 deep is s = [1.6, 0.05, 0.9].
- colour is a hex string. Give different materials different colours.
- Build to a sensible real scale. A chair is about 0.9 tall, a house about 6.
- Use between 3 and ${MAX_PARTS} parts. Prefer a few well-placed parts over a cloud of small ones.
- Use a pattern book piece whenever one obviously fits; build the rest out of solids.
- Think about how the thing actually stands up. Legs reach the floor. Walls meet at corners.
- No prose, no markdown fence, no explanation. JSON only.`;

const clean = (t) => String(t || '').replace(/```json|```/g, '').trim();

function parsePlan(text, ids) {
  const raw = clean(text);
  const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  let plan;
  try { plan = JSON.parse(raw.slice(a, b + 1)); } catch { return null; }
  if (!plan || !Array.isArray(plan.parts)) return null;

  const known = new Set(ids);
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const trio = (v, d) => {
    const arr = Array.isArray(v) ? v : [];
    return [num(arr[0], d), num(arr[1], d), num(arr[2], d)];
  };

  const parts = plan.parts.slice(0, MAX_PARTS).map((p) => {
    const book = p && p.book && known.has(String(p.book)) ? String(p.book) : null;
    const solid = !book && SOLIDS.includes(String(p && p.solid)) ? String(p.solid) : null;
    if (!book && !solid) return null;
    const s = trio(p.s, 1).map((v) => Math.min(60, Math.max(0.01, Math.abs(v) || 1)));
    return {
      book,
      solid,
      colour: /^#[0-9a-f]{6}$/i.test(String(p.colour || '')) ? String(p.colour) : '#c7a662',
      p: trio(p.p, 0).map((v) => Math.min(60, Math.max(-60, v))),
      r: trio(p.r, 0),
      s
    };
  }).filter(Boolean);

  if (parts.length < 1) return null;
  return {
    name: String(plan.name || 'a model').slice(0, 60),
    note: String(plan.note || '').slice(0, 240),
    parts
  };
}

export default async function (req, res) {
  /* The studio door, unless this is the control API calling with a token of
     its own \u2014 which is how the route is tested from the outside, there
     being no member session in a workflow run. */
  const byToken = await checkToken(req, 'plan').catch(() => ({ ok: false }));
  if (!byToken.ok) {
    const door = await requireStudio(req);
    if (!door.ok) return res.status(door.status).json({ error: door.error, gate: door.reason });
  }

  const body = req.body || {};
  const prompt = String(body.prompt || '').trim().slice(0, 600);
  if (prompt.length < 3) {
    return res.status(400).json({ error: 'Say what to build \u2014 a few words at least.' });
  }
  /* The catalogue the browser actually holds. Trimmed hard: a prompt is not
     the place for a thousand ids. */
  const ids = Array.isArray(body.ids)
    ? body.ids.map((s) => String(s).slice(0, 40)).slice(0, 400)
    : [];

  const ask = 'Build this: ' + prompt +
    (ids.length ? '\n\nPattern book ids you may use:\n' + ids.join(', ') : '');

  const tries = [];

  /* The order's own key first \u2014 this is a structured-output job and the
     stronger model is markedly better at standing a thing up. */
  const key = await openaiKey();
  if (key) {
    tries.push(async () => {
      for (const model of CHAT_MODELS) {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'system', content: BRIEF }, { role: 'user', content: ask }],
            temperature: 0.4,
            max_tokens: 2200,
            response_format: { type: 'json_object' }
          })
        }).catch(() => null);
        if (!r || !r.ok) continue;
        const data = await r.json().catch(() => null);
        const text = data && data.choices && data.choices[0] && data.choices[0].message &&
          data.choices[0].message.content;
        const plan = parsePlan(text, ids);
        if (plan) return Object.assign(plan, { by: model });
      }
      return null;
    });
  }

  /* Open weights behind it, so the box still works if the key is pulled. */
  tries.push(async () => {
    const out = await openChat({
      system: BRIEF,
      messages: [{ role: 'user', content: ask }],
      temperature: 0.4,
      maxTokens: 2000
    });
    if (!out || !out.text) return null;
    const plan = parsePlan(out.text, ids);
    return plan ? Object.assign(plan, { by: out.model }) : null;
  });

  for (const attempt of tries) {
    try {
      const plan = await attempt();
      if (plan) return res.json(plan);
    } catch (err) {
      console.error('model3d: a route failed', err && err.message);
    }
  }

  return res.status(503).json({
    error: 'No model would draw up a plan for that just now. Say so plainly rather than ' +
      'pretending something was built.'
  });
}
