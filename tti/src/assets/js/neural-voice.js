/* ===========================================================================
   Private, opt-in neural speech for ShakDrah and Gink.

   HeadTTS runs the Kokoro 82M model in a module worker, on WebGPU when it is
   available and WASM otherwise. The model, voice and runtime are downloaded
   only after a visitor explicitly selects the natural voice. Transformers.js
   uses the browser cache, so a later visit normally reuses those files.

   No answer text is sent to a speech API: inference and audio playback happen
   in this browser. Model/runtime files still have to be fetched from their
   public CDNs on first use. Native Web Speech remains the immediate fallback.
   =========================================================================== */

const PROFILE_DATA = {
  shakdrah: {
    key: "shakdrah",
    label: "ShakDrah",
    neuralVoice: "bm_george",
    neuralSpeed: 0.88,
    nativeRate: 0.9,
    nativePitch: 0.82,
    preferredNames: [
      "ryan natural", "george natural", "daniel", "arthur", "george",
      "ryan", "thomas", "microsoft george", "google uk english male"
    ]
  },
  gink: {
    key: "gink",
    label: "Gink",
    neuralVoice: "bm_fable",
    neuralSpeed: 1.02,
    nativeRate: 0.98,
    nativePitch: 0.96,
    preferredNames: [
      "oliver natural", "jamie natural", "oliver", "jamie", "lewis",
      "james", "microsoft ryan", "google uk english male", "daniel"
    ]
  }
};

export const AVATAR_VOICE_PROFILES = Object.freeze(Object.fromEntries(
  Object.entries(PROFILE_DATA).map(([key, value]) => [key, Object.freeze({ ...value })])
));

const FEMALE_HINT = /female|zira|hazel|susan|kate|serena|fiona|martha|amelie|libby|sonia|moira|karen|tessa|samantha|victoria/i;
const MALE_HINT = /male|daniel|arthur|oliver|george|ryan|thomas|jamie|lewis|james|aaron|alastair|matthew/i;
const NOVELTY_HINT = /whisper|bells|bad news|bubbles|cellos|organ|zarvox|trinoids|boing|wobble|bahh|novelty/i;
const QUALITY_HINT = /natural|neural|premium|enhanced|studio|online/i;

/** Rank installed browser voices rather than accepting the browser default.
 *  A natural/enhanced British voice wins; known masculine voices then win;
 *  novelty voices and voices marked feminine are rejected. */
export function rankNativeVoices(voices, profileName = "gink") {
  const profile = AVATAR_VOICE_PROFILES[profileName] || AVATAR_VOICE_PROFILES.gink;
  return Array.from(voices || [])
    .map((voice, order) => {
      const name = String(voice?.name || "");
      const lower = name.toLowerCase();
      const lang = String(voice?.lang || "");
      let score = 0;
      if (/^en[-_]GB$/i.test(lang)) score += 1200;
      else if (/^en[-_](IE|AU|NZ|ZA)$/i.test(lang)) score += 480;
      else if (/^en/i.test(lang)) score += 260;
      else score -= 900;
      if (QUALITY_HINT.test(name)) score += 330;
      if (MALE_HINT.test(name)) score += 130;
      if (FEMALE_HINT.test(name)) score -= 520;
      if (NOVELTY_HINT.test(name)) score -= 1500;
      if (voice?.localService) score += 25;
      if (voice?.default) score += 8;
      profile.preferredNames.forEach((hint, index) => {
        if (lower.includes(hint)) score += 520 - index * 24;
      });
      return { voice, score, order };
    })
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(({ voice }) => voice);
}

const LATEX_WORDS = {
  "\\infty": " infinity ",
  "\\times": " times ",
  "\\cdot": " times ",
  "\\pm": " plus or minus ",
  "\\neq": " is not equal to ",
  "\\approx": " is approximately ",
  "\\rightarrow": " leads to ",
  "\\leftrightarrow": " corresponds to ",
  "\\alpha": " alpha ",
  "\\beta": " beta ",
  "\\gamma": " gamma ",
  "\\delta": " delta ",
  "\\theta": " theta ",
  "\\phi": " phi ",
  "\\pi": " pi ",
  "\\tau": " tau ",
  "\\omega": " omega ",
  "\\mathbb{R}": " the real numbers ",
  "\\mathbb{C}": " the complex numbers "
};

