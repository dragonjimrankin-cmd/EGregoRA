/* A small, honest FLAC encoder — the house shelf's lossless door.
 *
 * Encodes 16-bit mono or stereo PCM to a FLAC 1.3 stream that any decoder
 * (the browser's own decodeAudioData included) reads back sample-exact:
 * fixed predictors of order 0–4 chosen per frame per channel, Rice-partitioned
 * residuals with the parameter searched around its analytic optimum, 4096
 * sample frames, one STREAMINFO block. No seek table, no MD5 — nothing a
 * decoder needs, everything a decoder checks.
 *
 *   encodeFlac({ sampleRate, channels: [Float32Array, ...], progress })
 *     -> Uint8Array
 *
 * Floats are quantised exactly as the MP3 path quantises them, so the two
 * doors start from the same samples. */

const BLOCK = 4096;

/* ------------------------------------------------------------- bit writer */
class Bits {
  constructor() { this.bytes = []; this.acc = 0; this.n = 0; }
  push(value, width) {
    for (let i = width - 1; i >= 0; i--) {
      this.acc = (this.acc << 1) | ((value >>> i) & 1);
      if (++this.n === 8) { this.bytes.push(this.acc & 0xff); this.acc = 0; this.n = 0; }
    }
  }
  pushBig(value, width) {           /* values past 32 bits, in 32-bit halves */
    const hi = Math.floor(value / 4294967296), lo = value >>> 0;
    if (width > 32) this.push(hi, width - 32);
    this.push(lo, Math.min(32, width));
  }
  align() { if (this.n) this.push(0, 8 - this.n); }
  out() { return Uint8Array.from(this.bytes); }
}

const CRC8 = (() => {
  const t = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 0x80) ? (((c << 1) ^ 0x07) & 0xff) : ((c << 1) & 0xff);
    t[i] = c;
  }
  return t;
})();
const CRC16 = (() => {
  const t = new Uint16Array(65536);
  for (let i = 0; i < 65536; i++) {
    let c = i << 8;
    for (let k = 0; k < 8; k++) c = (c & 0x8000) ? (((c << 1) ^ 0x8005) & 0xffff) : ((c << 1) & 0xffff);
    t[i] = c;
  }
  return t;
})();
const crc8 = (bytes) => { let c = 0; for (let i = 0; i < bytes.length; i++) c = CRC8[c ^ bytes[i]]; return c; };
const crc16 = (bytes) => { let c = 0; for (let i = 0; i < bytes.length; i++) c = ((c << 8) & 0xffff) ^ CRC16[((c >> 8) ^ bytes[i]) & 0xff]; return c; };

/* The frame header is not a whole number of bytes — the CRC-8 sits on a raw
   bit boundary — so the CRCs must run over the bit stream itself. */
function crc8Bits(bits) {
  let c = 0;
  const total = bits.bytes.length * 8 + bits.n;
  for (let i = 0; i < total; i++) {
    const byte = i < bits.bytes.length * 8
      ? bits.bytes[i >> 3]
      : bits.acc << (8 - bits.n);
    const bit = (byte >> (7 - (i & 7))) & 1;
    c = ((c << 1) & 0xff) ^ (((c >> 7) ^ bit) ? 0x07 : 0);
  }
  return c;
}

/* FLAC's UTF-8-like number: up to seven bytes, 36 bits. */
function pushUtf8Style(bits, value) {
  let width = 7;
  if (value < 0x80) width = 1;
  else for (let k = 2; k <= 7; k++) if (value < Math.pow(2, 5 + 6 * (k - 1))) { width = k; break; }
  if (width === 1) { bits.push(value, 8); return; }
  /* lead byte: `width` ones, a zero, then the top (7 - width) value bits */
  const lead = (0xfe << (7 - width)) & 0xff;
  bits.push(lead | Math.floor(value / Math.pow(2, 6 * (width - 1))), 8);
  for (let k = width - 2; k >= 0; k--) bits.push(0x80 | (Math.floor(value / Math.pow(2, 6 * k)) & 0x3f), 8);
}

/* -------------------------------------------------------- fixed predictor */
const COEF = [
  [], [1], [2, -1], [3, -3, 1], [4, -6, 4, -1]
];

function residualInto(out, samples, order, from, to) {
  const c = COEF[order];
  for (let i = from; i < to; i++) {
    let pred = 0;
    for (let k = 0; k < order; k++) pred += c[k] * samples[i - 1 - k];
    out[i - from] = samples[i] - pred;
  }
}

function foldInto(out, res, count) {
  for (let i = 0; i < count; i++) {
    const r = res[i];
    out[i] = r < 0 ? ((-r) * 2 - 1) >>> 0 : (r * 2) >>> 0;
  }
}

