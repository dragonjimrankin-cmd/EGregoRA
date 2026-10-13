/**
 * POST /api/media — the publishing door behind /podcast/ and /videos/.
 *
 * Until now an episode was published by committing an MP3 to the repo and
 * hand-editing a JSON file, which means publishing required a laptop, a
 * clone and a push. This is the other way in: sign in with the order's
 * passcode, hand over a file, let the browser clean it up, and it joins the
 * list on the page.
 *
 * The master goes into the project's object storage; this is only the
 * catalogue in front of it. Storage URLs are signed and expire, so a fresh
 * one is minted every time the list is read rather than written down.
 *
 * A browser cannot hand over an hour of audio in one request, so an upload
 * arrives in pieces: 'begin', then 'chunk' as many times as it takes, then
 * 'finish', which glues them together and puts the whole thing away.
 *
 * Actions
 *   { action: 'list', kind }                       published items \u2014 no passcode
 *   { action: 'shelf', kind, pass }                everything, drafts included
 *   { action: 'begin', pass, upload, mime }        start an upload
 *   { action: 'chunk', pass, upload, seq, part }   one piece, base64
 *   { action: 'finish', pass, upload, kind, \u2026 }    glue, store, catalogue
 *   { action: 'publish'|'unpublish', pass, id }    show it, or take it down
 *   { action: 'edit', pass, id, \u2026 }                change the writing
 *   { action: 'delete', pass, id }                 remove it entirely
 *   { action: 'replace', pass, id, upload, … }     a new master for an
 *                                                  existing item: what a cut
 *                                                  or a merge saves
 *   { action: 'attach', pass, id, upload, role }   a cover, or a plate cued
 *                                                  to a moment in the sound
 *   { action: 'cue'|'drop-image', pass, image_id } move or remove a plate
 *   { action: 'one', pass, id }                    one item, freshly signed
 *   { action: 'pin'|'unpin', pass, id }            hold it at the top of the
 *                                                  page — three at most
 *   { action: 'voiceprints', pass }                 encrypted consenting templates
 *   { action: 'enrol-voiceprint', pass, … }         store a browser-sealed template
 *   { action: 'delete-voiceprint', pass, name }     revoke and erase a template
 *   { action: 'voiceprint-labels', pass, id, … }    apply local biometric matches
 */
import { db, storage } from 'hatchable';
import { adminDoor } from '../lib/door.js';
import { doors as freeDoors, freeChat } from '../lib/freeai.js';
import { assembleUpload } from '../lib/upload-parts.js';

export const access = 'public';
export const methods = ['POST'];

const MAX_BYTES = 220 * 1024 * 1024;      /* a long episode, comfortably */
const MAX_CHUNK = 1.4 * 1024 * 1024;      /* base64, per request */
const TTL = 604800;                        /* a week; re-signed on every read */

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;

function voiceprintName(value) {
  const name = clean(value, 80).replace(/\s+/g, ' ');
  if (name.length < 2 || /^speaker\s+\d+$/i.test(name) || /[<>\u0000-\u001f]/.test(name)) return '';
  return name;
}

function sealedPart(value, max) {
  const part = clean(value, max);
  return part && B64.test(part) ? part : '';
}

function sealedBytes(value) {
  try { return Buffer.from(value, 'base64').length; } catch { return 0; }
}

