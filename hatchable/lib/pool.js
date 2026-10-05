/**
 * The render pool — many accounts, one queue, automatic failover.
 *
 * Every generator the order can reach (Kaggle notebooks, Colab workers,
 * Hugging Face, fal, Replicate, OpenAI) may be backed by more than one
 * account. Free tiers run out, tokens get revoked, a Colab runtime is
 * reclaimed mid-render. The rule here is that a route failing should cost the
 * visitor one attempt, not the whole drawing: each credential is tried in
 * turn, a failure is remembered with a short cooldown so the next request
 * skips it, and a success clears the slate.
 *
 * Credentials are read from config in several shapes, so the owner can add a
 * second account without any code change:
 *
 *   KAGGLE_API_TOKEN            the first account
 *   KAGGLE_API_TOKEN_2 … _6     further accounts, numbered
 *   KAGGLE_ACCOUNTS             several at once — JSON array, or lines of
 *                               "label | user | token" / "user:token"
 *
 * The same three shapes work for HUGGINGFACE_API_KEY, FAL_KEY,
 * REPLICATE_API_TOKEN and OPENAI_API_KEY.
 *
 * Nothing in here throws. A pool with no usable account simply returns an
 * empty list, and the caller moves on to the next route.
 */
import { config, db } from 'hatchable';

const COOLDOWN_MINUTES = 12;   // how long a failed account is stepped over
const MAX_ACCOUNTS = 6;

async function cfg(name) {
  try {
    const v = await config.get(name);
    return v && String(v).trim() ? String(v).trim() : null;
  } catch {
    return null;
  }
}

/* "label | user | token", "user:token", or a bare token. */
function parseLine(line, i) {
  const s = String(line || '').trim();
  if (!s || s.startsWith('#')) return null;
  if (s.includes('|')) {
    const [label, user, token] = s.split('|').map((x) => x.trim());
    if (!token) return null;
    return { id: label || ('acct-' + (i + 1)), label: label || user || ('account ' + (i + 1)), user: user || null, secret: token };
  }
  const m = s.match(/^([^\s:]+):(.+)$/);
  if (m && !/^https?$/i.test(m[1])) {
    return { id: m[1], label: m[1], user: m[1], secret: m[2].trim() };
  }
  return { id: 'acct-' + (i + 1), label: 'account ' + (i + 1), user: null, secret: s };
}

function parseBundle(raw) {
  if (!raw) return [];
  const text = String(raw).trim();
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      return list.map((a, i) => ({
        id: String(a.id || a.label || a.user || a.username || ('acct-' + (i + 1))),
        label: String(a.label || a.user || a.username || ('account ' + (i + 1))),
        user: a.user || a.username || null,
        secret: String(a.secret || a.token || a.key || '')
      })).filter((a) => a.secret);
    } catch { /* fall through to line parsing */ }
  }
  return text.split(/[\n;]+/).map(parseLine).filter(Boolean);
}

/**
 * Every credential configured for a provider, in the order they were found.
 * `fallbacks` are built-in secrets (the repo's own stored tokens) appended
 * last, so anything the owner pastes on the setup page always wins.
 */
export async function credentials(provider, { base, bundle, userKey, fallbacks = [] } = {}) {
  const out = [];
  const seen = new Set();
  const add = (a) => {
    if (!a || !a.secret || seen.has(a.secret)) return;
    seen.add(a.secret);
    out.push({ provider, id: a.id || ('acct-' + (out.length + 1)), label: a.label || a.id || ('account ' + (out.length + 1)),
               user: a.user || null, secret: a.secret });
  };

  for (const a of parseBundle(await cfg(bundle))) add(a);

  for (let i = 0; i < MAX_ACCOUNTS; i++) {
    const suffix = i === 0 ? '' : '_' + (i + 1);
    const secret = await cfg(base + suffix);
    if (!secret) continue;
    const user = userKey ? await cfg(userKey + suffix) : null;
    add({ id: user || ('acct-' + (i + 1)), label: user || ((i === 0 ? 'primary' : 'account ' + (i + 1))), user, secret });
  }

  for (const f of fallbacks) add(f);
  return out;
}

/* ------------------------------------------------------------------ *
 * Health memory
 * ------------------------------------------------------------------ */

export async function healthMap(provider) {
  try {
    const { rows } = await db.query(
      'SELECT account, fails, successes, last_error, last_ok, last_try, cooldown_until FROM provider_health WHERE provider = $1',
      [provider]
    );
    const map = new Map();
    for (const r of rows || []) map.set(r.account, r);
    return map;
  } catch {
    return new Map();
  }
}

