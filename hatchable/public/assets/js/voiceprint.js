/**
 * Consented speaker voiceprints for podcast labelling.
 *
 * Audio never leaves the browser through this module. A compact acoustic
 * template is extracted locally, encrypted with a key derived from the
 * administrator's passcode, and only the AES-GCM envelope is returned for
 * storage. These templates label podcast speakers; they are deliberately not
 * an authentication factor.
 */

export const VOICEPRINT_VERSION = "eg-vp-mfsc-1";
const TARGET_RATE = 8000;
const FRAME = 256;                  // 32 ms at 8 kHz
const HOP_SECONDS = 0.015;
const MAX_FRAMES = 6000;            // at most 90 seconds of voiced material
const FREQS = [110, 160, 230, 330, 470, 680, 970, 1380, 1960, 2760, 3600];
const te = new TextEncoder();
const td = new TextDecoder();

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function base64(bytes) {
  let text = "";
  for (let at = 0; at < bytes.length; at += 0x8000) {
    text += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  }
  return btoa(text);
}

function unbase64(text) {
  const raw = atob(String(text || ""));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function sampledFrame(channels, sourceRate, atSeconds) {
  const out = new Float64Array(FRAME);
  const origin = atSeconds * sourceRate;
  const step = sourceRate / TARGET_RATE;
  let mean = 0;
  for (let i = 0; i < FRAME; i++) {
    const place = origin + i * step;
    const left = Math.floor(place);
    const mix = place - left;
    let value = 0;
    for (const channel of channels) {
      const a = channel[Math.min(channel.length - 1, left)] || 0;
      const b = channel[Math.min(channel.length - 1, left + 1)] || a;
      value += a + (b - a) * mix;
    }
    out[i] = value / channels.length;
    mean += out[i];
  }
  mean /= FRAME;
  for (let i = 0; i < FRAME; i++) out[i] -= mean;
  return out;
}

function frameFeatures(raw) {
  let rms = 0;
  let zc = 0;
  for (let i = 0; i < raw.length; i++) {
    rms += raw[i] * raw[i];
    if (i && ((raw[i] >= 0) !== (raw[i - 1] >= 0))) zc++;
  }
  rms = Math.sqrt(rms / raw.length);
  if (rms < 0.0008) return null;

  const windowed = new Float64Array(raw.length);
  let previous = 0;
  for (let i = 0; i < raw.length; i++) {
    const emphasised = raw[i] - 0.97 * previous;
    previous = raw[i];
    windowed[i] = emphasised * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (raw.length - 1)));
  }

  let bestLag = 0;
  let bestCorrelation = 0;
  for (let lag = Math.floor(TARGET_RATE / 350); lag <= Math.ceil(TARGET_RATE / 75); lag++) {
    let sum = 0, a2 = 0, b2 = 0;
    for (let i = lag; i < raw.length; i++) {
      const a = raw[i], b = raw[i - lag];
      sum += a * b; a2 += a * a; b2 += b * b;
    }
    const correlation = sum / Math.sqrt(Math.max(1e-12, a2 * b2));
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }
  const pitch = bestCorrelation >= 0.22 && bestLag
    ? clamp(Math.log((TARGET_RATE / bestLag) / 155), -1.2, 1.2)
    : 0;

  const bands = FREQS.map((frequency) => {
    const omega = (2 * Math.PI * frequency) / TARGET_RATE;
    const coefficient = 2 * Math.cos(omega);
    let q0 = 0, q1 = 0, q2 = 0;
    for (let i = 0; i < windowed.length; i++) {
      q0 = windowed[i] + coefficient * q1 - q2;
      q2 = q1;
      q1 = q0;
    }
    const power = Math.max(1e-12, q1 * q1 + q2 * q2 - coefficient * q1 * q2);
    return Math.log(power);
  });
  const bandMean = bands.reduce((n, value) => n + value, 0) / bands.length;

  return {
    rms,
    vector: [
      pitch,
      clamp(bestCorrelation, 0, 1),
      zc / raw.length,
      clamp((Math.log(rms + 1e-9) + 4.5) / 4, -1.5, 1.5),
      ...bands.map((value) => clamp((value - bandMean) / 5, -1.5, 1.5))
    ]
  };
}

function normalise(vector) {
  const length = Math.sqrt(vector.reduce((n, value) => n + value * value, 0));
  if (!length) throw new Error("The acoustic template had no measurable shape.");
  return vector.map((value) => Math.round((value / length) * 1e6) / 1e6);
}

/**
 * Extract a revocable acoustic template from AudioBuffer-like data.
 * `intervals` is a list of consenting speech ranges in seconds.
 */