function cleanDate(value) {
  const raw = clean(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
  const made = new Date(raw + 'T00:00:00Z');
  return Number.isFinite(made.getTime()) && made.toISOString().slice(0, 10) === raw ? raw : '';
}

function dateOnly(value) {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const made = new Date(value);
  return Number.isFinite(made.getTime()) ? made.toISOString().slice(0, 10) : '';
}

const safeList = (raw) => {
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
};

/* A transcript keeps one timestamp per turn: when the named voice changes.
   Older transcripts stamped every Whisper fragment, so they are parsed into
   turns at read time without throwing away the original words in storage. */
const wordsOf = (text) => (String(text || '').toLowerCase().match(/[a-z0-9]+(?:['’][a-z0-9]+)*/g) || []);

function secondsAt(stamp) {
  const s = String(stamp || '').trim().toLowerCase();
  let m;
  if (/[hms]/.test(s)) {
    m = /^(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?$/.exec(s.replace(/\s+/g, ''));
    return m ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
  }
  const parts = s.split(':').map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return 0;
  return parts.length > 2
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : (parts[0] || 0) * 60 + (parts[1] || 0);
}

function transcriptTurns(raw, speakers) {
  const byNumber = new Map((speakers || []).map((s) => [Number(s.speaker_no), s.name]));
  const byName = new Map((speakers || []).map((s) => [String(s.name).toLowerCase(), Number(s.speaker_no)]));
  const turns = [];
  let active = null;

  for (const sourceLine of String(raw || '').replace(/\r/g, '').split('\n')) {
    const line = sourceLine.trim();
    if (!line) continue;
    const stamped = /^\[([^\]]+)\]\s*(.*)$/.exec(line);
    if (!stamped) {
      if (active) active.text += (active.text ? ' ' : '') + line;
      continue;
    }

    const stamp = stamped[1].trim();
    let rest = stamped[2].trim();
    let speakerNo = null;
    let name = '';
    const numbered = /^Speaker\s+(\d+)\s*(?:—|-|:)\s*(.*)$/i.exec(rest);
    const named = !numbered && /^([^—]{1,80}?)\s+—\s*(.*)$/.exec(rest);
    let labelled = numbered ? [numbered[0], numbered[1], '', numbered[2]] : null;
    if (named && byName.has(named[1].trim().toLowerCase())) {
      labelled = [named[0], '', named[1].trim(), named[2]];
    }
    if (labelled) {
      speakerNo = labelled[1] ? Number(labelled[1]) : null;
      name = speakerNo ? (byNumber.get(speakerNo) || 'Speaker ' + speakerNo) : String(labelled[2] || '').trim();
      if (!speakerNo && name) speakerNo = byName.get(name.toLowerCase()) || null;
      rest = String(labelled[3] || '').trim();
    } else if (active) {
      speakerNo = active.speakerNo;
      name = active.name;
    }

    const identity = speakerNo ? 'n:' + speakerNo : name ? 's:' + name.toLowerCase() : 'unlabelled';
    if (active && active.identity === identity) {
      active.text += (active.text ? ' ' : '') + rest;
      continue;
    }
    active = { identity, speakerNo, name, stamp, seconds: secondsAt(stamp), text: rest };
    turns.push(active);
  }
  return turns;
}

function displayTranscript(raw, speakers) {
  const turns = transcriptTurns(raw, speakers);
  if (!turns.length) return String(raw || '').trim();
  return turns.map((t) => '[' + t.stamp + '] ' +
    (t.name ? t.name + ' — ' : '') + t.text.trim()).join('\n\n').trim();
}

const COMMON_WORDS = new Set(('a an and are as at be been being but by can could did do does for from had has have he her ' +
  'hers him his i if in into is it its just me more my no not of on one or our out she so some than that the their ' +
  'them then there these they this those to up us very was we were what when where which who why will with would you your').split(' '));

function speechPatterns(turns) {
  const groups = new Map();
  turns.forEach((turn, index) => {
    if (!turn.name || !turn.speakerNo) return;
    if (!groups.has(turn.name)) groups.set(turn.name, { turns: [], seconds: 0, timed: 0 });
    const group = groups.get(turn.name);
    group.turns.push(turn);
    const next = turns[index + 1];
    if (next && next.seconds > turn.seconds) {
      group.seconds += Math.min(600, next.seconds - turn.seconds);
      group.timed += 1;
    }
  });

  const result = new Map();
  for (const [name, group] of groups) {
    const all = wordsOf(group.turns.map((t) => t.text).join(' '));
    if (!all.length) continue;
    const counts = new Map();
    for (const word of all) {
      if (word.length < 3 || COMMON_WORDS.has(word)) continue;
      counts.set(word, (counts.get(word) || 0) + 1);
    }
    const characteristic = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 14)
      .map(([word, uses]) => ({ word, uses }));
    const unique = new Set(all);
    const fillers = all.filter((w) => /^(um|uh|erm|hmm|like|basically|actually)$/.test(w)).length;
    const questions = group.turns.filter((t) => /\?\s*$/.test(t.text)).length;
    const mean = (n) => Math.round(n * 100) / 100;
    result.set(name, {
      kind: 'aggregate linguistic cadence; not a voiceprint',
      sample_quality: all.length < 50
        ? 'provisional; small attributed sample'
        : all.length < 250 ? 'limited' : 'substantial',
      turns: group.turns.length,
      words: all.length,
      mean_words_per_turn: mean(all.length / group.turns.length),
      mean_word_characters: mean(all.reduce((n, w) => n + w.length, 0) / all.length),
      vocabulary_ratio: mean(unique.size / all.length),
      question_turn_ratio: mean(questions / group.turns.length),
      filler_words_per_thousand: mean(fillers * 1000 / all.length),
      estimated_words_per_minute: group.seconds > 5 ? mean(all.length * 60 / group.seconds) : null,
      mean_timed_turn_seconds: group.timed ? mean(group.seconds / group.timed) : null,
      characteristic_words: characteristic
    });
  }
  return result;
}

async function speakersFor(mediaId) {
  try {
    const { rows } = await db.query(
      'SELECT speaker_no, name, profiled_chars FROM media_speakers WHERE media_id = $1 ORDER BY speaker_no',
      [mediaId]);
    return rows || [];
  } catch { return []; }
}

async function ensureSpeakerPatterns(mediaId, raw, supplied) {
  const speakers = supplied || await speakersFor(mediaId);
  const chars = String(raw || '').length;
  if (!chars || !speakers.length) return { speakers, stored: false };
  if (speakers.every((s) => Number(s.profiled_chars) === chars)) return { speakers, stored: true };

  const patterns = speechPatterns(transcriptTurns(raw, speakers));
  for (const speaker of speakers) {
    const pattern = patterns.get(speaker.name);
    if (!pattern) continue;
    await db.query(
      `INSERT INTO speaker_profiles (name, patterns, sample_words, source_media_id, updated_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (name) DO UPDATE SET patterns = EXCLUDED.patterns,
         sample_words = EXCLUDED.sample_words, source_media_id = EXCLUDED.source_media_id,
         updated_at = NOW()`,
      [speaker.name, JSON.stringify(pattern), pattern.words, mediaId]);
    await db.query(
      `UPDATE media_speakers SET profiled_chars = $3, updated_at = NOW()
        WHERE media_id = $1 AND speaker_no = $2`,
      [mediaId, Number(speaker.speaker_no), chars]);
    speaker.profiled_chars = chars;
  }
  /* `stored` means every declared speaker has enough attributed words for a
     profile. Never mark all speakers complete merely because one profile was
     derivable. */
  return {
    speakers,
    stored: speakers.every((s) => Number(s.profiled_chars) === chars)
  };
}

function turnStamp(seconds) {
  const n = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = String(n % 60).padStart(2, '0');
  return h ? h + ':' + String(m).padStart(2, '0') + ':' + s : m + ':' + s;
}

function diarizedTranscript(data) {
  const roots = [data, data && data.data, data && data.result].filter(Boolean);
  let pieces = [];
  for (const root of roots) {
    for (const key of ['segments', 'words', 'chunks', 'utterances', 'speakers']) {
      if (Array.isArray(root[key]) && root[key].length) {
        const labelled = root[key].filter((part) => part &&
          (part.speaker != null || part.speaker_id != null || part.speaker_label != null));
        if (labelled.length > pieces.length) pieces = labelled;
      }
    }
  }
  if (!pieces.length) return '';

  const labels = [];
  const turns = [];
  for (const part of pieces) {
    const label = String(part.speaker ?? part.speaker_id ?? part.speaker_label ?? '').trim();
    if (!label) continue;
    if (!labels.includes(label)) labels.push(label);
    if (labels.length > 2) return '';
    const speaker = labels.indexOf(label) + 1;
    const text = clean(part.text ?? part.word ?? part.transcript, 4000);
    if (!text) continue;
    const at = Number(part.start ?? part.start_time ?? part.timestamp?.[0] ?? 0) || 0;
    const active = turns[turns.length - 1];
    if (active && active.speaker === speaker) {
      const punctuation = /^[,.;:!?)]/.test(text) ? '' : ' ';
      active.text += punctuation + text;
    } else {
      turns.push({ speaker, at, text });
    }
  }
  if (labels.length !== 2 || turns.length < 2) return '';
  return turns.map((turn) => '[' + turnStamp(turn.at) + '] Speaker ' +
    turn.speaker + ' — ' + turn.text.trim()).join('\n\n');
}

function timedTranscriptPieces(data) {
  const roots = [data, data && data.data, data && data.result].filter(Boolean);
  const candidates = [];
  for (const root of roots) {
    for (const key of ['segments', 'utterances', 'chunks', 'words', 'speakers']) {
      if (!Array.isArray(root[key])) continue;
      const pieces = root[key].map((part, index) => {
        if (!part || typeof part !== 'object') return null;
        const stamp = part.timestamp;
        const start = Number(part.start ?? part.start_time ??
          (Array.isArray(stamp) ? stamp[0] : stamp));
        const end = Number(part.end ?? part.end_time ??
          (Array.isArray(stamp) ? stamp[1] : start));
        const text = clean(part.text ?? part.word ?? part.transcript, 4000);
        if (!text || !Number.isFinite(start)) return null;
        return {
          index,
          start: Math.max(0, start),
          end: Number.isFinite(end) ? Math.max(start, end) : Math.max(0, start),
          text
        };
      }).filter(Boolean);
      if (pieces.length) candidates.push(pieces);
    }
  }
  /* Prefer sentence/segment timing to word timing: it carries useful pauses
     with a much smaller classification surface. */
  return candidates.sort((a, b) => {
    const aWords = a.reduce((n, p) => n + wordsOf(p.text).length, 0);
    const bWords = b.reduce((n, p) => n + wordsOf(p.text).length, 0);
    return bWords - aWords || a.length - b.length;
  })[0] || [];
}

function labelledTranscript(pieces, labels) {
  const turns = [];
  pieces.forEach((piece, index) => {
    const speaker = Number(labels[index]) === 2 ? 2 : 1;
    const active = turns[turns.length - 1];
    if (active && active.speaker === speaker) {
      active.text += (/^[,.;:!?)]/.test(piece.text) ? '' : ' ') + piece.text;
    } else {
      turns.push({ speaker, at: piece.start, text: piece.text });
    }
  });
  const enough = [1, 2].every((speaker) => wordsOf(turns
    .filter((turn) => turn.speaker === speaker)
    .map((turn) => turn.text).join(' ')).length >= 8);
  if (!enough || turns.length < 2) return '';
  return turns.map((turn) => '[' + turnStamp(turn.at) + '] Speaker ' +
    turn.speaker + ' — ' + turn.text.trim()).join('\n\n');
}

/* This is the same deliberately modest fallback used by the publishing UI:
   a silence longer than 2.5 seconds is treated as a possible hand-over. It is
   dialogue-turn inference, not biometric speaker recognition, and its stored
   status says so. */
function pauseInferredTranscript(pieces) {
  if (pieces.length < 2) return '';
  const labels = [];
  let speaker = 1;
  pieces.forEach((piece, index) => {
    if (index) {
      const gap = piece.start - pieces[index - 1].end;
      if (gap > 2.5) speaker = speaker === 1 ? 2 : 1;
    }
    labels.push(speaker);
  });
  return labels.includes(2) ? labelledTranscript(pieces, labels) : '';
}

function jsonObject(raw) {
  const text = String(raw || '').replace(/```json|```/gi, '').trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first < 0 || last <= first) return null;
  try { return JSON.parse(text.slice(first, last + 1)); } catch { return null; }
}

/* If timestamped Whisper segments contain no sufficiently long silence, ask a
   text model only where likely dialogue hand-overs occur. It returns labels
   for immutable STT fragments; it never rewrites the transcript and never
   claims to recognise either person's voice. Batching keeps a long episode
   within the model window, with labelled overlap preserving continuity. */
async function dialogueInferredTranscript(pieces) {
  if (pieces.length < 2) return '';
  const labels = [];
  let cursor = 0;
  while (cursor < pieces.length) {
    const batch = [];
    let chars = 0;
    while (cursor + batch.length < pieces.length && batch.length < 100) {
      const piece = pieces[cursor + batch.length];
      const cost = piece.text.length + 80;
      if (batch.length && chars + cost > 22000) break;
      batch.push(piece);
      chars += cost;
    }
    if (!batch.length) return '';

    const context = pieces.slice(Math.max(0, cursor - 3), cursor).map((piece, offset) => ({
      speaker: labels[cursor - Math.min(3, cursor) + offset],
      at: turnStamp(piece.start),
      text: piece.text
    }));
    const current = batch.map((piece, offset) => ({
      index: cursor + offset,
      at: turnStamp(piece.start),
      gap_before: offset || cursor
        ? Math.max(0, Math.round((piece.start - pieces[cursor + offset - 1].end) * 100) / 100)
        : 0,
      text: piece.text
    }));
    const heard = await freeChat({
      system: `You mark likely turn boundaries in a transcript between exactly two already-declared
participants. This is linguistic dialogue-structure inference, not voice recognition. Do not identify
people and do not rewrite, quote, summarise, correct or add any words. Assign each CURRENT fragment
speaker 1 or 2 using questions and answers, direct address, continuation and the measured pauses.
Consecutive fragments may have the same speaker. Speaker 1 is the first audible participant, so the
first fragment of the entire recording is 1. Preserve the numbering in PREVIOUS LABELLED CONTEXT.
Return JSON only in exactly this shape: {"labels":[1,2]}. The labels array must contain exactly one
integer for every CURRENT fragment, in order.`,
      messages: [{
        role: 'user',
        content: 'PREVIOUS LABELLED CONTEXT\n' + JSON.stringify(context) +
          '\nCURRENT\n' + JSON.stringify(current)
      }],
      maxTokens: Math.max(300, Math.min(1400, batch.length * 5 + 100)),
      temperature: 0.1
    }).catch(() => null);
    const parsed = heard && jsonObject(heard.text);
    if (!parsed || !Array.isArray(parsed.labels) || parsed.labels.length !== batch.length ||
        parsed.labels.some((label) => Number(label) !== 1 && Number(label) !== 2)) return '';
    labels.push(...parsed.labels.map(Number));
    cursor += batch.length;
  }

  /* Speaker numbering is by first appearance, regardless of an accidental
     inversion in a model response. */
  if (labels[0] === 2) {
    for (let index = 0; index < labels.length; index += 1) labels[index] = labels[index] === 1 ? 2 : 1;
  }
  return labels.includes(2) ? labelledTranscript(pieces, labels) : '';
}

async function recoverNamedTranscript(row, allowInference) {
  const url = await sign(row.storage_key);
  if (!url) return { transcript: '', status: 'no-signed-audio' };
  const doors = freeDoors();
  for (const door of doors) {
    const response = await fetch('https://api.free.ai/v1/stt/transcribe/', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + door.key,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        url,
        model: 'whisper',
        language: 'en',
        /* Providers use both naming conventions in the wild. The first call
           showed this route accepts unknown options, so send its likely native
           pair as well as the compatible aliases. */
        enable_diarization: true,
        num_speakers: 2,
        diarize: true,
        speaker_diarization: true,
        word_timestamps: true,
        timestamps: true
      })
    }).catch(() => null);
    if (!response) continue;
    const raw = await response.text().catch(() => '');
    if (!response.ok) {
      if ([400, 404, 422].includes(response.status)) {
        return { transcript: '', status: 'provider-rejected-diarization-' + response.status };
      }
      continue;
    }
    let data = null;
    try { data = JSON.parse(raw); } catch { data = null; }
    const transcript = diarizedTranscript(data);
    if (transcript) {
      return { transcript, status: 'stored-diarized', provider: 'free.ai/' + door.label };
    }
    const keys = data && typeof data === 'object' ? Object.keys(data).slice(0, 12) : [];
    if (allowInference) {
      const pieces = timedTranscriptPieces(data);
      const paused = pauseInferredTranscript(pieces);
      if (paused) {
        return { transcript: paused, status: 'stored-pause-inferred',
          provider: 'free.ai/' + door.label };
      }
      const dialogued = await dialogueInferredTranscript(pieces);
      if (dialogued) {
        return { transcript: dialogued, status: 'stored-dialogue-inferred',
          provider: 'free.ai/' + door.label };
      }
      return { transcript: '', status: pieces.length
        ? 'speaker-inference-inconclusive' : 'provider-returned-no-timestamps', shape: keys };
    }
    return {
      transcript: '',
      status: 'provider-returned-no-speakers',
      shape: keys
    };
  }
  return { transcript: '', status: 'no-provider-door-answered' };
}

