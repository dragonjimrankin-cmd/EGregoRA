/**
 * POST /api/live — the order's camera, and the people allowed to watch it.
 *
 * What this is, said plainly: there is no media server behind this site and
 * no money for one, so a "live feed" here is the camera recording two
 * seconds at a time and the watchers playing those segments as they land.
 * It runs a handful of seconds behind the room. That is the honest cost of
 * doing it with a database and nothing else, and it is said on the page as
 * well as here.
 *
 * Who may watch: a signed-up member of this site **and** the holder of the
 * watchword the broadcaster typed before the countdown. Two locks, because
 * either alone is the wrong shape \u2014 an account is not an invitation, and
 * a shared word is not an identity.
 *
 * Actions
 *   { action: 'open',   pass, title, word, note? }   begin a feed
 *   { action: 'push',   pass, id, seq, part, head }  one segment
 *   { action: 'close',  pass, id }                   end it
 *   { action: 'mine',   pass }                       the broadcaster's view
 *   { action: 'list' }                               what is live, titles only
 *   { action: 'sky-name', stars, shape }             name a drawn constellation
 *   { action: 'air',    pass, on, note?, back_at? }  on air, or off
 *   { action: 'join',   id, word }                   members: may I watch?
 *   { action: 'pull',   id, word, since }            the next segments
 *   { action: 'say',    id, word, body }             a line in the room
 *   { action: 'room',   id, word, since }            chat, people, cameras
 *   { action: 'cam',    id, word, on }               raise or lower your own
 *                                                    camera in the room
 *   { action: 'cam-push', id, word, cam, seq, part } your camera's segments
 *   { action: 'people', pass, id }                   the broadcaster's table
 *   { action: 'allow',  pass, person|element|all, field, value } tick a box,
 *                                                    a whole element, or
 *                                                    everyone at once
 *   { action: 'keep-begin'|'keep-chunk'|'keep', pass, … } file the recording
 *   { action: 'tapes',  pass }                       the archive, as folders
 *   { action: 'tape-drop', pass, tape }              burn one
 *   { action: 'file-add', pass, url, title, mime }   file a generation
 */
import { ai, db, storage } from 'hatchable';
import { adminDoor } from '../lib/door.js';
import { requireStudio } from '../lib/accounts.js';
import { openChat } from '../lib/openchat.js';

export const access = 'public';
export const methods = ['POST'];

const KEEP_SECONDS = 180;      /* how far back a late watcher can reach */
const MAX_PART = 2.2 * 1024 * 1024;
const ARCHIVE_MAX = 400 * 1024 * 1024;  /* one recording, filed whole */
const STALE_MIN = 3;           /* no segment for this long and it is over */

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