/** Turn display-oriented prose into words a synthesiser can perform. The
 *  written answer is never changed. This expands common notation, strips
 *  markup that sounds bad aloud, and gives unusual house names a stable
 *  pronunciation. Punctuation is retained because Kokoro uses it as its
 *  principal prosody control. */
export function normaliseSpeechText(value, profileName = "gink") {
  const profile = AVATAR_VOICE_PROFILES[profileName] || AVATAR_VOICE_PROFILES.gink;
  let text = String(value || "")
    .replace(/```[\s\S]*?```/g, " code example ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|\/)[^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, " source link ")
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "$1 divided by $2")
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, "the square root of $1")
    .replace(/\\text\s*\{([^{}]+)\}/g, "$1")
    .replace(/\\(?:mathrm|mathbf|mathit|operatorname)\s*\{([^{}]+)\}/g, "$1");

  for (const [mark, words] of Object.entries(LATEX_WORDS)) text = text.split(mark).join(words);

  text = text
    .replace(/\$+/g, " ")
    .replace(/\^\{?([0-9]+)\}?/g, " to the power of $1")
    .replace(/_\{?([A-Za-z0-9]+)\}?/g, " sub $1")
    .replace(/[{}\\]/g, " ")
    .replace(/≠/g, " is not equal to ")
    .replace(/≈/g, " is approximately ")
    .replace(/≤/g, " is less than or equal to ")
    .replace(/≥/g, " is greater than or equal to ")
    .replace(/∞/g, " infinity ")
    .replace(/→/g, " leads to ")
    .replace(/↔/g, " corresponds to ")
    .replace(/±/g, " plus or minus ")
    .replace(/×/g, " times ")
    .replace(/\bTTI\b/g, "T T I")
    .replace(/\bEGregoRA\b/g, "E Greg or ah")
    .replace(/\bShakDrah\b/gi, "Shack Draah")
    .replace(/\bMöbius\b/gi, "Moebius")
    .replace(/\bquasiperiodic\b/gi, "quasi-periodic")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])(?=\S)/g, "$1 ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .trim();

  /* Keeping the name in the profile makes this function explicitly
     character-aware and leaves room for future character dictionaries. */
  if (profile.key === "gink") text = text.replace(/\bGink\b/gi, "Gink");
  return text;
}

/** Convert the avatar's grade-aware running order to HeadTTS input items.
 *  Explicit breaks are real silent samples, not punctuation guesses. */
export function buildPerformanceInput(script, profileName = "gink") {
  const input = [];
  for (const item of Array.from(script || [])) {
    if (item && Number(item.wait) > 0) {
      input.push({ type: "break", value: Math.min(5000, Math.max(80, Number(item.wait))) });
      continue;
    }
    const line = normaliseSpeechText(typeof item === "string" ? item : item?.line, profileName);
    if (!line) continue;
    input.push({ type: "text", value: line });
  }
  return input;
}

const conciseError = (error) => {
  const raw = String(error?.message || error?.data?.error || error || "unknown error")
    .replace(/https?:\/\/\S+/g, "the model host")
    .replace(/\s+/g, " ")
    .trim();
  return raw.slice(0, 180);
};

/** A small playback layer around HeadTTS. It streams generated sentence
 *  buffers into Web Audio, schedules HeadTTS's true phoneme/viseme timings,
 *  and supports cancellation plus pause/resume without discarding the model. */