/* ------------------------------------------------------------- the stream */
export function encodeFlac(opts) {
  const sampleRate = Math.round(opts.sampleRate);
  const chans = opts.channels;
  const nch = Math.min(2, chans.length);
  const progress = opts.progress || null;
  const total = chans[0].length;
  if (!total) throw new Error('nothing to encode');

  /* Quantise exactly as the MP3 door does. */
  const pcm = [];
  for (let c = 0; c < nch; c++) {
    const f = chans[c], o = new Int16Array(total);
    for (let i = 0; i < total; i++) {
      const v = Math.max(-1, Math.min(1, f[i]));
      o[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    pcm.push(o);
  }

  const res = new Int32Array(BLOCK);
  const folded = new Uint32Array(BLOCK);
  const frames = Math.ceil(total / BLOCK);
  const frameParts = [];            /* one Uint8Array per finished frame */
  const seekEvery = 16;             /* a seek point about every second and a half */

  /* libFLAC's frame decoder rejects the "get from STREAMINFO" intercodes
     (rate 0000, size 000), so every header carries explicit codes. */
  const RATE_CODES = { 88200: 1, 176400: 2, 192000: 3, 8000: 4, 16000: 5, 22050: 6, 24000: 7, 32000: 8, 44100: 9, 48000: 10, 96000: 11 };
  let ri = RATE_CODES[sampleRate] || 0;
  let riTail = null;
  if (!ri) {
    if (sampleRate % 1000 === 0 && sampleRate / 1000 < 256) { ri = 0b1100; riTail = [sampleRate / 1000, 8]; }
    else if (sampleRate < 65536) { ri = 0b1101; riTail = [sampleRate, 16]; }
    else throw new Error('sample rate ' + sampleRate + ' is not writable');
  }

  for (let f = 0; f < frames; f++) {
    const from = f * BLOCK;
    const to = Math.min(total, from + BLOCK);
    const size = to - from;

    /* The header is byte-aligned: 32 fixed bits, the UTF-8-style frame
       number, any hint bytes, then the CRC-8. The subframes follow with no
       padding between; alignment happens only at the frame's end, before
       the CRC-16. */
    const frame = new Bits();
    frame.push(0x3ffe, 14);
    frame.push(0, 1);                              /* reserved */
    frame.push(0, 1);                              /* fixed blocksize: frame number */
    frame.push(size === BLOCK ? 0b1100 : 0b0111, 4);
    frame.push(ri, 4);                             /* sample rate intercode, explicit */
    frame.push(nch === 1 ? 0 : 1, 4);              /* channel assignment: 0 mono, 1 stereo */
    frame.push(0b100, 3);                          /* 16-bit samples, explicit */
    frame.push(0, 1);                              /* reserved */
    pushUtf8Style(frame, f);
    if (size !== BLOCK) frame.push(size - 1, 16);  /* RFC 9639 9.1.6: block size minus 1 */
    if (riTail) frame.push(riTail[0], riTail[1]);
    frame.push(crc8Bits(frame), 8);

    for (let c = 0; c < nch; c++) {
      const smp = pcm[c];
      const sub = frame;

      /* CONSTANT when the whole block is one value. */
      let constant = true;
      for (let i = from + 1; i < to; i++) if (smp[i] !== smp[from]) { constant = false; break; }
      if (constant) {
        sub.push(0, 1); sub.push(0b000000, 6);
        sub.push(0, 1);                            /* no wasted bits */
        sub.push(smp[from] & 0xffff, 16);
        continue;
      }

      /* Pick the fixed order with the smallest residual energy. */
      let best = 0, bestSum = Infinity;
      for (let order = 0; order <= 4; order++) {
        residualInto(res, smp, order, from + order, to);
        let sum = 0;
        for (let i = 0; i < size - order; i++) sum += res[i] < 0 ? -res[i] : res[i];
        if (sum < bestSum) { bestSum = sum; best = order; }
      }
      const order = best;
      sub.push(0, 1);
      sub.push(0b001000 | order, 6);               /* FIXED, order in the low bits */
      sub.push(0, 1);                              /* no wasted bits */
      for (let i = 0; i < order; i++) sub.push(smp[from + i] & 0xffff, 16);

      /* Residual, Rice-partitioned (RICE2: five-bit parameters). */
      const count = size - order;
      residualInto(res, smp, order, from + order, to);
      foldInto(folded, res, count);

      let bestOrder = 0, bestCost = Infinity;
      /* Partitions must divide this frame's size evenly; a short last frame
         simply stays at partition order 0. */
      const orders = [];
      for (let pp = 0; pp <= 4; pp++) {
        if (size % (1 << pp) !== 0) continue;
        if ((size >> pp) <= order) continue;
        orders.push(pp);
      }
      for (const pp of orders) {
        const psize = size >> pp;
        let cost = 0;
        for (let pi = 0; pi < (1 << pp); pi++) {
          const lo = Math.max(0, pi === 0 ? 0 : pi * psize - order);
          const hi = (pi + 1) * psize - order;
          let mean = 0;
          for (let i = lo; i < hi; i++) mean += folded[i];
          mean = (mean / Math.max(1, hi - lo)) | 0;
          const par = mean <= 0 ? 0 : Math.min(30, 31 - Math.clz32(mean));
          cost += 5 + riceCost(folded, lo, hi, par);
        }
        if (cost < bestCost) { bestCost = cost; bestOrder = pp; }
      }

      sub.push(0b01, 2);
      sub.push(bestOrder, 4);
      const psize = size >> bestOrder;
      for (let pi = 0; pi < (1 << bestOrder); pi++) {
        const lo = Math.max(0, pi === 0 ? 0 : pi * psize - order);
        const hi = (pi + 1) * psize - order;
        let mean = 0;
        for (let i = lo; i < hi; i++) mean += folded[i];
        mean = (mean / Math.max(1, hi - lo)) | 0;
        let par = mean <= 0 ? 0 : Math.min(30, 31 - Math.clz32(mean));
        /* small local search around the analytic guess */
        let parCost = riceCost(folded, lo, hi, par), bestPar = par;
        for (let cand = Math.max(0, par - 2); cand <= Math.min(30, par + 2); cand++) {
          const cst = riceCost(folded, lo, hi, cand);
          if (cst < parCost) { parCost = cst; bestPar = cand; }
        }
        sub.push(bestPar, 5);
        for (let i = lo; i < hi; i++) {
          const u = folded[i], q = u >>> bestPar;
          /* unary per RFC 9639: q zero bits terminated by a one bit */
          for (let k = 0; k < q; k++) sub.push(0, 1);
          sub.push(1, 1);
          if (bestPar) sub.push(u & ((1 << bestPar) - 1), bestPar);
        }
      }
    }

    /* align once at the frame's end, then its CRC-16 over everything */
    frame.align();
    const body = frame.out();
    const c16 = crc16(body);
    const whole = new Uint8Array(body.length + 2);
    whole.set(body, 0);
    whole[body.length] = (c16 >> 8) & 0xff;
    whole[body.length + 1] = c16 & 0xff;
    frameParts.push(whole);

    if (progress && (f % 128 === 0 || f === frames - 1)) progress(f + 1, frames);
  }

  /* The frames are known, so STREAMINFO can carry true frame sizes and a
     seek table can point at real offsets — both of which a seeking player
     (and libsndfile) expect rather than guess at. */
  let minFrame = Infinity, maxFrame = 0, audioBytes = 0;
  for (const part of frameParts) {
    if (part.length < minFrame) minFrame = part.length;
    if (part.length > maxFrame) maxFrame = part.length;
    audioBytes += part.length;
  }

  const si = new Bits();
  si.push(BLOCK, 16); si.push(BLOCK, 16);         /* min/max block size */
  si.push(minFrame, 24); si.push(maxFrame, 24);
  si.pushBig(sampleRate, 20);
  si.push(nch - 1, 3);
  si.push(15, 5);                                 /* 16 bits per sample */
  si.pushBig(total, 36);
  const md5 = new Uint8Array(16);                 /* no MD5 promised */

  /* Seek points: the first frame, then every seekEvery-th, with byte offsets
     measured from the first frame, exactly as the format asks. */
  const seekPoints = [];
  let byteAt = 0;
  for (let f = 0; f < frames; f++) {
    if (f % seekEvery === 0) {
      seekPoints.push({ sample: f * BLOCK, offset: byteAt, size: Math.min(BLOCK, total - f * BLOCK) });
    }
    byteAt += frameParts[f].length;
  }

  const out = [];
  out.push(Uint8Array.from([0x66, 0x4c, 0x61, 0x43]));  /* fLaC */
  /* STREAMINFO must come first, so it is not flagged last; the seek table
     behind it carries the last flag. */
  const siHead = new Bits();
  siHead.push(0x00, 8); siHead.push(34, 24);
  out.push(siHead.out()); out.push(si.out()); out.push(md5);
  const st = new Bits();
  for (const pt of seekPoints) {
    st.pushBig(pt.sample, 64);
    st.pushBig(pt.offset, 64);
    st.push(pt.size, 16);
  }
  const stBytes = st.out();
  const stHead = new Bits();
  stHead.push(0x83, 8);                            /* last block, type SEEKTABLE */
  stHead.push(stBytes.length, 24);
  out.push(stHead.out()); out.push(stBytes);
  for (const part of frameParts) out.push(part);

  let totalLen = 0;
  for (const b of out) totalLen += b.length;
  const file = new Uint8Array(totalLen);
  let at2 = 0;
  for (const b of out) { file.set(b, at2); at2 += b.length; }
  return file;
}

function riceCost(folded, lo, hi, par) {
  let cost = 0;
  for (let i = lo; i < hi; i++) cost += (folded[i] >>> par) + 1 + par;
  return cost;
}
