/**
 * Image generation for the fox.
 *
 * The oracle can draw. One call in, one finished 2D image out, stored in the
 * project's object storage and handed back as a signed URL the browser can
 * show immediately.
 *
 * Two providers are tried in order through `ai.fetch`, which injects the
 * buyer's own key server-side — Google's Gemini image model first because it
 * is fast and cheap, then OpenAI's images endpoint. Nothing here throws: a
 * failure comes back as `{ error }` so the oracle can say so in plain words
 * instead of pretending it drew something.
 */
import { ai, storage } from 'hatchable';

/* House style. The fox draws photographs unless it is told otherwise:
   real optics, real light, no illustration, no text burned into the frame. */
const PHOTO_STYLE = [
  'A single photorealistic photograph, 2D, no collage, no grid, no borders, no caption.',
  'Shot on a full-frame camera with a fast prime lens; natural light, true-to-life colour,',
  'correct depth of field, fine surface detail, subtle film grain, no digital over-sharpening.',
  'No text, no watermark, no signature, no lettering anywhere in the image.',
  'Not an illustration, not a painting, not 3D render, not CGI, not cartoon.'
].join(' ');

const STYLE_OVERRIDE =
  /\b(illustrat|paint|drawing|drawn|sketch|woodcut|engrav|etching|diagram|cartoon|anime|watercolou?r|ink|render|3d|pixel|poster|icon|logo|stained glass|tapestry|fresco|mosaic)\b/i;

function fullPrompt(subject) {
  const s = String(subject || '').trim();
  // If the asker explicitly wants a style, honour it rather than forcing a photograph.
  if (STYLE_OVERRIDE.test(s)) {
    return s + ' Single standalone 2D image. No text, no watermark, no lettering.';
  }
  return s + '\n\n' + PHOTO_STYLE;
}

async function viaGoogle(prompt) {
  const r = await ai.fetch({
    provider: 'google',
    path: '/v1beta/models/gemini-2.5-flash-image-preview:generateContent',
    body: {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] }
    },
    purpose: 'oracle-image'
  });
  if (!r || !r.ok) return null;
  const data = await r.json();
  const parts =
    data && data.candidates && data.candidates[0] &&
    data.candidates[0].content && data.candidates[0].content.parts;
  const part = (parts || []).find((p) => p && p.inlineData && p.inlineData.data);
  if (!part) return null;
  return {
    base64: part.inlineData.data,
    contentType: part.inlineData.mimeType || 'image/png',
    provider: 'google'
  };
}

async function viaOpenAI(prompt) {
  const r = await ai.fetch({
    provider: 'openai',
    path: '/v1/images/generations',
    body: { model: 'gpt-image-1', prompt, size: '1024x1024', n: 1 },
    purpose: 'oracle-image'
  });
  if (!r || !r.ok) return null;
  const data = await r.json();
  const b64 = data && data.data && data.data[0] && data.data[0].b64_json;
  if (!b64) return null;
  return { base64: b64, contentType: 'image/png', provider: 'openai' };
}

/**
 * Draw one image.
 * @param {string} subject what to draw, in plain words
 * @returns {Promise<{url?:string, prompt:string, provider?:string, error?:string}>}
 */
export async function generateImage(subject) {
  const subj = String(subject || '').trim().slice(0, 1200);
  if (subj.length < 3) return { prompt: subj, error: 'Nothing to draw — say what the picture should show.' };

  const prompt = fullPrompt(subj);
  const attempts = [viaGoogle, viaOpenAI];
  let lastErr = '';

  for (const attempt of attempts) {
    try {
      const out = await attempt(prompt);
      if (!out) continue;
      const ext = out.contentType.includes('jpeg') ? 'jpg' : 'png';
      const key = `oracle-images/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
      await storage.put(key, out.base64, out.contentType);
      const url = await storage.url(key, { ttl: 604800 });
      return { url, key, prompt: subj, provider: out.provider };
    } catch (err) {
      if (err && err.code === 'SetupRequired') {
        return {
          prompt: subj,
          error:
            'No image provider key is configured for this project yet, so the drawing cannot be made. ' +
            'The owner can paste a Google or OpenAI key on the Hatchable setup page.'
        };
      }
      lastErr = (err && err.message) || 'unknown error';
      console.error('imagegen: provider failed', lastErr);
    }
  }

  return { prompt: subj, error: 'The drawing failed' + (lastErr ? ': ' + lastErr : '.') };
}
