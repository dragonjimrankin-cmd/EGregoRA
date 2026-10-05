/**
 * Continuity — keeping the same people, the same place and the same camera
 * across a sequence of generations.
 * =============================================================================
 *
 * The problem this solves is the oldest one in generative video. Every clip is
 * made from scratch by a model with no memory, so the second shot of "the fox"
 * is a different fox: another coat, another face, another room, another lens.
 * Cut them together and it is not a film, it is a slideshow of strangers.
 *
 * The fix here is deliberately mechanical rather than clever, because clever
 * is what drifts. When a generation is made, its prompt is split into clauses
 * and each clause is filed under one of five headings:
 *
 *   characters  — who or what is in the shot, and what they look like
 *   setting     — where it is, and what is behind them
 *   camera      — shot size, lens, angle, movement
 *   light       — time of day, source, quality
 *   style       — medium, film stock, grade, grain
 *
 * That is the SHEET. It is stored with the generation. When a later generation
 * is extended from that frame, the sheet is carried over VERBATIM — the exact
 * words that produced the first shot, not a paraphrase of them — and only the
 * action is new. The same seed travels with it, and where the route supports
 * image-to-video the selected frame itself is handed over as the first frame.
 *
 * Three locks, in order of strength:
 *   1. the frame itself (image-to-video: strongest, needs a route that offers it)
 *   2. the identical seed (same noise, same world)
 *   3. the identical descriptive words (works everywhere, always)
 *
 * No model is called to do any of this. It is string work, it is deterministic,
 * and it can be read in a log — which means when continuity does break you can
 * see exactly which clause went missing.
 */

/* ---------------------------------------------------------------- lexicons */

const CAMERA = /\b(close[- ]?up|extreme close|medium shot|wide shot|wide angle|long shot|establishing|two[- ]shot|over[- ]the[- ]shoulder|low angle|high angle|eye[- ]level|dutch angle|bird'?s[- ]eye|worm'?s[- ]eye|aerial|drone|crane|dolly|truck|tracking|steadicam|handheld|locked[- ]off|static camera|pan(?:ning)?|tilt(?:ing)?|zoom(?:ing)?|push in|pull back|orbit(?:ing)?|rack focus|shallow depth of field|deep focus|bokeh|\d{2,3}\s?mm|f\/\d|anamorphic|macro|telephoto|fisheye|pov|point of view|slow motion|time[- ]lapse|portrait orientation|landscape orientation)\b/i;

const LIGHT = /\b(sunlight|sunlit|winter sun|low sun|daylight|lamplight|starlight|torchlight|golden hour|blue hour|first light|dawn|dusk|sunrise|sunset|midday|moonlight|moonlit|candle ?lit|firelight|backlit|back ?lighting|rim light|key light|side[- ]lit|top light|soft light|hard light|diffused|overcast|shafts? of light|god rays|volumetric|neon|tungsten|fluorescent|silhouette|high key|low key|chiaroscuro|dappled|underlit|lit by)\b/i;

const STYLE = /\b(photoreal(?:istic)?|cinematic|documentary|film still|35 ?mm|16 ?mm|super ?8|kodak|portra|ektachrome|technicolor|black and white|monochrome|sepia|oil paint(?:ing)?|watercolou?r|ink|etching|engraving|woodcut|illustration|anime|cel[- ]shaded|claymation|stop[- ]motion|3d render|unreal engine|octane|pixel art|vaporwave|art nouveau|baroque|renaissance|impressionist|grain(?:y)?|vhs|lo-?fi|hdr|desaturated|muted palette|high contrast|colour grade|color grade)\b/i;

const SETTING = /\b(in|inside|outside|on|at|under|above|beneath|before|behind|among|amongst|through|across|beside|within|near|by)\s+(?:the|a|an|their|his|her|its)\b|\b(forest|woodland|wood|bracken|moor|heath|field|meadow|mountain|valley|glen|river|stream|lake|sea|ocean|shore|beach|cliff|cave|desert|tundra|glacier|city|street|alley|rooftop|room|kitchen|library|cathedral|temple|church|ruins|stone circle|henge|observatory|laboratory|workshop|study|corridor|staircase|garden|orchard|grove|clearing|snow|rain|fog|mist|storm|sky|space|nebula|orbit|surface of|landscape|background|backdrop|horizon|interior|exterior)\b/i;

const PEOPLE = /\b(man|woman|men|women|person|people|child|children|boy|girl|figure|figures|elder|old man|old woman|wizard|witch|druid|monk|priest|scientist|astronaut|soldier|dancer|rider|crowd|he|she|they|fox|foxes|wolf|dog|cat|hare|rabbit|deer|stag|raven|crow|owl|hawk|eagle|horse|bear|serpent|snake|dragon|creature|beast|animal|familiar|robot|android|alien|gink|ed|edward|jim)\b/i;

