/**
 * /api/control — the door another agent drives the order through.
 *
 * A chat, a script, anything that is not a browser can hold a token and work
 * the site with it: ask the oracle, commission a picture or a clip, read the
 * mailbag, see what the GPU pool is doing. One endpoint, one bearer token,
 * an `action` in the body.
 *
 *   GET  /api/control                       → this manual, no token needed
 *   POST /api/control  { action, ... }      → Authorization: Bearer <token>
 *
 * Actions
 *   status                      how the order is doing
 *   ask     { question, history? }          put a question to the oracle
 *   draw    { prompt }                      commission a picture
 *   film    { prompt, aspect?, model? }     commission a clip
 *   job     { id }                          how a picture or clip is getting on
 *   mailbag { limit? }                      the questions people have asked
 *   models                                  the video models on offer
 *   workers                                 the Colab GPU pool
 *   whoami                                  what this token is and may do
 */
import { db } from 'hatchable';
import { checkToken } from '../lib/tokens.js';
import { submitVideo, pollVideo, VIDEO_MODELS } from '../lib/videogen.js';
import { generateImage } from '../lib/imagegen.js';
import { liveWorkers } from '../lib/colab.js';
import { bestMatch, topMatches, relatedQuestions } from '../lib/oracle-corpus.js';
import { openChat } from '../lib/openchat.js';
import { openaiChat } from '../lib/openai.js';

export const access = 'public';
export const methods = ['GET', 'POST'];

const MANUAL = {
  endpoint: 'https://egregora.hatchable.site/api/control',
  auth: 'Authorization: Bearer <token>',
  actions: {
    status: {},
    ask: { question: 'string', history: 'optional [{role,content}]' },
    draw: { prompt: 'string' },
    film: { prompt: 'string', aspect: '16:9 | 9:16', model: 'see action: models' },
    job: { id: 'number from draw or film' },
    mailbag: { limit: 'optional 1-50' },
    models: {},
    workers: {},
    whoami: {}
  },
  example:
    'curl -s https://egregora.hatchable.site/api/control ' +
    '-H "authorization: Bearer <token>" -H "content-type: application/json" ' +
    '-d \'{"action":"ask","question":"Why 137.5 degrees?"}\''
};