async function hash(word) {
  const bytes = new TextEncoder().encode('egregora-live:' + word);
  const sum = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(sum)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* A feed whose camera stopped talking is over, whatever the row says. */
async function sweep() {
  await db.query(
    `UPDATE live_feeds SET state = 'ended', ended_at = NOW()
      WHERE state = 'live' AND beat_at < NOW() - INTERVAL '${STALE_MIN} minutes'`).catch(() => {});
  await db.query(
    `DELETE FROM live_chunks
      WHERE is_head = FALSE AND at < NOW() - INTERVAL '${KEEP_SECONDS} seconds'`).catch(() => {});
  await db.query(
    `DELETE FROM live_chunks WHERE feed_id IN (
       SELECT id FROM live_feeds WHERE state = 'ended' AND ended_at < NOW() - INTERVAL '1 hour')`)
    .catch(() => {});
}


/* Who this member is in this room, and what they are allowed to do. A row
   is made the first time they look in. */
const ELEMENTS = ['earth', 'fire', 'water', 'air', 'aether'];

async function person(feedId, me, element) {
  const name = (me && (me.display_name || me.name || me.email)) || 'a member';
  const el = ELEMENTS.indexOf(String(element || '').toLowerCase()) >= 0
    ? String(element).toLowerCase() : null;
  /* The declared element is written once and then only overwritten by a
     fresh declaration, so an ordinary poll does not quietly wipe it. */
  const { rows } = await db.query(
    `INSERT INTO live_people (feed_id, member_id, who, element) VALUES ($1, $2, $3, $4)
     ON CONFLICT (feed_id, member_id) DO UPDATE
       SET last_seen = NOW(), who = EXCLUDED.who,
           element = COALESCE(EXCLUDED.element, live_people.element)
     RETURNING *`, [feedId, me && me.id ? me.id : null, String(name).slice(0, 80), el]);
  return rows && rows[0];
}

export default async function (req, res) {
  const body = req.body || {};
  const action = clean(body.action || 'list', 12);

  try {
    /* ------------------------------------------------------- the watchers */
    if (action === 'list') {
      await sweep();
      const { rows } = await db.query(
        `SELECT id, title, note, started_at, watchers FROM live_feeds
          WHERE state = 'live' AND parent_id IS NULL ORDER BY started_at DESC LIMIT 20`);
      const { rows: air } = await db.query('SELECT * FROM live_air WHERE only_row = TRUE');
      const state = (air && air[0]) || { on_air: false, note: '', back_at: '' };
      return res.json({
        ok: true,
        air: { on: state.on_air === true, note: state.note || '', back_at: state.back_at || '', at: state.at },
        feeds: (rows || []).map((r) => ({
          id: Number(r.id),
          title: r.title,
          note: r.note || '',
          since: r.started_at,
          watchers: r.watchers || 0
        }))
      });
    }

    /* The off-air sky: a visitor has closed a loop of stars and wants the
       order to name it. Public, tiny, and never a blocker \u2014 if no model
       answers, the page has its own list of names and uses that instead. */
    if (action === 'sky-name') {
      const stars = Math.max(3, Math.min(40, Number(body.stars) || 3));
      const shape = clean(body.shape, 200);
      const ask = 'A visitor to an order of natural philosophy has joined ' + stars +
        ' stars into a closed figure on an off-air holding card. The figure is ' +
        (shape || 'an irregular closed loop') + '. Name that constellation.';
      const system = 'You name constellations for EGregoRA, an order of natural enquiry. ' +
        'Reply with the name alone: two to four words, beginning with "The", in the manner of ' +
        '"The Lesser Kettle", "The Unlit Lamp", "The Patient Fox" \u2014 homely, slightly wry, ' +
        'never grand, never Latin, never a real constellation, no quotation marks, no full stop, ' +
        'no explanation.';

      const tidy = (raw) => {
        let name = String(raw || '').trim();
        /* Models like to answer with a label, a preamble or a flourish. Take
           the last non-empty line, drop any "Name:" in front of it, and keep
           only the letters, spaces, hyphens and apostrophes a name can have. */
        const lines = name.split('\n').map((l) => l.trim()).filter(Boolean);
        name = lines.length ? lines[lines.length - 1] : '';
        name = name.replace(/^[^A-Za-z]*(?:name|constellation|answer)\s*[:\u2014-]\s*/i, '');
        name = name.replace(/["'`*_.!?]+/g, ' ').replace(/\([^)]*\)/g, ' ');
        name = name.replace(/[^A-Za-z '-]+/g, ' ').replace(/\s+/g, ' ').trim();
        const words = name.split(' ').filter(Boolean);
        if (!words.length) return '';
        if (words.length > 5) return '';
        name = words.join(' ').slice(0, 40).trim();
        if (name.length < 3) return '';
        if (!/^the$/i.test(words[0])) name = 'The ' + name;
        return name.replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
      };

      for (const model of ['flash', 'haiku', 'gpt-4o']) {
        try {
          const out = await ai.generateText({
            model, system, messages: [{ role: 'user', content: ask }],
            maxTokens: 32, temperature: 1, purpose: 'constellation'
          });
          const name = tidy(out && out.text);
          if (name) return res.json({ ok: true, name, by: (out && out.model) || model });
        } catch (err) {
          console.error('live: sky-name ' + model + ' failed', err && err.message);
        }
      }
      try {
        const out = await openChat({
          system, messages: [{ role: 'user', content: ask }], maxTokens: 32, temperature: 1
        });
        const name = tidy(out && out.text);
        if (name) return res.json({ ok: true, name, by: (out && out.model) || 'open weights' });
      } catch (err) {
        console.error('live: sky-name open route failed', err && err.message);
      }

      /* Every model route is a bill somebody has to pay, and on the day this
         was written all three said so: Anthropic out of credit, no OpenAI
         key, Hugging Face inference credits spent. A dead button would be
         the wrong answer to that, so the order names the figure itself,
         from its own vocabulary, shaped by what was actually drawn. The
         model chain above stays first in the queue: the moment a key has
         credit again this falls back to being the fallback. */
      const pick = (list) => list[Math.floor(Math.random() * list.length)];
      const wide = /wider than tall/.test(shape);
      const tall = /tall and narrow/.test(shape);
      const high = /high in the sky/.test(shape);
      const low = /low on the horizon/.test(shape);

      const size = stars >= 9 ? ['Greater', 'Rambling', 'Long', 'Unfinished']
        : stars <= 4 ? ['Lesser', 'Spare', 'Little', 'Quiet'] : ['Middling', 'Plain', 'Second'];
      const lean = wide ? ['Flattened', 'Reclining', 'Spilled', 'Low-Slung']
        : tall ? ['Upright', 'Standing', 'Tall', 'Leaning'] : ['Turning', 'Folded', 'Even'];
      const where = high ? ['High', 'Upper', 'Overhead'] : low ? ['Sunken', 'Setting', 'Low'] : [];
      const nouns = [
        'Kettle', 'Lamp', 'Fox', 'Compass', 'Vowel', 'Druid', 'Limb', 'Argument', 'Rune',
        'Thought', 'Cup', 'Proof', 'Lantern', 'Hare', 'Ladle', 'Yew', 'Ferryman', 'Candle',
        'Hinge', 'Shepherd', 'Bellows', 'Acorn', 'Orchard', 'Wren', 'Anvil', 'Thimble',
        'Heron', 'Scribe', 'Beekeeper', 'Milestone', 'Weathervane', 'Spindle'
      ];
      const mood = [
        'Patient', 'Unlit', 'Broken', 'Sleeping', 'Borrowed', 'Upturned', 'Slow', 'Honest',
        'Doubtful', 'Half-Mended', 'Stubborn', 'Reluctant', 'Watchful', 'Forgetful', 'Tidy'
      ];

      const shapes = [size, lean, where].filter((l) => l.length);
      const first = pick(shapes[Math.floor(Math.random() * shapes.length)]);
      const name = Math.random() < 0.45
        ? 'The ' + first + ' ' + pick(nouns)
        : 'The ' + pick(mood) + ' ' + pick(nouns);
      return res.json({ ok: true, name, by: "the order's own lexicon", lexicon: true });
    }

    if (action === 'join' || action === 'pull') {
      /* Both locks. The member check first, because it is the one that
         carries a name. */
      const door = await requireStudio(req);
      if (!door.ok) return res.status(door.status).json({ error: door.error, gate: door.reason });

      const id = Number(body.id);
      const word = clean(body.word, 120);
      if (!id || !word) return res.status(400).json({ error: 'Which feed, and the watchword?' });

      const { rows } = await db.query('SELECT * FROM live_feeds WHERE id = $1', [id]);
      const feed = rows && rows[0];
      if (!feed) return res.status(404).json({ error: 'There is no such feed.' });
      if (feed.word_hash !== await hash(word)) {
        return res.status(401).json({ error: 'That is not the watchword for this feed.' });
      }

      if (action === 'join') {
        /* The door asks one question of its own: which elemental phase your
           integral is aligned with. It is not a gate — an answer is taken
           and recorded, never graded — but it is what the broadcaster's
           table is grouped by, so it is asked before you come in rather
           than guessed at afterwards. */
        const el = clean(body.element, 10).toLowerCase();
        if (ELEMENTS.indexOf(el) < 0) {
          return res.status(400).json({
            error: 'Name the elemental phase your integral is aligned with: earth, fire, water, air or aether.',
            gate: 'element', elements: ELEMENTS
          });
        }
        const me = await person(id, door.member, el);
        await db.query('UPDATE live_feeds SET watchers = watchers + 1 WHERE id = $1', [id]).catch(() => {});
        return res.json({
          ok: true,
          title: feed.title, note: feed.note || '', mime: feed.mime || 'video/webm',
          state: feed.state, since: feed.started_at,
          element: me.element, you: { who: me.who, can_chat: me.can_chat, can_cam: me.can_cam, can_mic: me.can_mic }
        });
      }

      const since = Number(body.since);
      const from = Number.isFinite(since) ? since : -1;
      /* The header segment always comes first for a watcher who has not had
         it; without it the rest is undecodable. */
      const want = from < 0
        ? await db.query(
          `SELECT seq, is_head, part FROM live_chunks
            WHERE feed_id = $1 AND (is_head = TRUE OR at > NOW() - INTERVAL '20 seconds')
            ORDER BY seq ASC LIMIT 20`, [id])
        : await db.query(
          'SELECT seq, is_head, part FROM live_chunks WHERE feed_id = $1 AND seq > $2 ORDER BY seq ASC LIMIT 20',
          [id, from]);

      return res.json({
        ok: true,
        state: feed.state,
        mime: feed.mime || 'video/webm',
        parts: (want.rows || []).map((r) => ({ seq: r.seq, head: r.is_head, part: r.part }))
      });
    }

    /* ------------------------------------------------------- the live room
       Chat, the people in it, and the members who have raised a camera of
       their own. Every one of these needs a member account and the
       watchword, exactly as watching does. */
    if (action === 'say' || action === 'room' || action === 'cam' || action === 'cam-push') {
      const door = await requireStudio(req);
      if (!door.ok) return res.status(door.status).json({ error: door.error, gate: door.reason });

      const id = Number(body.id);
      const word = clean(body.word, 120);
      const { rows } = await db.query('SELECT * FROM live_feeds WHERE id = $1', [id]);
      const feed = rows && rows[0];
      if (!feed) return res.status(404).json({ error: 'There is no such feed.' });
      if (feed.word_hash !== await hash(word)) {
        return res.status(401).json({ error: 'That is not the watchword for this feed.' });
      }

      const me = await person(id, door.member, body.element);
      if (me.blocked) {
        return res.status(403).json({ error: 'The broadcaster has closed this room to you.' });
      }

      if (action === 'say') {
        if (!me.can_chat) return res.status(403).json({ error: 'Your voice in the chat is turned off.' });
        const line = clean(body.body, 600);
        if (!line) return res.status(400).json({ error: 'Nothing to say.' });
        await db.query('INSERT INTO live_chat (feed_id, member_id, who, body) VALUES ($1,$2,$3,$4)',
          [id, me.member_id, me.who, line]);
        return res.json({ ok: true });
      }

      if (action === 'cam') {
        if (body.on === false) {
          await db.query(
            "UPDATE live_feeds SET state = 'ended', ended_at = NOW() WHERE parent_id = $1 AND who = $2",
            [id, me.who]);
          return res.json({ ok: true, cam: null });
        }
        if (!me.can_cam) {
          return res.status(403).json({
            error: 'The broadcaster has not opened the floor to you yet. Ask in the chat.'
          });
        }
        const { rows: made } = await db.query(
          `INSERT INTO live_feeds (title, who, word_hash, mime, state, parent_id)
           VALUES ($1, $2, $3, $4, 'live', $5) RETURNING id`,
          [me.who + ' in the room', me.who, feed.word_hash,
            clean(body.mime, 80) || 'video/webm', id]);
        return res.json({ ok: true, cam: Number(made[0].id) });
      }

      if (action === 'cam-push') {
        if (!me.can_cam) return res.status(403).json({ error: 'Your camera is not open.' });
        const cam = Number(body.cam);
        const seq = Number(body.seq);
        const part = String(body.part || '');
        if (!cam || !Number.isFinite(seq) || !part) return res.status(400).json({ error: 'A segment with no place.' });
        if (part.length > MAX_PART) return res.status(413).json({ error: 'That segment is too large.' });
        const { rows: mine } = await db.query(
          'SELECT id FROM live_feeds WHERE id = $1 AND parent_id = $2 AND who = $3', [cam, id, me.who]);
        if (!mine || !mine[0]) return res.status(403).json({ error: 'That is not your camera.' });
        await db.query(
          `INSERT INTO live_chunks (feed_id, seq, is_head, part) VALUES ($1,$2,$3,$4)
           ON CONFLICT (feed_id, seq) DO NOTHING`, [cam, seq, body.head === true, part]);
        await db.query('UPDATE live_feeds SET seq = GREATEST(seq, $2), beat_at = NOW() WHERE id = $1', [cam, seq]);
        return res.json({ ok: true });
      }

      /* action === 'room' */
      const since = Number(body.since) || 0;
      const { rows: lines } = await db.query(
        `SELECT id, who, body, is_order, at FROM live_chat
          WHERE feed_id = $1 AND id > $2 AND hidden = FALSE ORDER BY id ASC LIMIT 80`, [id, since]);
      const { rows: folk } = await db.query(
        `SELECT who, element, can_chat, can_cam, can_mic, blocked FROM live_people
          WHERE feed_id = $1 AND last_seen > NOW() - INTERVAL '2 minutes' ORDER BY joined_at ASC LIMIT 100`,
        [id]);
      const { rows: cams } = await db.query(
        "SELECT id, who FROM live_feeds WHERE parent_id = $1 AND state = 'live' ORDER BY started_at ASC LIMIT 8",
        [id]);
      return res.json({
        ok: true,
        state: feed.state,
        you: { who: me.who, element: me.element, can_chat: me.can_chat, can_cam: me.can_cam, can_mic: me.can_mic },
        lines: (lines || []).map((l) => ({
          id: Number(l.id), who: l.who, body: l.body, order: l.is_order, at: l.at
        })),
        people: folk || [],
        cams: (cams || []).map((c) => ({ id: Number(c.id), who: c.who }))
      });
    }

    /* ---------------------------------------------------- the broadcaster */
    const admin = await adminDoor(req, body.pass);
    if (!admin.ok) return res.status(admin.status).json({ error: admin.error });

    /* The sign over the door. Flipping it off does not end a running feed
       \u2014 that is a separate decision \u2014 it tells everyone who comes to the
       page that nothing is expected for now, and why. */
    if (action === 'air') {
      const on = body.on === true;
      await db.query(
        `INSERT INTO live_air (only_row, on_air, note, back_at, at)
         VALUES (TRUE, $1, $2, $3, NOW())
         ON CONFLICT (only_row) DO UPDATE
           SET on_air = EXCLUDED.on_air, note = EXCLUDED.note,
               back_at = EXCLUDED.back_at, at = NOW()`,
        [on, clean(body.note, 300), clean(body.back_at, 80)]);
      return res.json({ ok: true, on });
    }

    if (action === 'open') {
      const title = clean(body.title, 160);
      const word = clean(body.word, 120);
      if (!title) return res.status(400).json({ error: 'Give the feed a title.' });
      if (word.length < 3) return res.status(400).json({ error: 'The watchword needs at least three characters.' });

      await sweep();
      const { rows } = await db.query(
        `INSERT INTO live_feeds (title, note, word_hash, mime, state)
         VALUES ($1, $2, $3, $4, 'live') RETURNING id, started_at`,
        [title, clean(body.note, 400), await hash(word), clean(body.mime, 80) || 'video/webm']);
      return res.json({ ok: true, id: Number(rows[0].id), started: rows[0].started_at });
    }

    if (action === 'push') {
      const id = Number(body.id);
      const seq = Number(body.seq);
      const part = String(body.part || '');
      if (!id || !Number.isFinite(seq) || !part) return res.status(400).json({ error: 'A segment with no place.' });
      if (part.length > MAX_PART) return res.status(413).json({ error: 'That segment is too large. Use a lower quality.' });

      await db.query(
        `INSERT INTO live_chunks (feed_id, seq, is_head, part) VALUES ($1, $2, $3, $4)
         ON CONFLICT (feed_id, seq) DO NOTHING`, [id, seq, body.head === true, part]);
      await db.query('UPDATE live_feeds SET seq = GREATEST(seq, $2), beat_at = NOW() WHERE id = $1', [id, seq]);
      if (seq % 10 === 0) await sweep();
      return res.json({ ok: true, seq });
    }

    if (action === 'close') {
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Which feed?' });
      await db.query("UPDATE live_feeds SET state = 'ended', ended_at = NOW() WHERE id = $1", [id]);
      await db.query('DELETE FROM live_chunks WHERE feed_id = $1', [id]).catch(() => {});
      return res.json({ ok: true });
    }

    if (action === 'people') {
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Which feed?' });
      const { rows } = await db.query(
        `SELECT id, who, element, can_chat, can_cam, can_mic, blocked, last_seen FROM live_people
          WHERE feed_id = $1 ORDER BY joined_at ASC LIMIT 200`, [id]);
      const { rows: cams } = await db.query(
        "SELECT id, who FROM live_feeds WHERE parent_id = $1 AND state = 'live'", [id]);
      return res.json({
        ok: true,
        people: (rows || []).map((r) => ({
          id: Number(r.id), who: r.who, element: r.element || 'unsaid',
          can_chat: r.can_chat, can_cam: r.can_cam, can_mic: r.can_mic,
          blocked: r.blocked, seen: r.last_seen,
          on_camera: (cams || []).some((c) => c.who === r.who)
        }))
      });
    }

    /* The supervisory powers. One person, one whole elemental phase, or
       every non-admin in the room at once \u2014 a broadcaster dealing with
       feedback from six open microphones should be able to shut all six
       with one press, and reopen one of them afterwards. */
    if (action === 'allow') {
      const field = clean(body.field, 10);
      if (['can_chat', 'can_cam', 'can_mic', 'blocked'].indexOf(field) < 0) {
        return res.status(400).json({ error: 'Which box? can_chat, can_cam, can_mic or blocked.' });
      }
      const on = body.value === true;
      const feed = Number(body.id);
      const who = Number(body.person);
      const element = clean(body.element, 10).toLowerCase();
      const all = body.all === true;

      let rows = [];
      if (who) {
        const r = await db.query(
          'UPDATE live_people SET ' + field + ' = $2 WHERE id = $1 RETURNING feed_id, who', [who, on]);
        rows = r.rows || [];
      } else if (all && feed) {
        const r = await db.query(
          'UPDATE live_people SET ' + field + ' = $2 WHERE feed_id = $1 RETURNING feed_id, who', [feed, on]);
        rows = r.rows || [];
      } else if (element && feed) {
        if (ELEMENTS.indexOf(element) < 0 && element !== 'unsaid') {
          return res.status(400).json({ error: 'There is no such elemental phase.' });
        }
        const r = element === 'unsaid'
          ? await db.query(
            'UPDATE live_people SET ' + field + ' = $2 WHERE feed_id = $1 AND element IS NULL RETURNING feed_id, who',
            [feed, on])
          : await db.query(
            'UPDATE live_people SET ' + field + ' = $2 WHERE feed_id = $1 AND element = $3 RETURNING feed_id, who',
            [feed, on, element]);
        rows = r.rows || [];
      } else {
        return res.status(400).json({ error: 'Which person, which element, or all of them?' });
      }

      /* Taking a camera away takes the picture down with it; a block takes
         everything at once, because a nuisance should be one press and not
         four. */
      const close = async (list) => {
        for (const r of list) {
          await db.query(
            "UPDATE live_feeds SET state = 'ended', ended_at = NOW() WHERE parent_id = $1 AND who = $2",
            [r.feed_id, r.who]);
        }
      };
      if (field === 'can_cam' && !on) await close(rows);
      if (field === 'blocked' && on) {
        for (const r of rows) {
          await db.query(
            'UPDATE live_people SET can_cam = FALSE, can_chat = FALSE, can_mic = FALSE WHERE feed_id = $1 AND who = $2',
            [r.feed_id, r.who]);
        }
        await close(rows);
      }
      return res.json({ ok: true, changed: rows.length });
    }

    /* ----------------------------------------------------------- the archive
       A feed's segments are a transport format and are still deleted when it
       ends. The recording is a separate thing: the browser records the same
       programme to a file and sends it here when the feed stops, and it is
       filed in a folder named for the day. Nothing is kept that the
       broadcaster did not record on purpose. */
    if (action === 'keep-begin') {
      const upload = clean(body.upload, 64);
      if (!upload) return res.status(400).json({ error: 'No name for the recording.' });
      await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]);
      await db.query("DELETE FROM media_chunks WHERE at < NOW() - INTERVAL '2 hours'").catch(() => {});
      return res.json({ ok: true, upload, chunk_max: Math.floor(MAX_PART) });
    }

    if (action === 'keep-chunk') {
      const upload = clean(body.upload, 64);
      const seq = Number(body.seq);
      const part = String(body.part || '');
      if (!upload || !Number.isFinite(seq)) return res.status(400).json({ error: 'A piece with no place.' });
      if (part.length > MAX_PART * 1.1) return res.status(413).json({ error: 'That piece is too large.' });
      await db.query(
        `INSERT INTO media_chunks (upload_id, seq, part) VALUES ($1, $2, $3)
         ON CONFLICT (upload_id, seq) DO UPDATE SET part = EXCLUDED.part`, [upload, seq, part]);
      return res.json({ ok: true, seq });
    }

    if (action === 'keep') {
      const upload = clean(body.upload, 64);
      const title = clean(body.title, 200) || 'An unnamed broadcast';
      if (!upload) return res.status(400).json({ error: 'No name for the recording.' });
      const { rows } = await db.query(
        'SELECT seq, part FROM media_chunks WHERE upload_id = $1 ORDER BY seq ASC', [upload]);
      if (!rows || !rows.length) return res.status(400).json({ error: 'Nothing arrived.' });
      const whole = Buffer.concat(rows.map((r) => Buffer.from(r.part, 'base64')));
      await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]);
      if (!whole.length) return res.status(400).json({ error: 'The recording came through empty.' });
      if (whole.length > ARCHIVE_MAX) {
        return res.status(413).json({ error: 'That recording is larger than the ' +
          Math.round(ARCHIVE_MAX / 1048576) + ' MB the archive will take in one piece.' });
      }

      const mime = clean(body.mime, 80) || 'video/webm';
      const ext = mime.indexOf('mp4') >= 0 ? 'mp4' : mime.indexOf('audio') >= 0 ? 'webm' : 'webm';
      const stamp = new Date();
      const folder = clean(body.folder, 60) || stamp.toISOString().slice(0, 10);
      const name = stamp.toISOString().replace(/[:.]/g, '-') + '.' + ext;
      const key = 'live-archive/' + folder + '/' + name;
      await storage.put(key, whole, mime);
      const { rows: made } = await db.query(
        `INSERT INTO live_tapes (feed_id, folder, name, title, store, mime, bytes, seconds)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [Number(body.id) || null, folder, name, title, key, mime, whole.length,
          Math.max(0, Math.round(Number(body.seconds) || 0))]);
      return res.json({ ok: true, id: Number(made[0].id), folder, name, bytes: whole.length });
    }

    if (action === 'tapes') {
      const { rows } = await db.query(
        'SELECT * FROM live_tapes ORDER BY at DESC LIMIT 400');
      const out = [];
      for (const r of rows || []) {
        out.push({
          id: Number(r.id), folder: r.folder, name: r.name, title: r.title,
          mime: r.mime, bytes: Number(r.bytes), seconds: Number(r.seconds), at: r.at,
          url: await storage.url(r.store, { ttl: 21600 })
        });
      }
      return res.json({ ok: true, tapes: out });
    }

    /* Something made elsewhere on the site \u2014 a picture Gink drew, a film it
       cut \u2014 filed into the same folders the Director's Desk browses. The
       file is fetched server-side and stored by the order, so the archive
       does not fill up with links that expire. */
    if (action === 'file-add') {
      const from = clean(body.url, 1000);
      if (!from) return res.status(400).json({ error: 'Nothing to file.' });
      if (!/^https?:\/\//i.test(from)) return res.status(400).json({ error: 'That is not a fetchable address.' });

      const r = await fetch(from);
      if (!r.ok) return res.status(502).json({ error: 'That file would not come down (HTTP ' + r.status + ').' });
      const bytes = new Uint8Array(await r.arrayBuffer());
      if (!bytes.length) return res.status(400).json({ error: 'That file came down empty.' });
      if (bytes.length > ARCHIVE_MAX) {
        return res.status(413).json({ error: 'That file is larger than the ' +
          Math.round(ARCHIVE_MAX / 1048576) + ' MB the archive will take in one piece.' });
      }

      const mime = clean(body.mime, 80) || r.headers.get('content-type') || 'application/octet-stream';
      const ext = /mp4/.test(mime) ? 'mp4' : /webm/.test(mime) ? 'webm' : /png/.test(mime) ? 'png'
        : /jpe?g/.test(mime) ? 'jpg' : /gif/.test(mime) ? 'gif' : /mpeg|mp3/.test(mime) ? 'mp3'
          : /wav/.test(mime) ? 'wav' : 'bin';
      const stamp = new Date();
      const folder = clean(body.folder, 60) || 'generations';
      const name = stamp.toISOString().replace(/[:.]/g, '-') + '.' + ext;
      const key = 'live-archive/' + folder + '/' + name;
      await storage.put(key, bytes, mime);
      const { rows: made } = await db.query(
        `INSERT INTO live_tapes (feed_id, folder, name, title, store, mime, bytes, seconds)
         VALUES (NULL,$1,$2,$3,$4,$5,$6,0) RETURNING id`,
        [folder, name, clean(body.title, 200) || 'A generation', key, mime, bytes.length]);
      return res.json({
        ok: true, id: Number(made[0].id), folder, name, bytes: bytes.length,
        url: await storage.url(key, { ttl: 21600 })
      });
    }

    if (action === 'tape-drop') {
      const tape = Number(body.tape);
      if (!tape) return res.status(400).json({ error: 'Which recording?' });
      const { rows } = await db.query('SELECT store FROM live_tapes WHERE id = $1', [tape]);
      if (rows && rows[0] && storage.delete) await storage.delete(rows[0].store).catch(() => {});
      await db.query('DELETE FROM live_tapes WHERE id = $1', [tape]);
      return res.json({ ok: true });
    }

    /* The order's own line in the chat, marked as the order's. */
    if (action === 'order-say') {
      const id = Number(body.id);
      const line = clean(body.body, 600);
      if (!id || !line) return res.status(400).json({ error: 'Which feed, and what?' });
      await db.query(
        "INSERT INTO live_chat (feed_id, who, body, is_order) VALUES ($1, 'The Order', $2, TRUE)",
        [id, line]);
      return res.json({ ok: true });
    }

    if (action === 'hide-line') {
      await db.query('UPDATE live_chat SET hidden = TRUE WHERE id = $1', [Number(body.line)]);
      return res.json({ ok: true });
    }

    if (action === 'mine') {
      await sweep();
      const { rows } = await db.query(
        `SELECT id, title, state, watchers, started_at, ended_at, seq FROM live_feeds
          WHERE parent_id IS NULL ORDER BY started_at DESC LIMIT 20`);
      return res.json({
        ok: true,
        feeds: (rows || []).map((r) => ({
          id: Number(r.id), title: r.title, state: r.state, watchers: r.watchers || 0,
          segments: r.seq, since: r.started_at, until: r.ended_at
        }))
      });
    }

    return res.status(400).json({ error: 'No such action.' });
  } catch (err) {
    console.error('live:', err && err.message);
    return res.status(500).json({ error: (err && err.message) || 'The feed failed.' });
  }
}