export class NaturalVoiceEngine {
  constructor({ profile = "gink", onStatus, onStart, onEnd, onViseme, onWord, onError } = {}) {
    this.profile = AVATAR_VOICE_PROFILES[profile] || AVATAR_VOICE_PROFILES.gink;
    this.onStatus = onStatus || (() => {});
    this.onStart = onStart || (() => {});
    this.onEnd = onEnd || (() => {});
    this.onViseme = onViseme || (() => {});
    this.onWord = onWord || (() => {});
    this.onError = onError || (() => {});
    this.tts = null;
    this.audioContext = null;
    this.connectPromise = null;
    this.connected = false;
    this.audioQueue = [];
    this.current = null;
    this.source = null;
    this.cueTimers = [];
    this.paused = false;
    this.started = false;
    this.generating = false;
    this.session = 0;
  }

  static isSupported() {
    return typeof window !== "undefined" &&
      typeof Worker === "function" &&
      typeof WebAssembly === "object" &&
      typeof (window.AudioContext || window.webkitAudioContext) === "function";
  }

  get ready() { return this.connected; }
  get speaking() { return Boolean(this.source || this.current || this.audioQueue.length || this.generating); }

  async connect() {
    if (this.connected) return true;
    if (this.connectPromise) return this.connectPromise;
    if (!NaturalVoiceEngine.isSupported()) throw new Error("this browser cannot run local neural speech");

    this.connectPromise = (async () => {
      this.onStatus({ type: "loading", text: `Preparing ${this.profile.label}'s natural voice…` });
      /* Create/resume audio before the first await so the button or Speak
         gesture unlocks playback on mobile Safari as well as desktop. */
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = this.audioContext || new AudioContextClass();
      const modulePromise = import("./headtts/headtts.mjs");
      await this.audioContext.resume();
      const { HeadTTS } = await modulePromise;

      const root = new URL("./headtts/", import.meta.url);
      this.tts = new HeadTTS({
        endpoints: navigator.gpu ? ["webgpu", "wasm"] : ["wasm"],
        audioCtx: this.audioContext,
        workerModule: new URL("worker-tts.mjs", root).href,
        transformersModule: new URL("transformers.min.js", root).href,
        dictionaryURL: new URL("dictionaries/", root).href,
        voices: [this.profile.neuralVoice],
        defaultVoice: this.profile.neuralVoice,
        defaultLanguage: "en-us",
        defaultSpeed: this.profile.neuralSpeed,
        defaultAudioEncoding: "wav",
        dtypeWebgpu: "fp32",
        dtypeWasm: "q4",
        splitSentences: true,
        splitLength: 360
      });

      await this.tts.connect(null, (event) => {
        const loaded = Number(event.loaded) || 0;
        const total = Number(event.total) || 0;
        const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : null;
        const mb = (bytes) => Math.max(0, bytes / 1048576).toFixed(bytes > 10485760 ? 0 : 1);
        const measure = total > 0 ? ` · ${mb(loaded)} of ${mb(total)} MB` : "";
        this.onStatus({
          type: "progress", loaded, total, percent,
          text: `Downloading the private neural voice${percent === null ? "" : ` · ${percent}%`}${measure}`
        });
      });
      await this.tts.setup({
        voice: this.profile.neuralVoice,
        language: "en-us",
        speed: this.profile.neuralSpeed,
        audioEncoding: "wav"
      });
      this.connected = true;
      this.onStatus({
        type: "ready",
        text: `Natural neural voice ready — generated privately on this device.`
      });
      return true;
    })().catch((error) => {
      this.connected = false;
      this.connectPromise = null;
      throw error;
    });
    return this.connectPromise;
  }

  clearCues() {
    this.cueTimers.forEach(clearTimeout);
    this.cueTimers.length = 0;
  }

  scheduleCues(data, offsetSeconds) {
    this.clearCues();
    const schedule = (atMs, fn) => {
      const delay = Number(atMs) / 1000 - offsetSeconds;
      if (delay < -0.03) return;
      const timer = setTimeout(fn, Math.max(0, delay * 1000));
      this.cueTimers.push(timer);
    };
    (data.visemes || []).forEach((viseme, index) => {
      schedule((data.vtimes || [])[index], () => this.onViseme({
        viseme,
        duration: Math.max(0.035, Number((data.vdurations || [])[index] || 80) / 1000)
      }));
    });
    (data.words || []).forEach((word, index) => {
      schedule((data.wtimes || [])[index], () => this.onWord({
        word,
        duration: Math.max(0.05, Number((data.wdurations || [])[index] || 100) / 1000)
      }));
    });
  }