/* An episode number nobody has to think about: the highest on the shelf or
   in the committed run, plus one. */
async function nextNumber(after) {
  let top = Number(after) || 0;
  try {
    const { rows } = await db.query("SELECT number FROM media WHERE kind = 'audio' AND number <> ''");
    for (const r of rows || []) {
      const n = parseInt(String(r.number).replace(/\D/g, ''), 10);
      if (Number.isFinite(n) && n > top) top = n;
    }
  } catch { /* an empty shelf is a fine answer */ }
  return String(top + 1).padStart(3, '0');
}

async function sign(key) {
  if (!key) return null;
  try { return await storage.url(key, { ttl: TTL }); } catch { return null; }
}

async function dress(row) {
  const url = await sign(row.storage_key);
  const cover = await sign(row.cover_key);
  const speakerState = row.transcript
    ? await ensureSpeakerPatterns(Number(row.id), row.transcript).catch(() => ({ speakers: [], stored: false }))
    : { speakers: await speakersFor(Number(row.id)), stored: false };
  let images = [];
  try {
    const { rows } = await db.query(
      'SELECT id, at_seconds, storage_key, caption FROM media_images WHERE media_id = $1 ORDER BY at_seconds ASC',
      [row.id]);
    for (const i of rows || []) {
      images.push({
        id: Number(i.id),
        at: Number(i.at_seconds) || 0,
        caption: i.caption || '',
        url: await sign(i.storage_key)
      });
    }
  } catch { images = []; }
  return {
    cover,
    images,
    id: Number(row.id),
    kind: row.kind,
    title: row.title,
    summary: row.summary || '',
    number: row.number || '',
    length: row.length_text || '',
    seconds: row.seconds || null,
    tags: (row.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    links: safeList(row.links),
    topics: safeList(row.topics),
    transcript_len: row.transcript ? String(row.transcript).length : 0,
    speakers: (speakerState.speakers || []).map((s) => ({
      number: Number(s.speaker_no), name: s.name
    })),
    speaker_patterns_stored: !!speakerState.stored,
    treatment: row.treatment || '',
    bytes: Number(row.bytes) || null,
    original_bytes: Number(row.original_bytes) || null,
    mime: row.mime || '',
    state: row.state,
    pinned: Number(row.pinned) || 0,
    date: dateOnly(row.purported_date) || dateOnly(row.created_at),
    purported_date: dateOnly(row.purported_date),
    actual_created_at: row.created_at || null,
    mime: row.mime || '',
    has_transcript: !!(row.transcript && String(row.transcript).trim()),
    url
  };
}

export default async function (req, res) {
  const body = req.body || {};
  const action = clean(body.action || 'list', 24);

  /* The one action anybody may call: what is published. */
  if (action === 'list') {
    const kind = clean(body.kind, 8) === 'video' ? 'video' : 'audio';
    try {
      const { rows } = await db.query(
        `SELECT * FROM media WHERE kind = $1 AND state = 'published'
          ORDER BY COALESCE(purported_date, created_at::date) DESC, created_at DESC LIMIT 200`, [kind]);
      const items = [];
      for (const r of rows || []) items.push(await dress(r));
      return res.json({ ok: true, items });
    } catch (err) {
      console.error('media: the shelf could not be read', err && err.message);
      return res.json({ ok: true, items: [] });
    }
  }

  /* The words of a published episode, for the transcript button. Public,
     like the list: what is published is published. */
  if (action === 'transcript') {
    const id = Number(body.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Which episode?' });
    try {
      const { rows } = await db.query(
        'SELECT id, title, state, transcript FROM media WHERE id = $1', [id]);
      if (!rows || !rows.length) return res.status(404).json({ error: 'No episode by that number.' });
      if (rows[0].state !== 'published') return res.status(404).json({ error: 'That episode is not on the shelf.' });
      const profile = await ensureSpeakerPatterns(id, rows[0].transcript || '');
      return res.json({
        ok: true,
        title: rows[0].title,
        transcript: displayTranscript(rows[0].transcript || '', profile.speakers),
        speakers: profile.speakers.map((s) => ({ number: Number(s.speaker_no), name: s.name })),
        speaker_patterns_stored: profile.stored
      });
    } catch (err) {
      console.error('media: the transcript could not be read', err && err.message);
      return res.status(500).json({ error: 'The shelf could not be read.' });
    }
  }

  /* One narrow recovery for the already identified latest podcast. It is
     public only as an idempotent trigger: it cannot accept audio, choose an
     episode, or run more than once. The database mapping must already name
     speaker 1 and 2 exactly, and the episode must still lack a transcript. */
  if (action === 'bootstrap-speakers') {
    try {
      const { rows } = await db.query(
        `SELECT * FROM media
          WHERE kind = 'audio' AND state = 'published'
          ORDER BY created_at DESC, id DESC LIMIT 1`);
      const row = rows && rows[0];
      if (!row) return res.json({ ok: true, done: false, status: 'no-published-podcast' });
      /* Validate the declared identities before treating an existing transcript
         as recovered. Previously this early return reported success even when
         a newly published latest episode had no media_speakers rows, leaving
         the following live audit to fail with no useful recovery path. */
      const speakers = await speakersFor(Number(row.id));
      const expected = new Map(speakers.map((s) => [Number(s.speaker_no), s.name]));
      if (expected.get(1) !== 'Edward Gregory' || expected.get(2) !== 'Jim Rankin') {
        return res.status(409).json({ error: 'The guarded speaker map is not present.' });
      }
      if (row.transcript && String(row.transcript).trim()) {
        const profile = await ensureSpeakerPatterns(Number(row.id), row.transcript, speakers);
        return res.json({ ok: true, done: true, status: 'already-transcribed',
          speakers: profile.speakers.map((speaker) => ({
            number: Number(speaker.speaker_no), name: speaker.name
          })),
          speaker_patterns_stored: profile.stored });
      }
      /* The original one-shot completed after the provider accepted options
         but returned no labels. Permit one, and only one, bounded retry for
         that exact outcome so native option names and the timestamped response
         can use the transparent
         pause/dialogue inference fallback. All other completed outcomes stay
         final, and neither route accepts caller-selected media. */
      const fallback = !!row.speaker_bootstrap_at &&
        row.speaker_bootstrap_status === 'provider-returned-no-speakers';
      if (row.speaker_bootstrap_at && !fallback) {
        return res.json({ ok: true, done: false,
          status: row.speaker_bootstrap_status || 'already-attempted' });
      }
      const claimSql = fallback
        ? `UPDATE media SET speaker_bootstrap_fallback_at = NOW(),
             speaker_bootstrap_status = 'fallback-running'
            WHERE id = $1 AND speaker_bootstrap_fallback_at IS NULL RETURNING id`
        : `UPDATE media SET speaker_bootstrap_at = NOW(), speaker_bootstrap_status = 'running'
            WHERE id = $1 AND speaker_bootstrap_at IS NULL RETURNING id`;
      const { rows: claimed } = await db.query(claimSql, [row.id]);
      if (!claimed || !claimed.length) {
        return res.json({ ok: true, done: false,
          status: fallback ? 'fallback-already-attempted' : 'already-running' });
      }

      const heard = await recoverNamedTranscript(row, true);
      if (!heard.transcript) {
        await db.query('UPDATE media SET speaker_bootstrap_status = $2 WHERE id = $1',
          [row.id, heard.status]);
        return res.json({ ok: true, done: false, status: heard.status,
          response_shape: heard.shape || [] });
      }
      await db.query(
        `UPDATE media SET transcript = $2, speaker_bootstrap_status = $3, updated_at = NOW()
          WHERE id = $1`, [row.id, heard.transcript, heard.status]);
      await db.query('UPDATE media_speakers SET profiled_chars = NULL WHERE media_id = $1', [row.id]);
      const profile = await ensureSpeakerPatterns(Number(row.id), heard.transcript, speakers);
      return res.json({ ok: true, done: true, status: heard.status,
        provider: heard.provider, turns: transcriptTurns(heard.transcript, speakers).length,
        speaker_patterns_stored: profile.stored });
    } catch (err) {
      console.error('media: guarded speaker recovery failed', err && err.message);
      return res.status(500).json({ error: 'The guarded speaker recovery failed.' });
    }
  }

  /* Everything else is behind the passcode. */
  const door = await adminDoor(req, body.pass);
  if (!door.ok) return res.status(door.status).json({ error: door.error });

  try {
    switch (action) {
      case 'shelf': {
        const kind = clean(body.kind, 8) === 'video' ? 'video' : 'audio';
        const { rows } = await db.query(
          `SELECT * FROM media WHERE kind = $1
            ORDER BY pinned DESC, COALESCE(purported_date, created_at::date) DESC,
                     created_at DESC LIMIT 200`, [kind]);
        const items = [];
        for (const r of rows || []) items.push(await dress(r));
        return res.json({ ok: true, items });
      }

      case 'begin': {
        const upload = clean(body.upload, 64);
        if (!upload) return res.status(400).json({ error: 'No upload name.' });
        await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]);
        /* Anything half-sent and then abandoned an hour ago is swept up, so
           a failed upload does not sit in the table for ever. */
        await db.query("DELETE FROM media_chunks WHERE at < NOW() - INTERVAL '2 hours'").catch(() => {});
        return res.json({ ok: true, upload, chunk_max: Math.floor(MAX_CHUNK) });
      }

      case 'chunk': {
        const upload = clean(body.upload, 64);
        const seq = Number(body.seq);
        const part = String(body.part || '');
        if (!upload || !Number.isInteger(seq) || seq < 0) {
          return res.status(400).json({ error: 'A piece with no place.' });
        }
        if (!part || part.length % 4 !== 0 || !B64.test(part)) {
          return res.status(400).json({ error: 'That upload piece is damaged.' });
        }
        if (part.length > MAX_CHUNK * 1.1) return res.status(413).json({ error: 'That piece is too large.' });
        await db.query(
          `INSERT INTO media_chunks (upload_id, seq, part) VALUES ($1, $2, $3)
           ON CONFLICT (upload_id, seq) DO UPDATE SET part = EXCLUDED.part`,
          [upload, seq, part]);
        return res.json({ ok: true, seq });
      }

      case 'finish': {
        const upload = clean(body.upload, 64);
        const kind = clean(body.kind, 8) === 'video' ? 'video' : 'audio';
        const title = clean(body.title, 200);
        if (!upload) return res.status(400).json({ error: 'No upload name.' });
        if (!title) return res.status(400).json({ error: 'It needs a title before it can be published.' });

        const whole = await assembleUpload(db, upload, {
          maxBytes: MAX_BYTES,
          emptyMessage: 'Nothing arrived. Try the upload again.',
          tooLargeMessage: 'That file is larger than the ' +
            Math.round(MAX_BYTES / 1048576) + ' MB the shelf will take.'
        });

        const mime = clean(body.mime, 80) || (kind === 'video' ? 'video/webm' : 'audio/mpeg');
        const ext = mime.includes('mpeg') ? 'mp3'
          : mime.includes('wav') ? 'wav'
            : mime.includes('ogg') ? 'ogg'
              : mime.includes('mp4') ? 'mp4'
                : mime.includes('m4a') ? 'm4a'
                  : mime.includes('aac') ? 'aac'
                    : mime.includes('flac') ? 'flac'
                      : mime.includes('wma') ? 'wma'
                        : mime.includes('webm') ? 'webm' : 'bin';
        const key = (kind === 'video' ? 'films/' : 'episodes/') +
          Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext;

        await storage.put(key, whole, mime);
        await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]);

        /* No number typed? Take the next one in the run. */
        const number = kind === 'audio'
          ? (clean(body.number, 12) || await nextNumber(body.after))
          : clean(body.number, 12);

        const { rows: made } = await db.query(
          `INSERT INTO media (kind, title, summary, number, length_text, seconds, tags,
                              storage_key, mime, bytes, original_bytes, treatment, state, who,
                              transcript, links, topics, purported_date)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
          [kind, title, clean(body.summary, 2000), number,
            clean(body.length, 32), Number(body.seconds) || null, clean(body.tags, 300),
            key, mime, whole.length, Number(body.original_bytes) || null,
            clean(body.treatment, 600), body.publish === false ? 'draft' : 'published', door.who,
            body.transcript ? String(body.transcript).slice(0, 400000) : null,
            Array.isArray(body.links) ? JSON.stringify(body.links.slice(0, 10)) : null,
            Array.isArray(body.topics) ? JSON.stringify(body.topics.slice(0, 20)) : null,
            cleanDate(body.date) || null]);

        if (Array.isArray(body.speakers)) {
          for (const speaker of body.speakers.slice(0, 12)) {
            const no = Number(speaker && speaker.number);
            const name = clean(speaker && speaker.name, 80);
            if (!Number.isInteger(no) || no < 1 || no > 19 || !name || /^speaker\s+\d+$/i.test(name)) continue;
            await db.query(
              `INSERT INTO media_speakers (media_id, speaker_no, name, profiled_chars, updated_at)
               VALUES ($1,$2,$3,NULL,NOW())
               ON CONFLICT (media_id, speaker_no) DO UPDATE SET name = EXCLUDED.name,
                 profiled_chars = NULL, updated_at = NOW()`,
              [made[0].id, no, name]);
          }
        }

        return res.json({ ok: true, item: await dress(made[0]) });
      }

      case 'publish':
      case 'unpublish': {
        const id = Number(body.id);
        if (!id) return res.status(400).json({ error: 'Which one?' });
        await db.query('UPDATE media SET state = $1, updated_at = NOW() WHERE id = $2',
          [action === 'publish' ? 'published' : 'draft', id]);
        return res.json({ ok: true });
      }

      /* Archive steps an episode off the public shelf and out of the feed
         without destroying anything — the file, the transcript and the
         notes all stay in the vault until the delete button is pressed.
         Restore brings it back as a draft, ready to be published again. */
      case 'archive':
      case 'restore': {
        const id = Number(body.id);
        if (!id) return res.status(400).json({ error: 'Which one?' });
        await db.query('UPDATE media SET state = $1, updated_at = NOW() WHERE id = $2',
          [action === 'archive' ? 'archived' : 'draft', id]);
        return res.json({ ok: true });
      }

      /* Up to three held at the top of the page. A fourth pin pushes the
         oldest pin off rather than refusing \u2014 the limit is the point of
         the feature, and an error message would just be in the way. */
      case 'pin':
      case 'unpin': {
        const id = Number(body.id);
        if (!id) return res.status(400).json({ error: 'Which one?' });
        const { rows: found } = await db.query('SELECT kind FROM media WHERE id = $1', [id]);
        if (!found || !found[0]) return res.status(404).json({ error: 'There is no such item.' });
        const kind = found[0].kind;

        if (action === 'unpin') {
          await db.query('UPDATE media SET pinned = 0, updated_at = NOW() WHERE id = $1', [id]);
        } else {
          const { rows: pins } = await db.query(
            'SELECT id FROM media WHERE kind = $1 AND pinned > 0 AND id <> $2 ORDER BY pinned DESC',
            [kind, id]);
          const keep = (pins || []).slice(0, 2).map((r) => Number(r.id));
          const drop = (pins || []).slice(2).map((r) => Number(r.id));
          for (const old of drop) {
            await db.query('UPDATE media SET pinned = 0 WHERE id = $1', [old]);
          }
          /* Newest pin on top, the two it keeps below it. */
          await db.query('UPDATE media SET pinned = 3, updated_at = NOW() WHERE id = $1', [id]);
          if (keep[0]) await db.query('UPDATE media SET pinned = 2 WHERE id = $1', [keep[0]]);
          if (keep[1]) await db.query('UPDATE media SET pinned = 1 WHERE id = $1', [keep[1]]);
        }
        const { rows } = await db.query(
          `SELECT * FROM media WHERE kind = $1
            ORDER BY pinned DESC, COALESCE(purported_date, created_at::date) DESC,
                     created_at DESC LIMIT 200`, [kind]);
        const items = [];
        for (const r of rows || []) items.push(await dress(r));
        return res.json({ ok: true, items });
      }

      case 'next-number':
        return res.json({ ok: true, number: await nextNumber(body.after) });

      case 'name-speakers': {
        const id = Number(body.id);
        if (!id || !Array.isArray(body.speakers)) {
          return res.status(400).json({ error: 'Which episode, and which voices?' });
        }
        const { rows } = await db.query('SELECT transcript FROM media WHERE id = $1', [id]);
        if (!rows || !rows[0]) return res.status(404).json({ error: 'There is no such episode.' });
        for (const speaker of body.speakers.slice(0, 12)) {
          const no = Number(speaker && speaker.number);
          const name = clean(speaker && speaker.name, 80);
          if (!Number.isInteger(no) || no < 1 || no > 19 || !name) continue;
          await db.query(
            `INSERT INTO media_speakers (media_id, speaker_no, name, profiled_chars, updated_at)
             VALUES ($1,$2,$3,NULL,NOW())
             ON CONFLICT (media_id, speaker_no) DO UPDATE SET name = EXCLUDED.name,
               profiled_chars = NULL, updated_at = NOW()`,
            [id, no, name]);
        }
        const profile = await ensureSpeakerPatterns(id, rows[0].transcript || '');
        return res.json({
          ok: true,
          transcript: displayTranscript(rows[0].transcript || '', profile.speakers),
          speakers: profile.speakers.map((s) => ({ number: Number(s.speaker_no), name: s.name })),
          speaker_patterns_stored: profile.stored
        });
      }

      /* Browser-encrypted biometric templates for explicitly consenting
         speakers. Ed and Jim are priority comparison targets, followed by any
         further enrollment. The API cannot decrypt templates and never
         receives raw audio or a plaintext embedding. They label podcasts only;
         adminDoor remains the sole authentication mechanism. */
      case 'voiceprints': {
        const { rows } = await db.query(
          `SELECT name, ciphertext, salt, iv, kdf, kdf_iterations, cipher,
                  feature_version, sample_seconds, sample_frames,
                  source_media_id, consented_at, consented_by, updated_at
             FROM speaker_voiceprints
            ORDER BY CASE name WHEN 'Edward Gregory' THEN 0 WHEN 'Jim Rankin' THEN 1 ELSE 2 END,
                     name`);
        return res.json({
          ok: true,
          purpose: 'podcast speaker labelling only; never authentication',
          voiceprints: (rows || []).map((row) => ({
            name: row.name,
            ciphertext: row.ciphertext,
            salt: row.salt,
            iv: row.iv,
            kdf: row.kdf,
            iterations: Number(row.kdf_iterations),
            cipher: row.cipher,
            feature_version: row.feature_version,
            sample_seconds: Number(row.sample_seconds) || 0,
            sample_frames: Number(row.sample_frames) || 0,
            source_media_id: Number(row.source_media_id) || null,
            consented_at: row.consented_at,
            consented_by: row.consented_by,
            updated_at: row.updated_at
          }))
        });
      }

      case 'enrol-voiceprint': {
        let name = voiceprintName(body.name);
        if (!name) return res.status(400).json({ error: 'Enter the consenting speaker’s real name, not a generic speaker number.' });
        const { rows: sameName } = await db.query(
          'SELECT name FROM speaker_voiceprints WHERE LOWER(name) = LOWER($1) LIMIT 1', [name]);
        if (sameName && sameName[0] && sameName[0].name !== name) {
          return res.status(409).json({
            error: 'That voiceprint already exists as “' + sameName[0].name + '”; use the same spelling and capitals.'
          });
        }
        if (body.consent !== true) {
          return res.status(400).json({ error: 'Explicit speaker consent must be confirmed for this enrollment.' });
        }
        const ciphertext = sealedPart(body.ciphertext, 20000);
        const salt = sealedPart(body.salt, 128);
        const iv = sealedPart(body.iv, 128);
        const kdf = clean(body.kdf, 40);
        const cipher = clean(body.cipher, 40);
        const version = clean(body.feature_version, 60);
        const iterations = Number(body.iterations);
        const seconds = Number(body.sample_seconds);
        const frames = Number(body.sample_frames);
        if (!ciphertext || sealedBytes(ciphertext) < 32 || !salt || sealedBytes(salt) !== 16 ||
            !iv || sealedBytes(iv) !== 12 || kdf !== 'PBKDF2-SHA-256' ||
            cipher !== 'AES-256-GCM' || version !== 'eg-vp-mfsc-1' ||
            iterations !== 210000 || !Number.isFinite(seconds) || seconds <= 0 || seconds > 180 ||
            !Number.isInteger(frames) || frames < 80 || frames > 10000) {
          return res.status(400).json({ error: 'The encrypted voiceprint envelope is not valid.' });
        }
        const sourceId = Number(body.source_media_id) || null;
        if (sourceId) {
          const { rows: source } = await db.query(
            `SELECT 1 FROM media_speakers
              WHERE media_id = $1 AND name = $2 LIMIT 1`, [sourceId, name]);
          if (!source || !source.length) {
            return res.status(409).json({ error: 'That recording is not mapped to the consenting speaker.' });
          }
        }
        await db.query(
          `INSERT INTO speaker_voiceprints
             (name, ciphertext, salt, iv, kdf, kdf_iterations, cipher,
              feature_version, sample_seconds, sample_frames, source_media_id,
              consented_at, consented_by, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),$12,NOW())
           ON CONFLICT (name) DO UPDATE SET
             ciphertext = EXCLUDED.ciphertext, salt = EXCLUDED.salt,
             iv = EXCLUDED.iv, kdf = EXCLUDED.kdf,
             kdf_iterations = EXCLUDED.kdf_iterations, cipher = EXCLUDED.cipher,
             feature_version = EXCLUDED.feature_version,
             sample_seconds = EXCLUDED.sample_seconds,
             sample_frames = EXCLUDED.sample_frames,
             source_media_id = EXCLUDED.source_media_id,
             consented_at = NOW(), consented_by = EXCLUDED.consented_by,
             updated_at = NOW()`,
          [name, ciphertext, salt, iv, kdf, iterations, cipher, version,
            Math.round(seconds * 100) / 100, frames, sourceId,
            clean(door.who, 120) || 'admin']);
        await db.query(
          `INSERT INTO voiceprint_audit (name, action, media_id, who, detail)
           VALUES ($1,'enrolled',$2,$3,$4)`,
          [name, sourceId, clean(door.who, 120) || 'admin',
            JSON.stringify({ feature_version: version,
              sample_seconds: Math.round(seconds * 100) / 100 })]);
        return res.json({ ok: true, name, enrolled: true,
          purpose: 'podcast speaker labelling only' });
      }

      case 'delete-voiceprint': {
        const name = voiceprintName(body.name);
        if (!name) return res.status(400).json({ error: 'Which consenting voiceprint?' });
        const { rows } = await db.query(
          'DELETE FROM speaker_voiceprints WHERE name = $1 RETURNING source_media_id', [name]);
        await db.query(
          `INSERT INTO voiceprint_audit (name, action, media_id, who, detail)
           VALUES ($1,'deleted',$2,$3,$4)`,
          [name, rows && rows[0] && rows[0].source_media_id || null,
            clean(door.who, 120) || 'admin',
            JSON.stringify({ ciphertext_erased: !!(rows && rows.length) })]);
        return res.json({ ok: true, name, deleted: !!(rows && rows.length) });
      }

      case 'voiceprint-labels': {
        const id = Number(body.id);
        const labels = Array.isArray(body.labels) ? body.labels.slice(0, 12) : [];
        if (!id || !labels.length || clean(body.feature_version, 60) !== 'eg-vp-mfsc-1') {
          return res.status(400).json({ error: 'At least one unambiguous local biometric match is required.' });
        }
        const numbers = new Set();
        const names = new Set();
        for (const label of labels) {
          const no = Number(label && label.number);
          const name = voiceprintName(label && label.name);
          const score = Number(label && label.score);
          const margin = Number(label && label.margin);
          if (!Number.isInteger(no) || no < 1 || no > 19 || !name ||
              !Number.isFinite(score) || score < 0.7 || score > 1 ||
              !Number.isFinite(margin) || margin < 0.04 || margin > 1) {
            return res.status(400).json({ error: 'A biometric match was missing, ambiguous, or below the labelling threshold.' });
          }
          numbers.add(no); names.add(name.toLowerCase());
        }
        if (numbers.size !== labels.length || names.size !== labels.length) {
          return res.status(400).json({ error: 'Each enrolled person may map to only one distinct transcript voice.' });
        }
        const { rows: enrolled } = await db.query('SELECT name FROM speaker_voiceprints');
        const enrolledNames = new Set((enrolled || []).map((row) => String(row.name).toLowerCase()));
        if (labels.some((label) => !enrolledNames.has(voiceprintName(label.name).toLowerCase()))) {
          return res.status(409).json({ error: 'Every applied name must have an active, consented voiceprint.' });
        }
        const { rows: mediaRows } = await db.query(
          'SELECT transcript FROM media WHERE id = $1', [id]);
        if (!mediaRows || !mediaRows[0] || !String(mediaRows[0].transcript || '').trim()) {
          return res.status(404).json({ error: 'That recording has no transcript turns to label.' });
        }
        const currentSpeakers = await speakersFor(id);
        const currentNames = new Map(currentSpeakers.map((speaker) =>
          [Number(speaker.speaker_no), speaker.name]));
        for (const label of labels) {
          const number = Number(label.number);
          const name = voiceprintName(label.name);
          if (currentNames.get(number) === name) continue;
          await db.query(
            `INSERT INTO media_speakers (media_id, speaker_no, name, profiled_chars, updated_at)
             VALUES ($1,$2,$3,NULL,NOW())
             ON CONFLICT (media_id, speaker_no) DO UPDATE SET
               name = EXCLUDED.name, profiled_chars = NULL, updated_at = NOW()`,
            [id, number, name]);
          await db.query(
            `INSERT INTO voiceprint_audit (name, action, media_id, who, detail)
             VALUES ($1,'label-applied',$2,$3,$4)`,
            [name, id, clean(door.who, 120) || 'admin',
              JSON.stringify({ speaker_no: number,
                feature_version: 'eg-vp-mfsc-1' })]);
        }
        const profile = await ensureSpeakerPatterns(id, mediaRows[0].transcript);
        return res.json({
          ok: true,
          speakers: profile.speakers.map((speaker) => ({
            number: Number(speaker.speaker_no), name: speaker.name
          })),
          transcript: displayTranscript(mediaRows[0].transcript, profile.speakers),
          speaker_patterns_stored: profile.stored,
          purpose: 'podcast speaker labelling only'
        });
      }

      case 'speaker-profiles': {
        const { rows } = await db.query(
          'SELECT name, patterns, sample_words, source_media_id, updated_at FROM speaker_profiles ORDER BY name');
        return res.json({
          ok: true,
          profiles: (rows || []).map((r) => ({
            name: r.name,
            patterns: (() => { try { return JSON.parse(r.patterns || '{}'); } catch { return {}; } })(),
            sample_words: Number(r.sample_words) || 0,
            source_media_id: Number(r.source_media_id) || null,
            updated_at: r.updated_at
          }))
        });
      }

      case 'edit': {
        const id = Number(body.id);
        if (!id) return res.status(400).json({ error: 'Which one?' });
        const hasDate = Object.prototype.hasOwnProperty.call(body, 'date');
        const claimedDate = cleanDate(body.date);
        if (hasDate && clean(body.date, 20) && !claimedDate) {
          return res.status(400).json({ error: 'Use a real creation date in YYYY-MM-DD form.' });
        }
        let previousDate = null;
        if (hasDate) {
          const { rows: beforeDate } = await db.query(
            'SELECT purported_date FROM media WHERE id = $1', [id]);
          previousDate = beforeDate && beforeDate[0]
            ? dateOnly(beforeDate[0].purported_date) || null : null;
        }
        if (Array.isArray(body.links)) {
          await db.query('UPDATE media SET links = $2 WHERE id = $1',
            [id, JSON.stringify(body.links.slice(0, 10))]);
        }
        if (Array.isArray(body.topics)) {
          await db.query('UPDATE media SET topics = $2 WHERE id = $1',
            [id, JSON.stringify(body.topics.slice(0, 20))]);
        }
        if (body.transcript) {
          await db.query('UPDATE media SET transcript = $2 WHERE id = $1',
            [id, String(body.transcript).slice(0, 400000)]);
          await db.query('UPDATE media_speakers SET profiled_chars = NULL WHERE media_id = $1', [id])
            .catch(() => {});
        }
        await db.query(
          `UPDATE media SET title = COALESCE($2, title), summary = COALESCE($3, summary),
                            number = COALESCE($4, number), length_text = COALESCE($5, length_text),
                            tags = COALESCE($6, tags),
                            purported_date = CASE WHEN $7 THEN $8::date ELSE purported_date END,
                            updated_at = NOW()
            WHERE id = $1`,
          [id, body.title == null ? null : clean(body.title, 200),
            body.summary == null ? null : clean(body.summary, 2000),
            body.number == null ? null : clean(body.number, 12),
            body.length == null ? null : clean(body.length, 32),
            body.tags == null ? null : clean(body.tags, 300),
            hasDate, claimedDate || null]);
        if (hasDate) {
          await db.query(
            `INSERT INTO creation_date_log
               (scope, object_key, previous_date, purported_date, who)
             VALUES ('media',$1,$2,$3,$4)`,
            [String(id), previousDate, claimedDate || null, clean(door.who, 120) || 'admin']);
        }
        return res.json({ ok: true, date: claimedDate || '' });
      }

      case 'delete': {
        const id = Number(body.id);
        if (!id) return res.status(400).json({ error: 'Which one?' });
        const { rows } = await db.query('SELECT storage_key FROM media WHERE id = $1', [id]);
        const k = rows && rows[0] && rows[0].storage_key;
        if (k && storage.delete) await storage.delete(k).catch(() => {});
        await db.query('DELETE FROM media WHERE id = $1', [id]);
        return res.json({ ok: true });
      }

      /* A new master for an item that already exists \u2014 what a cut or a
         merge produces when it is saved over the original rather than
         published beside it. */
      case 'replace': {
        const id = Number(body.id);
        const upload = clean(body.upload, 64);
        if (!id || !upload) return res.status(400).json({ error: 'Which one, and from what?' });

        const { rows } = await db.query('SELECT storage_key, kind FROM media WHERE id = $1', [id]);
        const was = rows && rows[0];
        if (!was) return res.status(404).json({ error: 'There is no such item.' });

        const whole = await assembleUpload(db, upload, {
          maxBytes: MAX_BYTES,
          emptyMessage: 'Nothing arrived.',
          tooLargeMessage: 'That is too large for the shelf.'
        });

        const mime = clean(body.mime, 80) || (was.kind === 'video' ? 'video/webm' : 'audio/mpeg');
        const ext = mime.includes('mpeg') ? 'mp3' : mime.includes('wav') ? 'wav'
          : mime.includes('webm') ? 'webm' : mime.includes('mp4') ? 'mp4' : 'bin';
        const key = (was.kind === 'video' ? 'films/' : 'episodes/') +
          Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext;

        await storage.put(key, whole, mime);
        await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]);
        await db.query(
          `UPDATE media SET storage_key = $2, mime = $3, bytes = $4, seconds = COALESCE($5, seconds),
                            length_text = COALESCE($6, length_text),
                            treatment = COALESCE($7, treatment), updated_at = NOW()
            WHERE id = $1`,
          [id, key, mime, whole.length, Number(body.seconds) || null,
            clean(body.length, 32) || null, clean(body.treatment, 600) || null]);
        if (was.storage_key && storage.delete) await storage.delete(was.storage_key).catch(() => {});

        const { rows: now } = await db.query('SELECT * FROM media WHERE id = $1', [id]);
        return res.json({ ok: true, item: await dress(now[0]) });
      }

      /* A picture: either the item's cover, or a plate cued to a moment in
         it, which the player raises as the recording reaches it. */
      case 'attach': {
        const id = Number(body.id);
        const upload = clean(body.upload, 64);
        if (!id || !upload) return res.status(400).json({ error: 'Which one, and from what?' });
        const role = clean(body.role, 8) === 'cover' ? 'cover' : 'cue';

        const whole = await assembleUpload(db, upload, {
          maxBytes: 12 * 1024 * 1024,
          emptyMessage: 'No picture arrived.',
          tooLargeMessage: 'That picture is over 12 MB.'
        });

        const mime = clean(body.mime, 60) || 'image/jpeg';
        const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp'
          : mime.includes('gif') ? 'gif' : 'jpg';
        const key = 'media-art/' + Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext;
        await storage.put(key, whole, mime);
        await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]);

        if (role === 'cover') {
          const { rows: old } = await db.query('SELECT cover_key FROM media WHERE id = $1', [id]);
          await db.query('UPDATE media SET cover_key = $2, updated_at = NOW() WHERE id = $1', [id, key]);
          const prev = old && old[0] && old[0].cover_key;
          if (prev && storage.delete) await storage.delete(prev).catch(() => {});
        } else {
          await db.query(
            'INSERT INTO media_images (media_id, at_seconds, storage_key, mime, caption) VALUES ($1,$2,$3,$4,$5)',
            [id, Math.max(0, Number(body.at) || 0), key, mime, clean(body.caption, 300)]);
        }

        const { rows: now } = await db.query('SELECT * FROM media WHERE id = $1', [id]);
        return res.json({ ok: true, item: await dress(now[0]) });
      }

      case 'drop-image': {
        const imageId = Number(body.image_id);
        if (!imageId) return res.status(400).json({ error: 'Which picture?' });
        const { rows } = await db.query('SELECT storage_key FROM media_images WHERE id = $1', [imageId]);
        const k = rows && rows[0] && rows[0].storage_key;
        await db.query('DELETE FROM media_images WHERE id = $1', [imageId]);
        if (k && storage.delete) await storage.delete(k).catch(() => {});
        return res.json({ ok: true });
      }

      case 'cue': {
        const imageId = Number(body.image_id);
        if (!imageId) return res.status(400).json({ error: 'Which picture?' });
        await db.query('UPDATE media_images SET at_seconds = $2, caption = COALESCE($3, caption) WHERE id = $1',
          [imageId, Math.max(0, Number(body.at) || 0), body.caption == null ? null : clean(body.caption, 300)]);
        return res.json({ ok: true });
      }

      case 'one': {
        const id = Number(body.id);
        const { rows } = await db.query('SELECT * FROM media WHERE id = $1', [id]);
        if (!rows || !rows[0]) return res.status(404).json({ error: 'There is no such item.' });
        return res.json({ ok: true, item: await dress(rows[0]) });
      }

      default:
        return res.status(400).json({ error: 'No such action.' });
    }
  } catch (err) {
    console.error('media:', err && err.message);
    const status = Number(err && err.status);
    if (err && err.expose && Number.isInteger(status) && status >= 400 && status <= 599) {
      return res.status(status).json({ error: err.message });
    }
    const detail = String((err && err.message) || 'unknown');
    const allocation = /array buffer allocation|allocation failed|invalid typed array length/i.test(detail);
    return res.status(allocation ? 507 : 500).json({
      error: allocation
        ? 'The upload arrived, but the shelf ran out of memory while assembling it. ' +
          'Please try publishing the enhanced MP3 again.'
        : 'The shelf refused that: ' + detail
    });
  }
}
