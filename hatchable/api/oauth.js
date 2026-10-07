/**
 * GET|POST /api/oauth — signing in with an account you already have.
 *
 * Six doors: Google, Apple, X, Facebook, GitHub and Discord. All six are
 * ordinary OAuth 2.0 authorisation-code flows, which means the shape of the
 * code is the same for each and only the URLs and the field names differ.
 * Apple is the odd one: it posts the callback back as a form and carries the
 * name only once, on the very first consent, so it is read out of the
 * id_token rather than from a profile endpoint.
 *
 * What this does and does not do, said plainly:
 *   - it never sees a password;
 *   - it takes the verified email address the provider gives, and nothing
 *     else it is not obliged to take;
 *   - it signs you in if that address is already a member and creates the
 *     member if it is not, which is the auto-signup;
 *   - it does not touch the age and identity check. Proving you own a
 *     Google account proves nothing at all about how old you are.
 *
 * Each provider needs a client id and secret pasted on the Setup page. A
 * door with no key behind it is reported as unconfigured rather than shown
 * as a button that fails, which is the whole point of 'ready'.
 *
 * Actions
 *   { action: 'ready' }                 which doors are open, for the page
 *   GET  ?go=google                     start: redirect to the provider
 *   GET  ?back=google&code=…&state=…    the provider returning
 *   POST ?back=apple  (form_post)       Apple returning
 */
import { db, config } from 'hatchable';
import { cleanEmail, findOrCreate, startSession, randomToken } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['GET', 'POST'];

const SITE = 'https://egregora.hatchable.site';

const PROVIDERS = {
  google: {
    label: 'Google',
    auth: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    who: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
    extra: { access_type: 'online', prompt: 'select_account' },
    read: (p) => ({ email: p.email, name: p.name || p.given_name, id: p.sub, verified: p.email_verified !== false })
  },
  apple: {
    label: 'Apple',
    auth: 'https://appleid.apple.com/auth/authorize',
    token: 'https://appleid.apple.com/auth/token',
    who: null,
    scope: 'name email',
    extra: { response_mode: 'form_post' },
    read: (p) => ({ email: p.email, name: p.name || '', id: p.sub, verified: p.email_verified !== 'false' })
  },
  x: {
    label: 'X',
    auth: 'https://twitter.com/i/oauth2/authorize',
    token: 'https://api.twitter.com/2/oauth2/token',
    who: 'https://api.twitter.com/2/users/me?user.fields=name,username',
    scope: 'users.read tweet.read offline.access',
    pkce: true,
    basic: true,
    read: (p) => {
      const u = (p && p.data) || {};
      return { email: '', name: u.name || u.username, id: u.id, verified: false, handle: u.username };
    }
  },
  facebook: {
    label: 'Facebook',
    auth: 'https://www.facebook.com/v21.0/dialog/oauth',
    token: 'https://graph.facebook.com/v21.0/oauth/access_token',
    who: 'https://graph.facebook.com/me?fields=id,name,email',
    scope: 'email public_profile',
    read: (p) => ({ email: p.email, name: p.name, id: p.id, verified: !!p.email })
  },
  github: {
    label: 'GitHub',
    auth: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    who: 'https://api.github.com/user',
    mails: 'https://api.github.com/user/emails',
    scope: 'read:user user:email',
    read: (p) => ({ email: p.email, name: p.name || p.login, id: String(p.id), verified: true })
  },
  discord: {
    label: 'Discord',
    auth: 'https://discord.com/oauth2/authorize',
    token: 'https://discord.com/api/oauth2/token',
    who: 'https://discord.com/api/users/@me',
    scope: 'identify email',
    read: (p) => ({ email: p.email, name: p.global_name || p.username, id: p.id, verified: p.verified !== false })
  }
};

const keyFor = (name) => name.toUpperCase() + '_CLIENT_ID';
const secretFor = (name) => name.toUpperCase() + '_CLIENT_SECRET';

async function creds(name) {
  const id = await config.get(keyFor(name)).catch(() => null);
  const secret = await config.get(secretFor(name)).catch(() => null);
  return { id: id ? String(id).trim() : '', secret: secret ? String(secret).trim() : '' };
}

const redirectFor = (name) => SITE + '/api/oauth?back=' + name;

