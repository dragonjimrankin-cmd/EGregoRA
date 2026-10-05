/**
 * The gate-word — a small, self-hosted CAPTCHA.
 *
 * No Google, no Cloudflare, no third party watching who knocks at the door.
 * The server picks a short word, draws it as an SVG in the house hand with
 * the letters tilted and set on a wandering baseline, and keeps the answer
 * in the database under a one-use token. The browser never sees the answer,
 * and the image is not a bitmap anyone has taught a reader on.
 *
 * It is deliberately readable: the purpose is to cost a script a round trip
 * and a parse, not to torment a human with wrung-out text. Three attempts,
 * ten minutes, then it dies.
 */
import { db } from 'hatchable';
import { randomToken } from './accounts.js';

const MINUTES = 10;
const TRIES = 3;

/* Letters and digits that cannot be mistaken for one another in this face:
   no I, l, 1, O, 0, S, 5, Z, 2, B, 8. */
const ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY34679';
const SIZE = { w: 260, h: 86 };

function pick(n) {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < n; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function rand(min, max) {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return min + (b[0] / 4294967296) * (max - min);
}

/** Draw the word as an SVG: tilted glyphs, a wandering rule, a little noise. */
function draw(word) {
  const step = (SIZE.w - 46) / word.length;
  let glyphs = '';

  for (let i = 0; i < word.length; i++) {
    const x = 30 + i * step + rand(-4, 4);
    const y = SIZE.h / 2 + rand(-7, 7) + 11;
    const rot = rand(-22, 22);
    const size = rand(31, 39);
    const dim = rand(0.72, 1);
    glyphs +=
      `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size.toFixed(1)}" ` +
      `font-family="Cinzel, Georgia, serif" fill="#f3ddaa" fill-opacity="${dim.toFixed(2)}" ` +
      `transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})">${word[i]}</text>`;
  }

  /* Two wandering rules through the word, in the gold of the site. */
  let rules = '';
  for (let k = 0; k < 2; k++) {
    const y0 = rand(20, SIZE.h - 20);
    const d = `M0 ${y0.toFixed(1)} C ${(SIZE.w * 0.3).toFixed(0)} ${rand(4, SIZE.h - 4).toFixed(1)}, ` +
      `${(SIZE.w * 0.7).toFixed(0)} ${rand(4, SIZE.h - 4).toFixed(1)}, ${SIZE.w} ${rand(20, SIZE.h - 20).toFixed(1)}`;
    rules += `<path d="${d}" fill="none" stroke="#d7b05a" stroke-opacity="${rand(0.3, 0.55).toFixed(2)}" stroke-width="1.3"/>`;
  }

  /* Stars, because this is EGregoRA and not a parcel firm. */
  let stars = '';
  for (let k = 0; k < 14; k++) {
    stars += `<circle cx="${rand(4, SIZE.w - 4).toFixed(1)}" cy="${rand(4, SIZE.h - 4).toFixed(1)}" ` +
      `r="${rand(0.6, 1.5).toFixed(1)}" fill="#d7b05a" fill-opacity="${rand(0.25, 0.7).toFixed(2)}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE.w} ${SIZE.h}" ` +
    `width="${SIZE.w}" height="${SIZE.h}" role="img" aria-label="A word to read and type back">` +
    `<rect width="${SIZE.w}" height="${SIZE.h}" fill="#0a090e"/>` +
    `<rect x="0.5" y="0.5" width="${SIZE.w - 1}" height="${SIZE.h - 1}" fill="none" ` +
    `stroke="#d7b05a" stroke-opacity="0.38"/>` +
    stars + rules + glyphs +
    '</svg>';
}

/** Issue a challenge. Returns { token, svg, length }. */
export async function issueCaptcha() {
  const word = pick(5);
  const token = randomToken(18);
  await db.query(
    `INSERT INTO captchas (token, answer, kind, expires_at)
     VALUES ($1, $2, 'word', NOW() + ($3 || ' minutes')::interval)`,
    [token, word, String(MINUTES)]
  );
  /* Tidy as we go, so the table never needs a cron. */
  db.query("DELETE FROM captchas WHERE expires_at < NOW() - interval '1 hour'").catch(() => {});
  return { token, svg: draw(word), length: word.length };
}

/**
 * Check an answer. One use only; a wrong answer burns an attempt and three
 * wrong answers burn the token.
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function solveCaptcha(token, answer) {
  const t = String(token || '').trim();
  const a = String(answer || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!t || !a) return { ok: false, error: 'Read the word in the panel and type it in.' };

  const { rows } = await db.query(
    'SELECT token, answer, attempts, used_at, expires_at FROM captchas WHERE token = $1',
    [t]
  );
  const row = rows[0];
  if (!row) return { ok: false, error: 'That gate-word has gone. Press the panel for a new one.' };
  if (row.used_at) return { ok: false, error: 'That gate-word has been used. Press the panel for a new one.' };
  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, error: 'That gate-word expired. Press the panel for a new one.' };
  }
  if (row.attempts >= TRIES) {
    return { ok: false, error: 'Three wrong readings. Press the panel for a new word.' };
  }

  if (row.answer.toUpperCase() !== a) {
    await db.query('UPDATE captchas SET attempts = attempts + 1 WHERE token = $1', [t]);
    const left = TRIES - row.attempts - 1;
    return {
      ok: false,
      error: left > 0
        ? `That is not the word. ${left} ${left === 1 ? 'try' : 'tries'} left.`
        : 'Three wrong readings. Press the panel for a new word.'
    };
  }

  await db.query('UPDATE captchas SET used_at = NOW() WHERE token = $1', [t]);
  return { ok: true };
}
