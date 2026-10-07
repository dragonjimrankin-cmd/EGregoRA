/**
 * POST /api/transcribe — the ear behind the admin door.
 *
 * An episode arrives as sound. Everything a listing needs — a title worth
 * clicking, a summary that is actually about the episode, tags that put it
 * in front of the people looking for it, and the places on this site it
 * touches — is sitting in that sound already. This listens to it and
 * writes them out.
 *
 * Two steps, because they fail differently and are worth retrying apart:
 *
 *   { action: 'hear',     pass, upload, mime }   sound in, words out
 *   { action: 'describe', pass, text, kind }     words in, listing out
 *   { action: 'number',   pass, after? }         the next episode number
 *
 * The browser sends a small mono copy for the hearing \u2014 16 kHz, 32 kbps,
 * one ten-minute stretch at a time \u2014 because the services that do this
 * take about 25 MB and an hour of stereo is twenty times that. The words
 * come back in order and are joined up before anything is written.
 *
 * The links are not invented. The describing model is handed the actual
 * index of the site (lib/site-map.js, generated from the Atlas) and every
 * link it returns is checked against that list before it is kept.
 */
import { db } from 'hatchable';
import { adminDoor } from '../lib/door.js';
import { openaiKey } from '../lib/openai.js';
import { openChat } from '../lib/openchat.js';
import { SECTIONS, SECTION_LINES } from '../lib/site-map.js';

export const access = 'public';
export const methods = ['POST'];

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

/* ------------------------------------------------------------- the hearing */

async function hearWithOpenAI(bytes, mime) {
  const key = await openaiKey();
  if (!key) return { error: 'no OpenAI key' };
  /* Whichever of these the account can reach; the first is cheapest. */
  for (const model of ['gpt-4o-mini-transcribe', 'whisper-1']) {
    const form = new FormData();
    form.append('file', new Blob([bytes], { type: mime || 'audio/mpeg' }), 'part.mp3');
    form.append('model', model);
    form.append('response_format', 'text');
    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + key },
      body: form
    }).catch(() => null);
    if (!r) continue;
    if (r.ok) return { text: (await r.text()).trim(), by: 'openai/' + model };
    const why = await r.text().catch(() => '');
    if (r.status === 429 || r.status === 402) return { error: 'OpenAI has no credit: ' + why.slice(0, 160) };
  }
  return { error: 'OpenAI would not transcribe it' };
}

async function hearWithHF(bytes, mime) {
  let key = null;
  try {
    const { storedHuggingFaceKey } = await import('../lib/key-store.js');
    key = storedHuggingFaceKey ? storedHuggingFaceKey() : null;
  } catch { key = null; }
  if (!key) return { error: 'no Hugging Face token' };
  for (const repo of ['openai/whisper-large-v3-turbo', 'openai/whisper-large-v3']) {
    const r = await fetch('https://router.huggingface.co/hf-inference/models/' + repo, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + key, 'content-type': mime || 'audio/mpeg' },
      body: bytes
    }).catch(() => null);
    if (!r) continue;
    if (r.ok) {
      const d = await r.json().catch(() => null);
      const text = d && (d.text || (Array.isArray(d) && d[0] && d[0].text));
      if (text) return { text: String(text).trim(), by: 'hf/' + repo };
    }
  }
  return { error: 'the open-weights route refused it' };
}

/* ----------------------------------------------------------- the describing */

const BRIEF = (kind) => `You are the archivist of EGregoRA, an order of enquiry that braids cosmic
physics, natural philosophy, astrology, druidry, trees, sacred geometry, magic, the occult read
critically, neuroscience, biology, psychology, astronomy, God, the Law of One and hallucinogenic
meditation. You are given the transcript of ${kind === 'video' ? 'a film' : 'an episode'} and you
write the listing for it.

Answer with JSON and nothing else:

{"title":"\u2026","summary":"\u2026","tags":["\u2026"],"links":[{"href":"/page/#t-slug","why":"one short clause"}],
 "topics":[{"at":0,"heading":"\u2026"}]}

title    What it is actually about, in plain words. Under 70 characters. No clickbait, no colon-heavy
         subtitle, no "Episode N". It should read like the order wrote it: direct, unhurried, specific.
summary  Two to four sentences. What is argued, what is examined, what a listener comes away with.
         Written for a reader deciding whether to spend an hour. No hype, no "in this episode".
tags     Eight to sixteen. Reach the widest honest audience: include the plain subject words someone
         would actually search (sleep, memory, mushrooms, Jupiter, oak), the field names
         (neuroscience, astronomy, druidry), the named people, works and ideas discussed, and one or
         two broader terms a newcomer would use. Lower case. No hashes. Never a tag for something the
         transcript does not discuss \u2014 a false tag reaches the wrong audience and loses them.
links    The sections of this site the ${kind === 'video' ? 'film' : 'episode'} genuinely touches.
         Choose ONLY from the list below, copying the href exactly. Between three and eight. If
         nothing fits, return an empty list rather than a loose match.
topics   The shape of it: five to twelve headings with the second they begin at, if the transcript
         carries timings; otherwise an empty list.

The sections of the site:
${SECTION_LINES}

JSON only. No markdown fence.`;