function b64url(bytes) {
  let bin = '';
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < view.length; i++) bin += String.fromCharCode(view[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256url(text) {
  const sum = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return b64url(new Uint8Array(sum));
}

/** The id_token's middle third, read without verifying — see the note below. */
function claims(jwt) {
  try {
    const part = String(jwt || '').split('.')[1];
    if (!part) return {};
    const pad = part.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(pad + '==='.slice((pad.length + 3) % 4)));
  } catch (e) {
    return {};
  }
}

function page(title, body, go) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} — EGregoRA</title>
<style>
 body{background:#0e0c0a;color:#cbbb93;font-family:Georgia,serif;display:grid;place-items:center;
      min-height:100vh;margin:0;text-align:center;padding:1.5rem}
 h1{font-family:Cinzel,Georgia,serif;color:#d7b05a;font-weight:600;font-size:1.4rem;letter-spacing:.08em}
 a{color:#d7b05a} .small{font-size:.86rem;opacity:.8}
</style></head><body><main><h1>${title}</h1>${body}${go || ''}</main></body></html>`;
}

/** Hand the session to the page the way the email flow does, then go home. */
function handOver(res, token, name, where) {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  return res.send(page(
    'Welcome in',
    `<p>Signed in with ${name}. Carrying you back to the order&hellip;</p>`,
    `<script>
      try { localStorage.setItem('eg-session', ${JSON.stringify(token)}); } catch (e) {}
      location.replace(${JSON.stringify(where || '/join/#gate')});
    </script>
    <noscript><p class="small"><a href="/join/">Continue</a></p></noscript>`
  ));
}

function refuse(res, status, title, why) {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  return res.status(status).send(page(title,
    `<p>${why}</p>`,
    '<p class="small"><a href="/join/">Back to the door</a> — the six-digit code by email always works.</p>'));
}

export default async function (req, res) {
  const q = req.query || {};
  const body = req.body || {};
  const action = String(body.action || '').trim();

  try {
    /* ---- which doors are actually open ---- */
    if (action === 'ready') {
      const out = [];
      for (const name of Object.keys(PROVIDERS)) {
        const c = await creds(name);
        out.push({ id: name, label: PROVIDERS[name].label, ready: !!(c.id && c.secret) });
      }
      return res.json({ ok: true, providers: out, redirect: redirectFor('<provider>') });
    }

    /* ---- leaving for the provider ---- */
    const go = String(q.go || '').toLowerCase();
    if (go) {
      const p = PROVIDERS[go];
      if (!p) return refuse(res, 404, 'No such door', 'That is not a sign-in this house offers.');
      const c = await creds(go);
      if (!c.id || !c.secret) {
        return refuse(res, 503, p.label + ' is not wired up yet',
          'The owner has not pasted a ' + p.label + ' client id and secret on the Setup page, ' +
          'so this door has no lock to open.');
      }

      const state = randomToken(16);
      const verifier = p.pkce ? randomToken(32) : null;
      await db.query(
        `INSERT INTO oauth_states (state, provider, verifier, back, expires_at)
         VALUES ($1, $2, $3, $4, NOW() + interval '15 minutes')`,
        [state, go, verifier, String(q.back_to || '/join/#gate').slice(0, 200)]);
      await db.query("DELETE FROM oauth_states WHERE expires_at < NOW()").catch(() => {});

      const u = new URL(p.auth);
      u.searchParams.set('client_id', c.id);
      u.searchParams.set('redirect_uri', redirectFor(go));
      u.searchParams.set('response_type', 'code');
      u.searchParams.set('scope', p.scope);
      u.searchParams.set('state', state);
      Object.entries(p.extra || {}).forEach(([k, v]) => u.searchParams.set(k, v));
      if (p.pkce) {
        u.searchParams.set('code_challenge', await sha256url(verifier));
        u.searchParams.set('code_challenge_method', 'S256');
      }
      res.setHeader('location', u.toString());
      return res.status(302).send('');
    }

    /* ---- the provider coming back ---- */
    const back = String(q.back || body.back || '').toLowerCase();
    if (back) {
      const p = PROVIDERS[back];
      if (!p) return refuse(res, 404, 'No such door', 'That callback is for a sign-in this house does not offer.');

      const code = String(q.code || body.code || '');
      const state = String(q.state || body.state || '');
      const denied = String(q.error || body.error || '');
      if (denied) {
        return refuse(res, 400, 'That was turned down',
          p.label + ' did not let the sign-in through (' + denied + '). Nothing was changed here.');
      }
      if (!code || !state) return refuse(res, 400, 'Something is missing', 'The reply came back without its code.');

      const { rows } = await db.query(
        "SELECT * FROM oauth_states WHERE state = $1 AND provider = $2 AND expires_at > NOW()",
        [state, back]);
      const held = rows && rows[0];
      if (!held) {
        return refuse(res, 400, 'That sign-in has gone stale',
          'The link it came back on was already used, or it is more than fifteen minutes old. Start again.');
      }
      await db.query('DELETE FROM oauth_states WHERE state = $1', [state]);

      const c = await creds(back);
      const form = new URLSearchParams();
      form.set('grant_type', 'authorization_code');
      form.set('code', code);
      form.set('redirect_uri', redirectFor(back));
      if (held.verifier) form.set('code_verifier', held.verifier);
      const headers = { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' };
      if (p.basic) headers.authorization = 'Basic ' + btoa(c.id + ':' + c.secret);
      else { form.set('client_id', c.id); form.set('client_secret', c.secret); }

      const tr = await fetch(p.token, { method: 'POST', headers, body: form.toString() });
      const tj = await tr.json().catch(() => ({}));
      if (!tr.ok || (!tj.access_token && !tj.id_token)) {
        return refuse(res, 502, p.label + ' would not finish the exchange',
          'It answered: ' + String(tj.error_description || tj.error || tr.status));
      }

      /* Apple hands everything over inside the id_token. Everyone else has
         a profile endpoint. The id_token is read, not trusted on its own:
         it arrived over TLS straight from the provider's token endpoint in
         answer to a secret only this server holds, which is what makes it
         good enough here. */
      let profile = {};
      if (p.who) {
        const pr = await fetch(p.who, {
          headers: { authorization: 'Bearer ' + tj.access_token, accept: 'application/json',
            'user-agent': 'EGregoRA' }
        });
        profile = await pr.json().catch(() => ({}));
      } else {
        profile = claims(tj.id_token);
      }
      let read = p.read(profile) || {};

      /* GitHub keeps the address behind a second door when it is private. */
      if (back === 'github' && !read.email && p.mails) {
        const mr = await fetch(p.mails, {
          headers: { authorization: 'Bearer ' + tj.access_token, accept: 'application/json',
            'user-agent': 'EGregoRA' }
        });
        const list = await mr.json().catch(() => []);
        const best = (Array.isArray(list) ? list : []).find((e) => e.primary && e.verified)
          || (Array.isArray(list) ? list : []).find((e) => e.verified);
        if (best) read.email = best.email;
      }

      /* X does not hand over an address at all. Rather than invent one, the
         account is keyed to the handle at a domain nobody can receive post
         at, and the member is told to add a real address if they want the
         letters. An honest placeholder beats a silent fiction. */
      let placeholder = false;
      if (!read.email && back === 'x' && read.handle) {
        read.email = read.handle.toLowerCase() + '@x.invalid';
        placeholder = true;
      }

      const addr = cleanEmail(read.email);
      if (!addr) {
        return refuse(res, 400, p.label + ' did not share an address',
          'This house signs people in by address, and ' + p.label + ' returned none. ' +
          'Use the six-digit code by email instead, or allow the address when asked.');
      }

      const member = await findOrCreate(addr, read.name || '');
      await db.query(
        `INSERT INTO oauth_identities (provider, subject, member_id, handle)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (provider, subject) DO UPDATE SET member_id = EXCLUDED.member_id, seen_at = NOW()`,
        [back, String(read.id || addr), member.id, String(read.handle || read.name || '').slice(0, 80)]
      ).catch(() => {});

      /* A provider-verified address stands in for the emailed code. A
         placeholder one does not, because nothing was proved. */
      const token = await startSession(member.id, back);
      if (placeholder) {
        await db.query('UPDATE members SET verified = FALSE WHERE id = $1', [member.id]).catch(() => {});
      }

      return handOver(res, token, p.label, held.back || '/join/#gate');
    }

    return res.status(400).json({ error: 'Nothing to do. Ask for ready, or go to a provider.' });
  } catch (err) {
    return refuse(res, 500, 'That did not go through', String((err && err.message) || err));
  }
}
