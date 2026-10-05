/**
 * POST /api/upload — hand a file to the oracle.
 *
 * The browser reads the file, base64-encodes it and posts it here. Text-like
 * files are decoded, cleaned and stored as plain text so the oracle can read,
 * quote and search them. Images are stored in object storage and kept as a
 * visual reference. Anything else is refused politely rather than mangled.
 *
 * Nothing is secret here: the file becomes part of the conversation, and the
 * oracle is told to treat an uploaded document as the asker's material, not
 * as the order's position.
 */
import { db, storage } from 'hatchable';

export const access = 'public';
export const methods = ['POST'];

const MAX_BYTES = 4 * 1024 * 1024;     // 4 MB per file
const MAX_CHARS = 200000;              // stored text ceiling

const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|jsonl|ya?ml|xml|html?|rtf|log|srt|vtt|tex|bib|ini|conf|toml|js|mjs|ts|py|rb|sql|r|m|c|h|cpp|java|sh)$/i;
const IMAGE_MIME = /^image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml)$/i;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function fromHtml(s) {
  return String(s)
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENTITIES ? ENTITIES[n.toLowerCase()] : m));
}

function clean(text) {
  return String(text)
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default async function (req, res) {
  const body = req.body || {};
  const name = String(body.name || 'untitled').trim().slice(0, 200);
  const mime = String(body.type || '').trim().slice(0, 120);
  const asker = String(body.asker || '').trim().slice(0, 80) || null;
  const b64 = String(body.data || '');

  if (!b64) return res.status(400).json({ error: 'No file content arrived.' });

  let bytes;
  try {
    bytes = Uint8Array.from(atob(b64.includes(',') ? b64.slice(b64.indexOf(',') + 1) : b64),
      (c) => c.charCodeAt(0));
  } catch {
    return res.status(400).json({ error: 'That file could not be decoded.' });
  }
  if (bytes.length > MAX_BYTES) {
    return res.status(413).json({ error: 'That file is larger than 4 MB. Trim it, or paste the part that matters.' });
  }

  const isImage = IMAGE_MIME.test(mime) || /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(name);
  const looksText = /^text\//i.test(mime) || /json|xml|yaml|csv|javascript|markdown/i.test(mime) || TEXT_EXT.test(name);
  const isPdf = /pdf/i.test(mime) || /\.pdf$/i.test(name);

  if (isPdf) {
    return res.status(415).json({
      error:
        'The oracle cannot read PDFs directly yet. Export it as plain text or Markdown and send that — ' +
        'or paste the passage you want examined straight into the question.'
    });
  }

  try {
    if (isImage) {
      const ext = (/\.([a-z0-9]+)$/i.exec(name) || [, 'png'])[1].toLowerCase();
      const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
      await storage.put(key, bytes, mime || 'image/png');
      const url = await storage.url(key, { ttl: 604800 });
      const { rows } = await db.query(
        `INSERT INTO uploads (name, mime, kind, bytes, chars, body, storage_key, asker_name)
         VALUES ($1, $2, 'image', $3, 0, NULL, $4, $5) RETURNING id`,
        [name, mime || null, bytes.length, key, asker]
      );
      return res.json({
        id: rows[0].id, name, kind: 'image', bytes: bytes.length, url,
        note: 'Stored as a visual reference. The oracle can be told about it and can talk about it, but it reads words better than pictures.'
      });
    }

    if (!looksText) {
      return res.status(415).json({
        error: 'That file type cannot be read. Plain text, Markdown, CSV, JSON, HTML, subtitles, code and images are all fine.'
      });
    }

    let text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (/html?$/i.test(name) || /html/i.test(mime)) text = fromHtml(text);
    text = clean(text).slice(0, MAX_CHARS);

    if (text.length < 2) {
      return res.status(422).json({ error: 'That file decoded to nothing readable.' });
    }

    const { rows } = await db.query(
      `INSERT INTO uploads (name, mime, kind, bytes, chars, body, asker_name)
       VALUES ($1, $2, 'text', $3, $4, $5, $6) RETURNING id`,
      [name, mime || null, bytes.length, text.length, text, asker]
    );

    return res.json({
      id: rows[0].id,
      name,
      kind: 'text',
      bytes: bytes.length,
      chars: text.length,
      excerpt: text.slice(0, 400)
    });
  } catch (err) {
    console.error('upload failed', err && err.message);
    return res.status(500).json({ error: 'The file could not be stored. Try again in a moment.' });
  }
}