export default async function (req, res) {
  if (req.method === 'GET') return res.json(MANUAL);

  const body = req.body || {};
  const action = String(body.action || '').trim().toLowerCase();

  const door = await checkToken(req, action);
  if (!door.ok) return res.status(401).json({ error: door.error, manual: MANUAL.endpoint });

  try {
    switch (action) {
      case 'whoami':
        return res.json({ token: door.name, scope: door.scope, actions: Object.keys(MANUAL.actions) });

      case 'status': {
        const { rows: q } = await db.query('SELECT COUNT(*)::int AS n FROM questions');
        const { rows: v } = await db.query(
          "SELECT status, COUNT(*)::int AS n FROM videos GROUP BY status");
        const workers = await liveWorkers();
        return res.json({
          site: 'https://egregora.hatchable.site',
          limbs: 11,
          corpus: 1280,
          questions: q[0] ? q[0].n : 0,
          jobs: v.reduce((o, r) => Object.assign(o, { [r.status]: r.n }), {}),
          gpu_pool: workers.map((w) => ({ label: w.label, gpu: w.gpu, jobs: w.jobs })),
          token: door.name
        });
      }

      case 'ask': {
        const question = String(body.question || '').trim();
        if (question.length < 2) return res.status(400).json({ error: 'Ask something.' });
        const limb = String(body.limb || '');

        /* The same two-stage answer the page gives: a written house answer
           when the match is unmistakable, otherwise the closest written
           answers handed to a model as grounding. Handler files cannot
           import one another here, so the logic is kept deliberately plain
           — an agent gets the order's answers, not a second oracle. */
        const match = bestMatch(question, limb);
        if (match && match.entry && match.score >= 0.82) {
          return res.json({
            answer: match.entry.a,
            source: 'written',
            limb: match.entry.limb,
            followups: relatedQuestions(question, limb, 3)
          });
        }

        const retrieved = topMatches(question, limb, 5).filter((m) => m.score >= 0.16);
        const grounding = retrieved
          .map((m, i) => (i + 1) + '. Q: ' + m.entry.q + '\n   A: ' + m.entry.a)
          .join('\n\n');
        const system =
          'You are the Oracle of EGregoRA, an order of enquiry co-founded by Edward Gregory and ' +
          'Jim Rankin. Answer in British English, 45 to 120 words, plainly and without hedging. ' +
          'Say in plain words how firm a claim is — measured, recorded, speculative, story — and ' +
          'never use diamond marks. Anchor the reply in the order\u2019s own written answers below ' +
          'rather than inventing. If they do not cover it, say so and answer honestly anyway.' +
          (grounding ? '\n\nThe order has written:\n\n' + grounding : '');
        const messages = (Array.isArray(body.history) ? body.history.slice(-12) : [])
          .filter((m) => m && m.content)
          .map((m) => ({ role: m.role === 'oracle' ? 'assistant' : 'user', content: String(m.content).slice(0, 4000) }));
        messages.push({ role: 'user', content: question });

        let out = await openChat({ system, messages });
        if (!out || !out.text) out = await openaiChat({ system, messages });
        if (out && out.text) {
          return res.json({
            answer: out.text,
            source: 'model',
            model: out.model || null,
            grounded: retrieved.length,
            followups: relatedQuestions(question, limb, 3)
          });
        }
        if (match && match.entry) {
          return res.json({ answer: match.entry.a, source: 'written', limb: match.entry.limb });
        }
        return res.json({
          answer: 'Nothing here matches that, and no model is reachable to think about it properly. ' +
            'Ask it again with different words, or ask something inside the eleven limbs.',
          source: 'none'
        });
      }

      case 'draw': {
        const prompt = String(body.prompt || '').trim();
        if (prompt.length < 3) return res.status(400).json({ error: 'Say what to draw.' });
        const out = await generateImage(prompt);
        if (out.error) return res.status(503).json({ error: out.error });
        if (out.id) return res.json({ id: out.id, status: 'queued', kind: 'image' });
        return res.json({ status: 'ready', url: out.url, provider: out.provider, prompt: out.prompt });
      }

      case 'film': {
        const prompt = String(body.prompt || '').trim();
        if (prompt.length < 3) return res.status(400).json({ error: 'Say what the clip should show.' });
        const job = await submitVideo(prompt, {
          aspect: body.aspect === '9:16' ? '9:16' : '16:9',
          model: body.model
        });
        if (job.error) return res.status(503).json({ error: job.error });
        const { rows } = await db.query(
          `INSERT INTO videos (prompt, provider, model, request_id, status_url, response_url, status, asker_name)
           VALUES ($1, $2, $3, $4, $5, $6, 'queued', $7) RETURNING id`,
          [prompt, job.provider, job.model, job.requestId, job.statusUrl, job.responseUrl,
           'token:' + door.name]
        );
        return res.json({ id: rows[0].id, status: 'queued', model: job.model });
      }

      case 'job': {
        const id = Number(body.id || 0);
        if (!id) return res.status(400).json({ error: 'Which job?' });
        const { rows } = await db.query(
          'SELECT id, prompt, provider, model, request_id, status_url, response_url, status, url, error, kind FROM videos WHERE id = $1',
          [id]
        );
        const row = rows[0];
        if (!row) return res.status(404).json({ error: 'No such job.' });
        if (row.status === 'ready' || row.status === 'failed') {
          return res.json({ id, status: row.status, url: row.url, error: row.error, kind: row.kind, prompt: row.prompt });
        }
        const out = await pollVideo(row);
        if (out.status === 'ready') {
          await db.query('UPDATE videos SET status = $1, url = $2, storage_key = $3, updated_at = NOW() WHERE id = $4',
            ['ready', out.url, out.key || null, id]);
        } else if (out.status === 'failed') {
          await db.query('UPDATE videos SET status = $1, error = $2, updated_at = NOW() WHERE id = $3',
            ['failed', out.error || 'failed', id]);
        }
        return res.json({ id, status: out.status, url: out.url, error: out.error, kind: row.kind, prompt: row.prompt });
      }

      case 'mailbag': {
        const limit = Math.max(1, Math.min(50, Number(body.limit) || 20));
        const { rows } = await db.query(
          'SELECT id, name, question, limb, created_at FROM questions ORDER BY created_at DESC LIMIT $1',
          [limit]
        );
        return res.json({ questions: rows });
      }

      case 'models':
        return res.json({
          models: Object.entries(VIDEO_MODELS).map(([key, m]) => ({
            key, label: m.label, note: m.note, own_gpu: Boolean(m.kaggle)
          }))
        });

      case 'workers': {
        const workers = await liveWorkers();
        return res.json({
          workers: workers.map((w) => ({
            label: w.label, gpu: w.gpu, jobs: w.jobs,
            age_s: Math.round((Date.now() - new Date(w.last_seen).getTime()) / 1000)
          }))
        });
      }

      default:
        return res.status(400).json({ error: 'Unknown action: ' + (action || '(none)'), manual: MANUAL });
    }
  } catch (err) {
    console.error('control: ' + action + ' failed', err && err.message);
    return res.status(500).json({ error: (err && err.message) || 'That did not work.' });
  }
}
