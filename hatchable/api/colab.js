/**
 * /api/colab — the door Colab notebooks knock on.
 *
 *   POST { action:'register', label, endpoint, gpu, account, secret }
 *   POST { action:'heartbeat'|'retire', endpoint, secret }
 *   GET                                  → { workers:[{label,gpu,jobs,age_s}] }
 *
 * Google has no API that lets an application sign into Colab on somebody's
 * behalf, so the notebook introduces itself instead. Writes require the shared
 * COLAB_SECRET when one is configured; the GET is public but shows no URLs.
 */
import { registerWorker, heartbeat, retireWorker, liveWorkers, colabSecret } from '../lib/colab.js';

export const access = 'public';
export const methods = ['GET', 'POST'];

export default async function (req, res) {
  if (req.method === 'GET') {
    const workers = await liveWorkers();
    return res.json({
      workers: workers.map((w) => ({
        label: w.label,
        gpu: w.gpu || null,
        jobs: w.jobs,
        age_s: Math.round((Date.now() - new Date(w.last_seen).getTime()) / 1000)
      }))
    });
  }

  const body = req.body || {};
  const want = await colabSecret();
  if (want && String(body.secret || req.headers['x-egregora-secret'] || '') !== want) {
    return res.status(403).json({ error: 'Wrong or missing secret.' });
  }

  const action = String(body.action || 'register');
  if (action === 'heartbeat') return res.json(await heartbeat(body.endpoint));
  if (action === 'retire') return res.json(await retireWorker(body.endpoint));

  const out = await registerWorker(body);
  if (out.error) return res.status(400).json(out);
  return res.json({ ok: true, worker: { label: out.worker.label, gpu: out.worker.gpu } });
}