export function voiceTemplate(buffer, intervals) {
  if (!buffer || !buffer.sampleRate || !buffer.numberOfChannels || !buffer.getChannelData) {
    throw new Error("No decoded voice sample is available.");
  }
  const channels = [];
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    channels.push(buffer.getChannelData(channel));
  }
  const ranges = (Array.isArray(intervals) ? intervals : [])
    .map((range) => ({
      from: clamp(Number(range && range.from) || 0, 0, buffer.duration),
      to: clamp(Number(range && range.to) || 0, 0, buffer.duration)
    }))
    .filter((range) => range.to - range.from >= 0.35);
  if (!ranges.length) throw new Error("There is no long-enough consenting speech range.");

  const frames = [];
  let sourceSeconds = 0;
  for (const range of ranges) {
    sourceSeconds += range.to - range.from;
    for (let at = range.from + 0.04;
      at + FRAME / TARGET_RATE < range.to && frames.length < MAX_FRAMES;
      at += HOP_SECONDS) {
      const feature = frameFeatures(sampledFrame(channels, buffer.sampleRate, at));
      if (feature) frames.push(feature);
    }
    if (frames.length >= MAX_FRAMES) break;
  }
  if (frames.length < 120) {
    throw new Error("The voiceprint needs at least a few clear seconds of one consenting speaker.");
  }

  /* Remove the quietest tail without requiring a calibrated microphone. */
  const levels = frames.map((frame) => frame.rms).sort((a, b) => a - b);
  const floor = levels[Math.floor(levels.length * 0.12)] || 0;
  let voiced = frames.filter((frame) => frame.rms >= Math.max(0.0012, floor * 1.35));
  if (voiced.length < 120) voiced = frames.slice();

  const dimensions = voiced[0].vector.length;
  const means = new Array(dimensions).fill(0);
  for (const frame of voiced) {
    for (let i = 0; i < dimensions; i++) means[i] += frame.vector[i];
  }
  for (let i = 0; i < dimensions; i++) means[i] /= voiced.length;
  const deviations = new Array(dimensions).fill(0);
  for (const frame of voiced) {
    for (let i = 0; i < dimensions; i++) {
      const difference = frame.vector[i] - means[i];
      deviations[i] += difference * difference;
    }
  }
  for (let i = 0; i < dimensions; i++) deviations[i] = Math.sqrt(deviations[i] / voiced.length);

  const pitchFrames = voiced.filter((frame) => frame.vector[1] >= 0.22).length;
  return {
    version: VOICEPRINT_VERSION,
    kind: "consented acoustic speaker template; not authentication",
    embedding: normalise(means.concat(deviations)),
    dimensions: dimensions * 2,
    sample_frames: voiced.length,
    voiced_seconds: Math.round(voiced.length * HOP_SECONDS * 100) / 100,
    source_seconds: Math.round(sourceSeconds * 100) / 100,
    pitch_frame_ratio: Math.round((pitchFrames / voiced.length) * 10000) / 10000
  };
}

async function passKey(pass, salt, iterations) {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error("This browser cannot protect biometric templates.");
  }
  const material = await crypto.subtle.importKey(
    "raw", te.encode(String(pass || "")), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({
    name: "PBKDF2", salt, iterations, hash: "SHA-256"
  }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

function additionalData(name) {
  return te.encode("EGregoRA|podcast-voiceprint|" + VOICEPRINT_VERSION + "|" + name);
}

/** Encrypt a template before it crosses the network. */
export async function sealVoiceprint(name, template, pass) {
  if (!pass) throw new Error("Open the admin door before enrolling a voiceprint.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 210000;
  const key = await passKey(pass, salt, iterations);
  const encrypted = await crypto.subtle.encrypt({
    name: "AES-GCM", iv, additionalData: additionalData(name)
  }, key, te.encode(JSON.stringify(template)));
  return {
    ciphertext: base64(new Uint8Array(encrypted)),
    salt: base64(salt),
    iv: base64(iv),
    kdf: "PBKDF2-SHA-256",
    iterations,
    cipher: "AES-256-GCM",
    feature_version: VOICEPRINT_VERSION
  };
}

/** Decrypt an administrator-only stored template in this browser. */
export async function openVoiceprint(record, pass) {
  try {
    if (!record || record.feature_version !== VOICEPRINT_VERSION ||
        record.kdf !== "PBKDF2-SHA-256" || record.cipher !== "AES-256-GCM") {
      throw new Error("unsupported template");
    }
    const salt = unbase64(record.salt);
    const iv = unbase64(record.iv);
    const key = await passKey(pass, salt, Number(record.iterations));
    const plain = await crypto.subtle.decrypt({
      name: "AES-GCM", iv, additionalData: additionalData(record.name)
    }, key, unbase64(record.ciphertext));
    const template = JSON.parse(td.decode(plain));
    if (!template || template.version !== VOICEPRINT_VERSION ||
        !Array.isArray(template.embedding) || template.embedding.length < 20 ||
        template.embedding.some((value) => !Number.isFinite(Number(value)))) {
      throw new Error("invalid template");
    }
    return template;
  } catch {
    throw new Error("That voiceprint could not be opened with this admin passcode; re-enrol it if the passcode changed.");
  }
}

/** Cosine similarity mapped to 0..1 for display and guarded matching. */
export function voiceSimilarity(left, right) {
  const a = left && left.embedding;
  const b = right && right.embedding;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += Number(a[i]) * Number(b[i]);
    aa += Number(a[i]) * Number(a[i]);
    bb += Number(b[i]) * Number(b[i]);
  }
  if (!aa || !bb) return 0;
  return clamp((dot / Math.sqrt(aa * bb) + 1) / 2, 0, 1);
}