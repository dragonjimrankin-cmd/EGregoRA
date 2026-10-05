/**
 * POST /api/draw — the drawing box on the Ask Ed page.
 *
 * A direct line to the oracle's image generator, with no model and no
 * conversation in between: a prompt goes in, one finished 2D image comes back.
 * Photorealistic unless the prompt asks for another style. The picture is made
 * by FLUX.1-schnell (open weights) wherever possible; see lib/imagegen.js for
 * the full order of generators.
 */
import { db } from 'hatchable';
import { generateImage } from '../lib/imagegen.js';
import { requireStudio } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['POST'];

const MAX_PROMPT = 1200;

export default async function (req, res) {
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

  const out = await generateImage(prompt);

  if (!out.url) {
    return res.status(502).json({ error: out.error || 'The drawing failed.' });
  }

  try {
    await db.query(
      'INSERT INTO questions (asker_name, limb, question, answer, source) VALUES ($1, $2, $3, $4, $5)',
      [name || null, 'image', prompt, out.url, 'drawn']
    );
  } catch (err) {
    console.error('draw: could not log prompt', err && err.message);
  }

  res.json({ url: out.url, prompt: out.prompt, provider: out.provider });
}
