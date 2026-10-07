/**
 * POST /api/freeai — the five Free.ai doors, for administrators only.
 *
 * Every action here is behind the order's publishing passcode, checked by
 * the same door (and the same three-tries-then-twenty-minutes lockout) that
 * guards /api/media and /api/live. A visitor cannot reach these keys, a
 * member cannot reach these keys, and the keys themselves are never sent to
 * a browser.
 *
 * The doors are named Free.ai 1 to 5 and nothing else. Which address holds
 * which door is not in any response.
 *
 * Actions
 *   { action: 'status', pass }                      what each door has left
 *   { action: 'models', pass }                      the list, for the dropdowns
 *   { action: 'chat',   pass, messages, model, slot? }
 *   { action: 'image',  pass, prompt, model, ratio, slot? }
 *   { action: 'video',  pass, prompt, model, seconds, slot? }
 *   { action: 'probe',  pass, path, slot? }         a diagnostic
 */
import { adminDoor } from '../lib/door.js';
import { status, models, freeChat, freeImage, freeVideo, probe, doors } from '../lib/freeai.js';

export const access = 'public';
export const methods = ['POST'];

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

export default async function (req, res) {
  const body = req.body || {};
  const action = clean(body.action || 'status', 12);

  /* One lock, and it is the only one. Nothing below runs without it. */
  const door = await adminDoor(req, clean(body.pass, 120));
  if (!door.ok) return res.status(door.status || 401).json({ error: door.error });

  try {
    if (action === 'status') {
      return res.json({
        ok: true,
        doors: await status(),
        counted: 'locally',
        note: 'Free.ai publishes no balance endpoint, so these are the order\u2019s own ' +
          'counts of what has been spent today through this site. Anything spent on ' +
          'free.ai itself, or by another program on the same account, is not in them.'
      });
    }

    if (action === 'models') {
      const list = await models();
      return res.json({ ok: true, models: list, doors: doors().map((d) => d.label) });
    }

    if (action === 'chat') {
      const messages = Array.isArray(body.messages) ? body.messages.slice(-24) : [];
      if (!messages.length) return res.status(400).json({ error: 'Nothing to say.' });
      const out = await freeChat({
        system: clean(body.system, 4000) || undefined,
        messages: messages.map((m) => ({
          role: m && m.role === 'assistant' ? 'assistant' : m && m.role === 'system' ? 'system' : 'user',
          content: clean(m && m.content, 8000)
        })),
        model: clean(body.model, 120) || undefined,
        maxTokens: Math.max(16, Math.min(2000, Number(body.max_tokens) || 900)),
        slot: Number(body.slot) || undefined
      });
      if (!out) return res.status(502).json({ error: 'No Free.ai door answered.' });
      return res.json({ ok: true, text: out.text, model: out.model, door: out.label, tokens: out.tokens });
    }

    if (action === 'image') {
      const prompt = clean(body.prompt, 1500);
      if (!prompt) return res.status(400).json({ error: 'Describe the picture.' });
      const out = await freeImage({
        prompt,
        model: clean(body.model, 120) || undefined,
        ratio: clean(body.ratio, 12) || undefined,
        slot: Number(body.slot) || undefined
      });
      if (!out) return res.status(502).json({ error: 'No Free.ai door drew it.' });
      return res.json({ ok: true, url: out.url, door: out.label, kind: 'image' });
    }

    if (action === 'video') {
      const prompt = clean(body.prompt, 1500);
      if (!prompt) return res.status(400).json({ error: 'Describe the film.' });
      const out = await freeVideo({
        prompt,
        model: clean(body.model, 120) || undefined,
        seconds: Number(body.seconds) || 5,
        slot: Number(body.slot) || undefined
      });
      if (!out) return res.status(502).json({ error: 'No Free.ai door filmed it.' });
      return res.json({ ok: true, url: out.url, job: out.job, door: out.label, kind: 'video' });
    }

    if (action === 'probe') {
      const path = clean(body.path, 200) || '/v1/models';
      if (path.indexOf('/') !== 0) return res.status(400).json({ error: 'A path, beginning with a slash.' });
      return res.json({ ok: true, probe: await probe(Number(body.slot) || 1, path) });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (err) {
    console.error('freeai:', err && err.message);
    return res.status(500).json({ error: 'The doors would not open: ' + (err && err.message) });
  }
}