  async playNext(session = this.session) {
    if (session !== this.session || this.paused || this.source || this.current) return;
    const next = this.audioQueue.shift();
    if (!next) {
      this.finishIfDone(session);
      return;
    }
    this.current = { data: next, offset: 0, startedAt: 0 };
    await this.playCurrent(session);
  }

  async playCurrent(session = this.session) {
    if (session !== this.session || this.paused || !this.current) return;
    await this.audioContext.resume();
    const data = this.current.data;
    const buffer = data.audio;
    if (!buffer || typeof buffer.duration !== "number") {
      this.current = null;
      this.playNext(session);
      return;
    }
    const offset = Math.min(this.current.offset || 0, Math.max(0, buffer.duration - 0.005));
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    this.source = source;
    this.current.startedAt = this.audioContext.currentTime - offset;
    this.scheduleCues(data, offset);
    if (!this.started) {
      this.started = true;
      this.onStart();
    }
    source.onended = () => {
      if (session !== this.session || source !== this.source) return;
      this.clearCues();
      this.source = null;
      this.current = null;
      this.playNext(session);
    };
    source.start(0, offset);
  }

  finishIfDone(session = this.session) {
    if (session !== this.session || this.generating || this.source || this.current || this.audioQueue.length) return;
    const didStart = this.started;
    this.started = false;
    this.paused = false;
    if (didStart) this.onEnd({ cancelled: false });
  }

  async speak(script) {
    const input = buildPerformanceInput(script, this.profile.key);
    if (!input.length) return false;
    this.stop({ notify: false });
    const session = ++this.session;
    await this.connect();
    if (session !== this.session) return false;

    this.generating = true;
    let generationError = null;
    this.onStatus({ type: "generating", text: `${this.profile.label} is shaping the voice locally…` });
    try {
      await this.tts.synthesize({
        input,
        voice: this.profile.neuralVoice,
        language: "en-us",
        speed: this.profile.neuralSpeed,
        audioEncoding: "wav",
        userData: { session }
      }, (message) => {
        if (session !== this.session) return;
        if (message?.type === "audio" && message.data?.audio) {
          this.audioQueue.push(message.data);
          this.playNext(session);
        } else if (message?.type === "error") {
          generationError = new Error(message?.data?.error || "neural synthesis failed");
        }
      });
      if (session !== this.session) return false;
      if (generationError) throw generationError;
      this.generating = false;
      this.finishIfDone(session);
      return true;
    } catch (error) {
      if (session !== this.session) return false;
      this.generating = false;
      this.stop({ notify: false });
      const detail = conciseError(error);
      this.onError(error);
      throw new Error(detail);
    }
  }

  stop({ notify = true } = {}) {
    this.session += 1;
    this.generating = false;
    this.paused = false;
    this.started = false;
    this.audioQueue.length = 0;
    this.clearCues();
    if (this.source) {
      this.source.onended = null;
      try { this.source.stop(); } catch { /* already ended */ }
      try { this.source.disconnect(); } catch { /* already disconnected */ }
    }
    this.source = null;
    this.current = null;
    try { this.tts?.clear(); } catch { /* connection may still be starting */ }
    if (notify) this.onEnd({ cancelled: true });
  }

  pause() {
    if (this.paused || !this.source || !this.current) return false;
    this.current.offset = Math.max(0, this.audioContext.currentTime - this.current.startedAt);
    this.clearCues();
    const source = this.source;
    this.source = null;
    source.onended = null;
    try { source.stop(); } catch { /* already ended */ }
    try { source.disconnect(); } catch { /* already disconnected */ }
    this.paused = true;
    return true;
  }

  resume() {
    if (!this.paused || !this.current) return false;
    this.paused = false;
    this.playCurrent(this.session);
    return true;
  }
}