function parseListing(text, kind) {
  const raw = String(text || '').replace(/```json|```/g, '').trim();
  const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  let out;
  try { out = JSON.parse(raw.slice(a, b + 1)); } catch { return null; }
  if (!out || typeof out !== 'object') return null;

  const known = new Map(SECTIONS.map((s) => [s.href, s.title]));
  const links = (Array.isArray(out.links) ? out.links : [])
    .map((l) => ({ href: clean(l && l.href, 200), why: clean(l && l.why, 160) }))
    .filter((l) => known.has(l.href))
    .slice(0, 8)
    .map((l) => ({ href: l.href, title: known.get(l.href), why: l.why }));

  const tags = (Array.isArray(out.tags) ? out.tags : [])
    .map((t) => clean(t, 40).toLowerCase().replace(/^#/, ''))
    .filter(Boolean)
    .filter((t, i, all) => all.indexOf(t) === i)
    .slice(0, 16);

  const topics = (Array.isArray(out.topics) ? out.topics : [])
    .map((t) => ({ at: Math.max(0, Number(t && t.at) || 0), heading: clean(t && t.heading, 120) }))
    .filter((t) => t.heading)
    .slice(0, 14);

  return {
    title: clean(out.title, 200),
    summary: clean(out.summary, 2000),
    tags, links, topics, kind
  };
}

/* The next number in the run, counting what is on the shelf as well as the
   episodes committed to the repo, so the two cannot collide. */
async function nextNumber(after) {
  let top = Number(after) || 0;
  try {
    const { rows } = await db.query(
      "SELECT number FROM media WHERE kind = 'audio' AND number <> ''");
    for (const r of rows || []) {
      const n = parseInt(String(r.number).replace(/\D/g, ''), 10);
      if (Number.isFinite(n) && n > top) top = n;
    }
  } catch { /* an empty shelf is a fine answer */ }
  return String(top + 1).padStart(3, '0');
}

export default async function (req, res) {
  const body = req.body || {};
  const door = await adminDoor(req, body.pass);
  if (!door.ok) return res.status(door.status).json({ error: door.error });

  const action = clean(body.action || 'hear', 16);

  try {
    if (action === 'number') {
      return res.json({ ok: true, number: await nextNumber(body.after) });
    }

    if (action === 'hear') {
      const upload = clean(body.upload, 64);
      if (!upload) return res.status(400).json({ error: 'No upload name.' });
      const { rows } = await db.query(
        'SELECT part FROM media_chunks WHERE upload_id = $1 ORDER BY seq ASC', [upload]);
      await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]).catch(() => {});
      if (!rows || !rows.length) return res.status(400).json({ error: 'No sound arrived.' });
      const bytes = Buffer.concat(rows.map((r) => Buffer.from(r.part, 'base64')));
      if (bytes.length > 26 * 1024 * 1024) {
        return res.status(413).json({ error: 'That stretch is too long to hear in one piece. ' +
          'Ten minutes at a time is the right size.' });
      }

      const tries = [hearWithOpenAI, hearWithHF];
      const why = [];
      for (const attempt of tries) {
        const out = await attempt(bytes, clean(body.mime, 60)).catch((e) => ({ error: e && e.message }));
        if (out && out.text) return res.json({ ok: true, text: out.text, by: out.by });
        if (out && out.error) why.push(out.error);
      }
      return res.status(503).json({
        error: 'Nothing could hear it. ' + why.join('; ') +
          '. Type the title and summary by hand, or add credit to the OpenAI account and try again.'
      });
    }

    if (action === 'describe') {
      const text = String(body.text || '').trim();
      if (text.length < 40) {
        return res.status(400).json({ error: 'There is not enough transcript to describe.' });
      }
      const kind = clean(body.kind, 8) === 'video' ? 'video' : 'audio';
      /* A long episode is too much for one window; the middle is sampled
         rather than truncated, so a description is not written from the
         first ten minutes alone. */
      const WINDOW = 48000;
      const fed = text.length <= WINDOW
        ? text
        : text.slice(0, WINDOW * 0.45) + '\n[\u2026]\n' +
          text.slice(Math.floor(text.length / 2 - WINDOW * 0.15), Math.floor(text.length / 2 + WINDOW * 0.15)) +
          '\n[\u2026]\n' + text.slice(-WINDOW * 0.25);

      const key = await openaiKey();
      if (key) {
        for (const model of ['gpt-4o', 'gpt-4o-mini']) {
          const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
            body: JSON.stringify({
              model,
              messages: [{ role: 'system', content: BRIEF(kind) }, { role: 'user', content: fed }],
              temperature: 0.5,
              max_tokens: 1600,
              response_format: { type: 'json_object' }
            })
          }).catch(() => null);
          if (!r || !r.ok) continue;
          const d = await r.json().catch(() => null);
          const got = parseListing(d && d.choices && d.choices[0] && d.choices[0].message &&
            d.choices[0].message.content, kind);
          if (got) return res.json(Object.assign({ ok: true, by: model }, got));
        }
      }

      const out = await openChat({
        system: BRIEF(kind),
        messages: [{ role: 'user', content: fed }],
        temperature: 0.5,
        maxTokens: 1500
      });
      const got = out && parseListing(out.text, kind);
      if (got) return res.json(Object.assign({ ok: true, by: out.model }, got));

      return res.status(503).json({ error: 'No model would write the listing just now.' });
    }

    return res.status(400).json({ error: 'No such action.' });
  } catch (err) {
    console.error('transcribe:', err && err.message);
    return res.status(500).json({ error: (err && err.message) || 'That failed.' });
  }
}
