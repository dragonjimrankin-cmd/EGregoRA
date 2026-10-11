/**
 * POST /api/profile — the account centre's shelf.
 *
 *   get    { token }                 the member's profile as shown in the forum
 *   save   { token, display_name?, bio? }   bio is 400 words, enforced here
 *   avatar { token, part }           one base64 piece (<=1.4MB) of the picture
 *   avatar-finish { token, mime }    glue, sanity-check, store, mirror
 *
 * A member's chosen face and words mirror to the twin, so the same account
 * shows the same self in both houses.
 */
import { db, storage } from 'hatchable';
import { whoAmI } from '../lib/accounts.js';
import { mirror } from '../lib/twin.js';

export const access = 'public';
export const methods = ['GET', 'POST', 'OPTIONS'];

const BIO_WORDS = 400;
const AVATAR_MAX = 4 * 1024 * 1024;   /* after the browser has shrunk it */

const wordCount = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

export default async function (req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
    return res.status(204).end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  /* The public shelf: the biographies the owner has approved for /people/.
     Nothing but the approved words and pictures; the address stays home. */
  if (req.method === 'GET') {
    const { rows } = await db.query(
      `SELECT mb.display_name, mb.bio, mb.image_key, mb.reviewed_at
         FROM member_bios mb
        WHERE mb.status = 'approved'
        ORDER BY mb.reviewed_at DESC`);
    const bios = [];
    for (const r of rows) {
      let avatar = null;
      if (r.image_key) { try { avatar = await storage.url(r.image_key, { ttl: 86400 }); } catch {} }
      bios.push({
        name: r.display_name || 'A member',
        bio: r.bio,
        avatar,
        since: r.reviewed_at
      });
    }
    return res.json({ ok: true, bios });
  }

  const body = req.body || {};
  try {
    const me = await whoAmI(req);
    if (!me) return res.status(401).json({ error: 'Sign in first — one account covers both houses.' });

    if (body.action === 'get') {
      const { rows } = await db.query(
        'SELECT display_name, bio, avatar_key, updated_at FROM forum_profiles WHERE member_id = $1',
        [me.id]);
      const p = rows[0] || {};
      let avatar = null;
      if (p.avatar_key) { try { avatar = await storage.url(p.avatar_key, { ttl: 604800 }); } catch {} }
      const { rows: rev } = await db.query(
        'SELECT status, submitted_at FROM member_bios WHERE member_id = $1', [me.id]);
      return res.json({
        ok: true,
        profile: { display_name: p.display_name || me.name || '', bio: p.bio || '', avatar },
        bio_review: rev[0]
          ? { status: rev[0].status, submitted_at: rev[0].submitted_at }
          : null,
        email: me.email, name: me.name
      });
    }

    if (body.action === 'save') {
      const display = String(body.display_name || '').trim().slice(0, 60);
      const bio = String(body.bio || '').trim().slice(0, 4000);
      if (wordCount(bio) > BIO_WORDS) {
        return res.status(400).json({
          error: 'The bio is limited to ' + BIO_WORDS + ' words — it came in at ' +
                 wordCount(bio) + '. Shorter, like a good epitaph.' });
      }
      await db.query(
        `INSERT INTO forum_profiles (member_id, display_name, bio, home)
         VALUES ($1, $2, $3, 'egregora')
         ON CONFLICT (member_id) DO UPDATE SET
           display_name = COALESCE(EXCLUDED.display_name, forum_profiles.display_name),
           bio = COALESCE(EXCLUDED.bio, forum_profiles.bio),
           updated_at = NOW()`,
        [me.id, display || null, bio || null]);
      mirror(me.email, { display_name: display || null, bio: bio || null }).catch(() => {});
      return res.json({ ok: true, saved: true });
    }

    if (body.action === 'avatar') {
      const part = String(body.part || '');
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(part) || part.length > 1966084) {
        return res.status(400).json({ error: 'That piece is not base64 the shelf expects.' });
      }
      await db.query(
        `INSERT INTO media_chunks (upload_id, seq, part) VALUES ($1, 0, $2)
         ON CONFLICT (upload_id, seq) DO UPDATE SET part = EXCLUDED.part`,
        ['av-' + me.id, part]);
      return res.json({ ok: true });
    }

    if (body.action === 'avatar-finish') {
      const { rows } = await db.query(
        'SELECT part FROM media_chunks WHERE upload_id = $1', ['av-' + me.id]);
      if (!rows.length) return res.status(400).json({ error: 'No picture arrived.' });
      const buf = Buffer.from(rows[0].part, 'base64');
      await db.query('DELETE FROM media_chunks WHERE upload_id = $1', ['av-' + me.id]);
      if (!buf.length || buf.length > AVATAR_MAX) {
        return res.status(413).json({ error: 'Keep the picture under 4 MB — the browser shrinks it first.' });
      }
      if (buf[0] !== 0xff || buf[1] !== 0xd8) {
        return res.status(400).json({ error: 'The picture must be a JPEG — the browser made it one.' });
      }
      const key = 'avatars/' + me.id + '-' + Date.now().toString(36) + '.jpg';
      await storage.put(key, buf, 'image/jpeg');
      await db.query(
        `INSERT INTO forum_profiles (member_id, avatar_key, home) VALUES ($1, $2, 'egregora')
         ON CONFLICT (member_id) DO UPDATE SET avatar_key = $2, updated_at = NOW()`,
        [me.id, key]);
      return res.json({ ok: true, stored: key });
    }

    if (body.action === 'bio-submit') {
      const bio = String(body.bio || '').trim().slice(0, 4000);
      if (wordCount(bio) > BIO_WORDS) {
        return res.status(400).json({
          error: 'The house biography is limited to ' + BIO_WORDS + ' words — it came in at ' +
                 wordCount(bio) + '. Shorter, like a good epitaph.' });
      }
      const display = String(body.display_name || me.name || '').trim().slice(0, 60);
      const b64 = String(body.image || '');
      let image_key = null;
      if (b64) {
        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64) || b64.length > 2500000) {
          return res.status(400).json({ error: 'That piece is not a picture the shelf can hold.' });
        }
        const buf = Buffer.from(b64, 'base64');
        if (!buf.length || buf.length > AVATAR_MAX) {
          return res.status(413).json({ error: 'Keep the picture under 4 MB — the browser shrinks it first.' });
        }
        if (buf[0] !== 0xff || buf[1] !== 0xd8) {
          return res.status(400).json({ error: 'The picture must be a JPEG — the browser made it one.' });
        }
        image_key = 'bios/' + me.id + '-' + Date.now().toString(36) + '.jpg';
        await storage.put(image_key, buf, 'image/jpeg');
      }
      await db.query(
        `INSERT INTO member_bios (member_id, display_name, bio, image_key, status, submitted_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW())
         ON CONFLICT (member_id) DO UPDATE SET
           display_name = COALESCE(EXCLUDED.display_name, member_bios.display_name),
           bio = EXCLUDED.bio,
           image_key = COALESCE(EXCLUDED.image_key, member_bios.image_key),
           status = 'pending',
           submitted_at = NOW(),
           reviewed_at = NULL`,
        [me.id, display || null, bio, image_key]);
      return res.json({ ok: true, status: 'pending' });
    }

    if (body.action === 'bio-remove') {
      await db.query('DELETE FROM member_bios WHERE member_id = $1', [me.id]);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'The shelf does not know that action.' });
  } catch (err) {
    console.error('profile:', err && err.message);
    return res.status(500).json({ error: 'The shelf stumbled. Try once more.' });
  }
}