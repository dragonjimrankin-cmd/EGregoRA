/**
 * POST /api/draw — the drawing box on the Ask Ed page.
 *
 * A direct line to the oracle's image generator, with no model and no
 * conversation in between: a prompt goes in, one finished 2D image comes back.
 * Photorealistic unless the prompt asks for another style. The picture is made
 * by Stable Diffusion on the order's own GPU wherever possible \u2014 a Colab
 * notebook if one is awake, a Kaggle kernel as a queued job if not; see
 * lib/imagegen.js for the full order of generators.
 */
import { db } from 'hatchable';
import { generateImage, storeImage, repoFor, IMAGE_ENGINES } from '../lib/imagegen.js';
import { drawWithOwnKey } from '../lib/byok.js';
import { requireStudio } from '../lib/accounts.js';
import { submitKaggleImage } from '../lib/videogen.js';

export const access = 'public';
export const methods = ['GET', 'POST'];

const MAX_PROMPT = 1200;

export default async function (req, res) {
  if (req.method === 'GET' && req.query && (req.query.engines === '1' || req.query.engines === 'true')) {
    return res.json({ engines: IMAGE_ENGINES });
  }
  /* The studio is closed to the street: members only, age and identity checked. */
  const door = await requireStudio(req);
  if (!door.ok) return res.status(door.status).json({ error: door.error, gate: door.reason });

  const body = req.body || {};
  const prompt = String(body.prompt || '').trim();
  const name = String(body.name || '').trim().slice(0, 80);

  if (prompt.length < 3) {
    return res.status(400).json({ error: 'Say what the picture should show — a few words at least.' });
  }
  if (prompt.length > MAX_PROMPT) {
    return res.status(400).json({
      error: `That prompt is longer than the generator will read. Trim it to ${MAX_PROMPT} characters.`
    });
  }

  /* A sketch drawn in the page, already uploaded and stored. It guides the
     composition where a route can follow it. */
  const sketchUrl = typeof body.sketch === 'string' && /^https?:\/\//.test(body.sketch)
    ? body.sketch : null;

  /* A key handed over for this one picture. It is used here and nowhere
     else: not logged, not stored, not kept after this response. */
  if (body.byok && body.byok.key) {
    const own = await drawWithOwnKey(body.byok, prompt);
    if (own.error) return res.status(502).json({ error: own.error });
    const saved = await storeImage(own);
    if (saved.error) return res.status(502).json({ error: saved.error });
    try {
      await db.query(
        'INSERT INTO questions (asker_name, limb, question, answer, source) VALUES ($1, $2, $3, $4, $5)',
        [name || null, 'image', prompt, saved.url, 'drawn-own-key']
      );
    } catch { /* the log is a convenience */ }
    return res.json({
      url: saved.url, prompt, provider: own.provider, hardware: own.hardware,
      sketch: sketchUrl ? false : null,
      note: sketchUrl ? 'Your own provider was used, and it draws from words rather than a sketch.' : undefined
    });
  }

  const engine = String(body.engine || 'sd35');

  /* Asked for the Kaggle GPU by name: there is no point pretending it can
     answer inside this request, so it becomes a job straight away. */
  const out = engine === 'kaggle'
    ? { error: 'Kaggle was asked for by name.' }
    : await generateImage(prompt, { initUrl: sketchUrl, engine });

  if (!out.url) {
    /* Every quick route failed. The order's own GPU can draw it, but a
       Kaggle notebook takes minutes rather than seconds, so the picture
       becomes a job the page waits on — exactly like a clip. */
    const job = await submitKaggleImage(prompt, { repo: repoFor(engine) });
    if (!job.error) {
      const { rows } = await db.query(
        `INSERT INTO videos (prompt, provider, model, request_id, status_url, response_url, status, asker_name, kind)
         VALUES ($1, $2, $3, $4, $5, $6, 'queued', $7, 'image') RETURNING id`,
        [prompt, job.provider, job.model, job.requestId, job.statusUrl, job.responseUrl, name || null]
      );
      return res.json({
        id: rows[0].id,
        status: 'queued',
        kind: 'image',
        model: job.model,
        hardware: job.hardware || null,
        progress: 1,
        note: 'Drawing on the order\u2019s own GPU \u2014 slower than the usual route, several minutes. ' +
          'The page will keep checking.'
      });
    }
    return res.status(502).json({ error: out.error || job.error || 'The drawing failed.' });
  }

  try {
    await db.query(
      'INSERT INTO questions (asker_name, limb, question, answer, source) VALUES ($1, $2, $3, $4, $5)',
      [name || null, 'image', prompt, out.url, 'drawn']
    );
  } catch (err) {
    console.error('draw: could not log prompt', err && err.message);
  }

  res.json({
    url: out.url, prompt: out.prompt, provider: out.provider,
    hardware: out.hardware || null,
    sketch: out.sketch,
    note: sketchUrl && out.sketch === false
      ? 'Your sketch could not be followed \u2014 no route that takes a starting image was free, so this was drawn from the words alone.'
      : undefined
  });
}