/* Clause splitting: commas and semicolons, but not inside brackets. */
function clauses(text) {
  const out = [];
  let depth = 0;
  let buf = '';
  for (const ch of String(text || '')) {
    if (ch === '(' || ch === '[') depth += 1;
    if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === ',' || ch === ';' || ch === '\n')) {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/* Order matters. Style before camera, because "35mm film grain" is a stock and
   not a lens; light before setting, because "low winter sun" is not a place;
   people before setting, because a fox standing in bracken is first of all a
   fox. The first clause of a prompt is the subject whatever it contains, and
   is filed as a character without a vote. */
function fileClause(c) {
  if (STYLE.test(c)) return 'style';
  if (CAMERA.test(c)) return 'camera';
  if (LIGHT.test(c)) return 'light';
  if (PEOPLE.test(c)) return 'characters';
  if (SETTING.test(c)) return 'setting';
  return 'scene';
}

const uniq = (list) => {
  const seen = new Set();
  const out = [];
  for (const item of list || []) {
    const t = String(item || '').trim().replace(/\s+/g, ' ');
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
};

/**
 * Read a prompt and file every clause of it under a heading.
 * @param {string} prompt
 * @returns {{characters:string[], setting:string[], camera:string[], light:string[], style:string[], scene:string[]}}
 */
export function readSheet(prompt) {
  const sheet = { characters: [], setting: [], camera: [], light: [], style: [], scene: [] };
  const list = clauses(prompt);
  list.forEach((c, i) => {
    sheet[i === 0 ? 'characters' : fileClause(c)].push(c);
  });
  if (!sheet.characters.length && sheet.scene.length) {
    sheet.characters.push(sheet.scene.shift());
  }
  for (const k of Object.keys(sheet)) sheet[k] = uniq(sheet[k]).slice(0, 8);
  return sheet;
}

/**
 * Fold a new prompt into an existing sheet. Carried headings win: the point of
 * continuity is that the earlier description is not quietly replaced. New
 * material under a heading that was empty is adopted; everything else in the
 * new prompt becomes the action of this shot.
 */
export function extendSheet(prev, nextPrompt) {
  const base = normaliseSheet(prev);
  const fresh = readSheet(nextPrompt);
  const out = {};
  for (const k of ['characters', 'setting', 'camera', 'light', 'style', 'scene']) {
    out[k] = base[k] && base[k].length ? base[k].slice() : (fresh[k] || []).slice();
  }
  return out;
}

export function normaliseSheet(sheet) {
  const out = { characters: [], setting: [], camera: [], light: [], style: [], scene: [] };
  if (!sheet || typeof sheet !== 'object') return out;
  for (const k of Object.keys(out)) {
    const v = sheet[k];
    if (Array.isArray(v)) out[k] = uniq(v).slice(0, 8);
    else if (typeof v === 'string' && v.trim()) out[k] = [v.trim()];
  }
  return out;
}

export function isEmptySheet(sheet) {
  const s = normaliseSheet(sheet);
  return !Object.keys(s).some((k) => s[k].length);
}

/**
 * Build the prompt for a continuation.
 *
 * The carried description is stated as fact rather than as instruction —
 * diffusion models follow description far better than they follow orders —
 * and the new action is put last, where every video model weights it most.
 *
 * @param {object} sheet   the sheet carried from the previous shot
 * @param {string} action  what is new in this shot
 * @param {object} [opts]  { continuesFrom: 'a description of the previous shot' }
 * @returns {string}
 */
export function composePrompt(sheet, action, opts = {}) {
  const s = normaliseSheet(sheet);
  const act = String(action || '').trim();
  const parts = [];

  /* Natural prompt order — subject, scene, action, place, light, camera, stock.
     The carried clauses are reused word for word; only the action is new. */
  for (const c of s.characters) parts.push(c);
  for (const c of s.scene) parts.push(c);
  if (act) parts.push(act);
  for (const c of s.setting) parts.push(c);
  for (const c of s.light) parts.push(c);
  for (const c of s.camera) parts.push(c);
  for (const c of s.style) parts.push(c);

  let text = parts.join(', ').replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
  if (opts.continuesFrom) {
    text = 'Continuing directly from the previous shot. Identical characters with ' +
      'identical faces, markings and wardrobe; identical location and background; ' +
      'identical camera, lens and framing; identical light and colour. ' + text;
  }
  return text.slice(0, 1400);
}

/**
 * A short human-readable line for the page: what is being carried over.
 */
export function describeSheet(sheet) {
  const s = normaliseSheet(sheet);
  const bits = [];
  if (s.characters.length) bits.push('characters: ' + s.characters.join(', '));
  if (s.setting.length) bits.push('setting: ' + s.setting.join(', '));
  if (s.camera.length) bits.push('camera: ' + s.camera.join(', '));
  if (s.light.length) bits.push('light: ' + s.light.join(', '));
  if (s.style.length) bits.push('style: ' + s.style.join(', '));
  return bits.join(' \u00b7 ');
}

/**
 * A seed derived from the text of a sheet, so that a continuation started on
 * two different days from the same frame lands in the same world. Stable,
 * 31-bit, no dependencies.
 */
export function seedFor(sheet, explicit) {
  const n = Number(explicit);
  if (Number.isFinite(n) && n > 0) return Math.floor(n) % 2147483647;
  const text = describeSheet(sheet) || 'egregora';
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 2147483647;
}
