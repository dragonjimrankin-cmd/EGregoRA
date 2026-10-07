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
 *   film    { prompt, aspect?, model?, from?, frame? }  commission a clip; `from` is
 *                                           an earlier job id and carries its characters,
 *                                           setting, camera and seed across
 *   job     { id }                          how a picture or clip is getting on
 *   mailbag { limit? }                      the questions people have asked
 *   models                                  the video models on offer
 *   workers                                 the Colab GPU pool
 *   accounts                                the render pool: every account, and its health
 *   whoami                                  what this token is and may do
 */
import { storedHuggingFaceKey } from '../lib/key-store.js';
import { db, config } from 'hatchable';
import { checkToken } from '../lib/tokens.js';
import { ANSWERS } from '../lib/oracle-corpus.js';
import { readSheet, extendSheet, composePrompt, describeSheet, seedFor } from '../lib/continuity.js';
import { submitVideo, pollVideo, VIDEO_MODELS } from '../lib/videogen.js';
import { generateImage } from '../lib/imagegen.js';
import { poolReport } from '../lib/pool.js';
import { liveWorkers } from '../lib/colab.js';
import { bestMatch, topMatches, relatedQuestions } from '../lib/oracle-corpus.js';
import { ginkSystem, PRELUDE, isReturnRequest, RETURN_REPLY } from '../lib/gink-mind.js';
import { openChat, keylessChat } from '../lib/openchat.js';
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
    'chat-probe': 'which keyless thinking routes answer from the server',
    film: { prompt: 'string', aspect: '16:9 | 9:16', model: 'see action: models' },
    job: { id: 'number from draw or film' },
    mailbag: { limit: 'optional 1-50' },
    models: {},
    workers: {},
    accounts: {},
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
          corpus: ANSWERS.length,
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
        if (match && match.entry && match.keyed && match.score >= 0.9) {
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
        if (isReturnRequest(question)) {
          return res.json({ answer: RETURN_REPLY, source: 'default-state' });
        }

        const system = ginkSystem({ tier: 'open', adult: false, grounding, tools: false });
        const messages = PRELUDE.map((m) => ({ role: m.role, content: m.content }))
          .concat((Array.isArray(body.history) ? body.history.slice(-12) : [])
            .filter((m) => m && m.content)
            .map((m) => ({ role: m.role === 'oracle' ? 'assistant' : 'user',
                           content: String(m.content).slice(0, 4000) })));
        messages.push({ role: 'user', content: question });

        let out = await openChat({ system, messages });
        if (!out || !out.text) out = await openaiChat({ system, messages });
        if (!out || !out.text) {
          out = await keylessChat({
            system: ginkSystem({ tier: 'compact', grounding, tools: false }),
            messages: messages.slice(PRELUDE.length)
          });
        }
        if (out && out.text) {
          return res.json({
            answer: out.text,
            source: 'model',
            model: out.model || null,
            grounded: retrieved.length,
            followups: relatedQuestions(question, limb, 3)
          });
        }
        /* If every model is down, a written answer may stand in — but only
           one the question actually asked for. An unkeyed or weak match is
           grounding, never a reply: serving one is how an oracle ends up
           answering a question about the Great Wall with a paragraph on the
           speed of light. */
        if (match && match.entry && match.keyed && match.score >= 0.55) {
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
        return res.json({ status: 'ready', url: out.url, provider: out.provider,
          hardware: out.hardware || null, prompt: out.prompt });
      }

      case 'film': {
        const prompt = String(body.prompt || '').trim();
        if (prompt.length < 3) return res.status(400).json({ error: 'Say what the clip should show.' });
        /* A clip may be grown out of an earlier one: same characters, same
           place, same camera, same seed. Mirrors /api/video exactly. */
        const fromId = Number(body.from || 0) || null;
        let parent = null;
        if (fromId) {
          const { rows: pr } = await db.query(
            'SELECT id, prompt, sheet, seed, url, kind FROM videos WHERE id = $1', [fromId]);
          parent = pr[0] || null;
        }
        let sheet;
        try {
          sheet = parent
            ? extendSheet(parent.sheet ? JSON.parse(parent.sheet) : readSheet(parent.prompt), prompt)
            : readSheet(prompt);
        } catch { sheet = readSheet(prompt); }
        const sent = parent ? composePrompt(sheet, prompt, { continuesFrom: true }) : prompt;
        const seed = seedFor(sheet, parent ? parent.seed : body.seed);
        const initUrl = String(body.frame || (parent && parent.kind === 'image' ? parent.url : '') || '') || null;

        const job = await submitVideo(sent, {
          aspect: body.aspect === '9:16' ? '9:16' : '16:9',
          model: body.model,
          seed,
          initUrl
        });
        if (job.error) return res.status(503).json({ error: job.error });
        const { rows } = await db.query(
          `INSERT INTO videos (prompt, provider, model, request_id, status_url, response_url, status,
                               asker_name, sheet, parent_id, seed, init_url, hardware, progress)
           VALUES ($1, $2, $3, $4, $5, $6, 'queued', $7, $8, $9, $10, $11, $12, 1) RETURNING id`,
          [sent, job.provider, job.model, job.requestId, job.statusUrl, job.responseUrl,
           'token:' + door.name, JSON.stringify(sheet), parent ? parent.id : null, seed,
           initUrl, job.hardware || null]
        );
        return res.json({ id: rows[0].id, status: 'queued', model: job.model,
          hardware: job.hardware || null, seed, sheet, carried: describeSheet(sheet), prompt: sent });
      }

      case 'job': {
        const id = Number(body.id || 0);
        if (!id) return res.status(400).json({ error: 'Which job?' });
        const { rows } = await db.query(
          `SELECT id, prompt, provider, model, request_id, status_url, response_url, status, url,
                  error, kind, progress, hardware, seed, parent_id, created_at
             FROM videos WHERE id = $1`,
          [id]
        );
        const row = rows[0];
        if (!row) return res.status(404).json({ error: 'No such job.' });
        if (row.status === 'ready' || row.status === 'failed') {
          return res.json({ id, status: row.status, url: row.url, error: row.error, kind: row.kind,
            prompt: row.prompt, progress: row.status === 'ready' ? 100 : (row.progress || 0),
            hardware: row.hardware || null });
        }
        const out = await pollVideo(row);
        if (out.status === 'ready') {
          await db.query('UPDATE videos SET status = $1, url = $2, storage_key = $3, updated_at = NOW() WHERE id = $4',
            ['ready', out.url, out.key || null, id]);
        } else if (out.status === 'failed') {
          await db.query('UPDATE videos SET status = $1, error = $2, updated_at = NOW() WHERE id = $3',
            ['failed', out.error || 'failed', id]);
        }
        const pct = out.status === 'ready' ? 100
          : Math.max(Number(row.progress) || 0, Number(out.progress) || 0);
        if (out.status === 'running') {
          await db.query('UPDATE videos SET progress = $2, hardware = COALESCE($3, hardware) WHERE id = $1',
            [id, pct, out.hardware || null]);
        }
        return res.json({ id, status: out.status, url: out.url, error: out.error, kind: row.kind,
          prompt: row.prompt, progress: pct, measured: Boolean(out.measured),
          stage: out.stage || null, hardware: out.hardware || row.hardware || null, seed: row.seed });
      }

      /* Move an account to a different address. The site's own member record
         is keyed by email: sign-in codes, the mailing list and the letters
         index all follow it. Letters already filed under the old address are
         re-pointed too, so a member's history does not split in half. */
      case 'member-email': {
        const from = String(body.from || '').trim().toLowerCase();
        const to = String(body.to || '').trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
          return res.status(400).json({ error: 'Give a valid from and to address.' });
        }
        const { rows: found } = await db.query(
          'SELECT id, email, name FROM members WHERE lower(email) = $1', [from]);
        if (!found.length) return res.status(404).json({ error: 'No account uses ' + from + '.' });
        const { rows: clash } = await db.query(
          'SELECT id FROM members WHERE lower(email) = $1', [to]);
        if (clash.length) return res.status(409).json({ error: to + ' is already an account here.' });

        await db.query('UPDATE members SET email = $2 WHERE id = $1', [found[0].id, to]);
        const { rowCount: letters } = await db.query(
          'UPDATE letters SET email = $2 WHERE lower(email) = $1', [from, to]);
        return res.json({
          ok: true,
          member: found[0].id,
          name: found[0].name || null,
          from,
          to,
          letters_moved: letters || 0,
          note: 'Sign-in codes now go to ' + to + '. Any passkey on the account still works.'
        });
      }

      /* Set the display name on an account. The header chip and the
         account page both read it; with no name the chip falls back to the
         address's local part, which is nobody's idea of a greeting. */
      case 'member-name': {
        const email = String(body.email || '').trim().toLowerCase();
        const name = String(body.name || '').trim().slice(0, 80);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          return res.status(400).json({ error: 'Give a valid email.' });
        }
        if (!name) return res.status(400).json({ error: 'Give a name.' });
        const { rows: found } = await db.query(
          'SELECT id, email, name FROM members WHERE lower(email) = $1', [email]);
        if (!found.length) return res.status(404).json({ error: 'No account uses ' + email + '.' });
        await db.query('UPDATE members SET name = $2 WHERE id = $1', [found[0].id, name]);
        return res.json({ ok: true, member: found[0].id, email, was: found[0].name || null, now: name });
      }

      /* Who is on the register. Addresses are included because this endpoint
         is already token-gated and the whole point of it is administration. */
      case 'members': {
        const limit = Math.max(1, Math.min(100, Number(body.limit) || 25));
        const { rows } = await db.query(
          'SELECT id, email, name, created_at FROM members ORDER BY created_at DESC LIMIT $1', [limit]);
        return res.json({ ok: true, count: rows.length, members: rows });
      }

      case 'mailbag': {
        const limit = Math.max(1, Math.min(50, Number(body.limit) || 20));
        const { rows } = await db.query(
          `SELECT id, asker_name AS name, question, limb, source,
                  LEFT(COALESCE(answer, ''), 400) AS answer, created_at
             FROM questions ORDER BY created_at DESC LIMIT $1`,
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
            account: w.account || null,
            caps: w.caps || 'video',
            fails: w.fails || 0,
            age_s: Math.round((Date.now() - new Date(w.last_seen).getTime()) / 1000)
          }))
        });
      }

      /* Which accounts the render pool holds, and which of them are sulking.
         A route that has just failed is on a cooldown and shows as such. */
      /* Which thinking routes actually answer from this machine. A probe,
         not a chat: each candidate is called once with a trivial question
         and its first words reported, so a route can be auditioned before
         the oracle is pointed at it. */
      case 'chat-probe': {
        const say = 'Reply with exactly: ready.';
        let hfToken = null;
        try { hfToken = await config.get('HUGGINGFACE_API_KEY'); } catch { hfToken = null; }
        if (!hfToken) hfToken = storedHuggingFaceKey();
        const tries = [
          { name: 'hugging face router, the order\'s own token, Llama 3.3 70B',
            url: 'https://router.huggingface.co/v1/chat/completions',
            headers: { authorization: 'Bearer ' + (hfToken || 'none') },
            body: { model: 'meta-llama/Llama-3.3-70B-Instruct',
                    messages: [{ role: 'user', content: say }], max_tokens: 20 } },
          { name: 'hugging face router, Qwen 2.5 72B',
            url: 'https://router.huggingface.co/v1/chat/completions',
            headers: { authorization: 'Bearer ' + (hfToken || 'none') },
            body: { model: 'Qwen/Qwen2.5-72B-Instruct',
                    messages: [{ role: 'user', content: say }], max_tokens: 20 } },
          { name: 'hugging face, whoami',
            url: 'https://huggingface.co/api/whoami-v2',
            headers: { authorization: 'Bearer ' + (hfToken || 'none') } },
          { name: 'pollinations GET with a referrer named',
            url: 'https://text.pollinations.ai/' + encodeURIComponent(say) +
              '?model=openai-fast&referrer=egregora.hatchable.site' },
          { name: 'pollinations POST with a referrer in the body',
            url: 'https://text.pollinations.ai/openai',
            body: { model: 'openai-fast', referrer: 'egregora.hatchable.site',
                    messages: [{ role: 'user', content: say }] } },
          { name: 'hack club ai, v1 path',
            url: 'https://ai.hackclub.com/v1/chat/completions',
            body: { messages: [{ role: 'user', content: say }] } },
          { name: 'duckduckgo duckchat, token step',
            url: 'https://duckduckgo.com/duckchat/v1/status', headers: { 'x-vqd-accept': '1' } },
          { name: 'openrouter free model with no key',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            body: { model: 'meta-llama/llama-3.3-70b-instruct:free',
                    messages: [{ role: 'user', content: say }] } },
          { name: 'github models with no token',
            url: 'https://models.inference.ai.azure.com/chat/completions',
            body: { model: 'gpt-4o-mini', messages: [{ role: 'user', content: say }] } },
          { name: 'pollinations POST, anonymous, openai-fast',
            url: 'https://text.pollinations.ai/openai',
            body: { model: 'openai-fast', messages: [{ role: 'user', content: say }] } },
          { name: 'pollinations GET, anonymous, openai-fast',
            url: 'https://text.pollinations.ai/' + encodeURIComponent(say) + '?model=openai-fast' },
          { name: 'pollinations GET, anonymous, no model named',
            url: 'https://text.pollinations.ai/' + encodeURIComponent(say) },
          { name: 'pollinations models list', url: 'https://text.pollinations.ai/models' }
        ];
        const seen = [];
        for (const t of tries) {
          const started = Date.now();
          try {
            const r = await fetch(t.url, Object.assign(
              { signal: AbortSignal.timeout(30000), headers: t.headers || {} },
              t.body
                ? { method: 'POST',
                    headers: Object.assign({ 'content-type': 'application/json' }, t.headers || {}),
                    body: JSON.stringify(t.body) }
                : {}));
            const text = (await r.text()).slice(0, 300);
            seen.push({ route: t.name, status: r.status, ms: Date.now() - started, said: text });
          } catch (err) {
            seen.push({ route: t.name, status: 0, ms: Date.now() - started, said: String((err && err.message) || 'failed') });
          }
        }
        return res.json({ probe: seen });
      }

      case 'accounts':
        return res.json({ pool: await poolReport() });

      default:
        return res.status(400).json({ error: 'Unknown action: ' + (action || '(none)'), manual: MANUAL });
    }
  } catch (err) {
    console.error('control: ' + action + ' failed', err && err.message);
    return res.status(500).json({ error: (err && err.message) || 'That did not work.' });
  }
}
