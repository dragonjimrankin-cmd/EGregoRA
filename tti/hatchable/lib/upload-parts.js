/* Assemble browser-uploaded base64 chunks without holding the complete
   encoded upload and a second set of decoded chunks in memory at once.

   A long podcast used to be read with one SELECT, decoded into one Buffer per
   row, then copied once more by Buffer.concat. A 40 MB MP3 could therefore
   occupy well over 120 MB before object storage received it. Hatchable's
   function runtime can reject that with "Array buffer allocation failed".

   This helper first reads a tiny manifest, checks the decoded size, allocates
   the final Buffer once, then fetches and decodes one chunk directly into its
   final position. Peak assembly memory is the finished file plus one encoded
   database row. */

export class UploadAssemblyError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'UploadAssemblyError';
    this.status = status;
    this.expose = true;
  }
}

export function decodedBase64Size(encodedLength, tail = '') {
  const length = Number(encodedLength);
  if (!Number.isInteger(length) || length <= 0 || length % 4 !== 0) return -1;
  const ending = String(tail || '');
  const padding = ending.endsWith('==') ? 2 : ending.endsWith('=') ? 1 : 0;
  return Math.floor(length * 3 / 4) - padding;
}

export async function assembleUpload(db, upload, options = {}) {
  const maxBytes = Number(options.maxBytes);
  const emptyMessage = options.emptyMessage || 'Nothing arrived. Try the upload again.';
  const tooLargeMessage = options.tooLargeMessage || 'That file is too large for the shelf.';

  const { rows: manifest } = await db.query(
    `SELECT seq, LENGTH(part) AS encoded_length, RIGHT(part, 2) AS tail
       FROM media_chunks WHERE upload_id = $1 ORDER BY seq ASC`,
    [upload]);
  if (!manifest || !manifest.length) throw new UploadAssemblyError(400, emptyMessage);

  let total = 0;
  const parts = [];
  for (let index = 0; index < manifest.length; index += 1) {
    const row = manifest[index] || {};
    const seq = Number(row.seq);
    const bytes = decodedBase64Size(row.encoded_length, row.tail);
    if (seq !== index || bytes < 0) {
      throw new UploadAssemblyError(400,
        'The upload arrived with a missing or damaged piece. Please send it again.');
    }
    total += bytes;
    if (!Number.isSafeInteger(total)) throw new UploadAssemblyError(413, tooLargeMessage);
    if (Number.isFinite(maxBytes) && total > maxBytes) {
      throw new UploadAssemblyError(413, tooLargeMessage);
    }
    parts.push({ seq, bytes, encodedLength: Number(row.encoded_length) });
  }
  if (!total) throw new UploadAssemblyError(400, emptyMessage);

  let whole;
  try {
    whole = Buffer.allocUnsafe(total);
  } catch {
    throw new UploadAssemblyError(507,
      'The upload arrived, but the shelf could not reserve enough memory to assemble it. ' +
      'Please publish the enhanced MP3 or split the recording into smaller parts.');
  }

  /* The function runtime's Buffer is not always Node's: allocUnsafe has been
     seen to hand back a plain Uint8Array with no Buffer methods on it. So the
     pieces are decoded with Buffer.from and laid in with .set, which both a
     Buffer and a Uint8Array carry, instead of Buffer#write. */
  let offset = 0;
  for (const expected of parts) {
    const { rows } = await db.query(
      'SELECT part FROM media_chunks WHERE upload_id = $1 AND seq = $2',
      [upload, expected.seq]);
    const encoded = rows && rows[0] && String(rows[0].part || '');
    if (!encoded || encoded.length !== expected.encodedLength ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      throw new UploadAssemblyError(400,
        'The upload changed while it was being assembled. Please send it again.');
    }
    let decoded;
    try {
      decoded = Buffer.from(encoded, 'base64');
    } catch {
      decoded = null;
    }
    if (!decoded || decoded.length !== expected.bytes) {
      throw new UploadAssemblyError(400,
        'One upload piece could not be decoded. Please send the recording again.');
    }
    whole.set(decoded, offset);
    offset += decoded.length;
  }

  /* Whatever the runtime handed back, give the caller a true Buffer when one
     can be wrapped around the bytes without copying them. */
  if (typeof whole.write !== 'function') {
    try {
      whole = Buffer.from(whole.buffer, whole.byteOffset, whole.byteLength);
    } catch { /* the Uint8Array itself is still fine for storage.put */ }
  }

  return whole;
}