export async function markSuccess(provider, account) {
  try {
    await db.query(
      `INSERT INTO provider_health (provider, account, successes, last_ok, last_try, fails, cooldown_until)
       VALUES ($1, $2, 1, NOW(), NOW(), 0, NULL)
       ON CONFLICT (provider, account) DO UPDATE
         SET successes = provider_health.successes + 1, last_ok = NOW(), last_try = NOW(),
             fails = 0, cooldown_until = NULL, last_error = NULL`,
      [provider, String(account)]
    );
  } catch { /* health is a convenience, never a blocker */ }
}

export async function markFailure(provider, account, reason) {
  try {
    await db.query(
      `INSERT INTO provider_health (provider, account, fails, last_error, last_try, cooldown_until)
       VALUES ($1, $2, 1, $3, NOW(), NOW() + INTERVAL '${COOLDOWN_MINUTES} minutes')
       ON CONFLICT (provider, account) DO UPDATE
         SET fails = provider_health.fails + 1, last_error = $3, last_try = NOW(),
             cooldown_until = NOW() + (INTERVAL '${COOLDOWN_MINUTES} minutes'
               * LEAST(4, provider_health.fails + 1))`,
      [provider, String(account), String(reason || 'failed').slice(0, 300)]
    );
  } catch { /* ditto */ }
}

/** Healthy accounts first; cooling ones last rather than dropped. */
export async function ordered(provider, list) {
  if (list.length < 2) return list;
  const health = await healthMap(provider);
  const now = Date.now();
  return list
    .map((a, i) => {
      const h = health.get(String(a.id)) || {};
      const cool = h.cooldown_until ? new Date(h.cooldown_until).getTime() : 0;
      return { a, i, cooling: cool > now ? cool : 0, fails: Number(h.fails) || 0 };
    })
    .sort((x, y) => (x.cooling - y.cooling) || (x.fails - y.fails) || (x.i - y.i))
    .map((x) => x.a);
}

/**
 * Run `fn(account)` against each account in turn until one returns something
 * truthy. Failures are recorded and stepped over. Returns the winning value,
 * with `.account` attached, or null when every account refused.
 */
export async function acrossAccounts(provider, list, fn) {
  const tried = [];
  for (const account of await ordered(provider, list)) {
    try {
      const out = await fn(account);
      if (out) {
        await markSuccess(provider, account.id);
        if (typeof out === 'object') out.account = account.label || account.id;
        return out;
      }
      tried.push(account.id);
      await markFailure(provider, account.id, 'returned nothing');
    } catch (err) {
      const why = (err && err.message) || 'threw';
      tried.push(account.id);
      await markFailure(provider, account.id, why);
      console.error('pool: ' + provider + '/' + account.id + ' failed —', why);
    }
  }
  if (tried.length) console.error('pool: every ' + provider + ' account refused (' + tried.join(', ') + ')');
  return null;
}

/* ------------------------------------------------------------------ *
 * The named pools
 * ------------------------------------------------------------------ */

export const kaggleAccounts = (fallbacks) => credentials('kaggle', {
  base: 'KAGGLE_API_TOKEN', bundle: 'KAGGLE_ACCOUNTS', userKey: 'KAGGLE_USERNAME', fallbacks
});
export const huggingFaceAccounts = () => credentials('huggingface', {
  base: 'HUGGINGFACE_API_KEY', bundle: 'HUGGINGFACE_ACCOUNTS'
});
export const falAccounts = () => credentials('fal', { base: 'FAL_KEY', bundle: 'FAL_ACCOUNTS' });
export const replicateAccounts = () => credentials('replicate', {
  base: 'REPLICATE_API_TOKEN', bundle: 'REPLICATE_ACCOUNTS'
});
export const openAiAccounts = (fallbacks) => credentials('openai', {
  base: 'OPENAI_API_KEY', bundle: 'OPENAI_ACCOUNTS', fallbacks
});

/** A plain report of the pool, for the control endpoint. */
export async function poolReport() {
  const names = [
    ['kaggle', await kaggleAccounts()],
    ['huggingface', await huggingFaceAccounts()],
    ['fal', await falAccounts()],
    ['replicate', await replicateAccounts()],
    ['openai', await openAiAccounts()]
  ];
  const out = {};
  for (const [provider, list] of names) {
    const health = await healthMap(provider);
    out[provider] = (await ordered(provider, list)).map((a) => {
      const h = health.get(String(a.id)) || {};
      const cooling = h.cooldown_until && new Date(h.cooldown_until) > new Date();
      return {
        account: a.label || a.id,
        state: cooling ? 'cooling off' : (Number(h.fails) ? 'recovered' : 'ready'),
        fails: Number(h.fails) || 0,
        successes: Number(h.successes) || 0,
        last_error: h.last_error || null,
        cooldown_until: cooling ? h.cooldown_until : null
      };
    });
  }
  return out;
}
