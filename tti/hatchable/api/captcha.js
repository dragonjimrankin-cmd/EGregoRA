/** GET /api/captcha — a fresh gate-word, drawn as SVG. */
import { issueCaptcha } from '../lib/captcha.js';

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  try {
    const out = await issueCaptcha();
    res.json(out);
  } catch (err) {
    console.error('captcha failed', err && err.message);
    res.status(500).json({ error: 'No gate-word could be drawn.' });
  }
}
