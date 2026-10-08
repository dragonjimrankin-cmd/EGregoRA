/**
 * Web access for the oracle.
 *
 * Two primitives, both deliberately simple and both defensive: the oracle is
 * allowed to look things up, but a failed lookup must never cost the asker
 * their answer. Every function here resolves to a plain object and never
 * throws — failures come back as `{ error }` so the model can say so out loud
 * rather than inventing a result.
 *
 * `fetch` is tried first because it is fast and cheap. When a page is
 * JavaScript-rendered or refuses a bare request, the managed Chromium pool
 * (`browser.html`) is used as the fallback.
 */
import { browser } from 'hatchable';

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0 Safari/537.36 EGregoRA-Oracle/1.0 (+https://egregora.hatchable.site)';

const FETCH_TIMEOUT = 12000;
const PAGE_CHARS = 7000;

/* ------------------------------------------------------------- utilities */

async function get(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'accept-language': 'en-GB,en;q=0.9'
      }
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', times: '×', deg: '°', pound: '£', euro: '€'
};

function decode(s) {
  return String(s || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENTITIES ? ENTITIES[n.toLowerCase()] : m));
}

function strip(html) {
  return decode(
    String(html || '')
      .replace(/<(script|style|noscript|svg|nav|footer|form)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t\f\v\u00a0]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/** DuckDuckGo wraps outbound links; unwrap them to the real destination. */
function unwrap(href) {
  const h = decode(href || '');
  const m = /[?&]uddg=([^&]+)/.exec(h);
  if (m) {
    try { return decodeURIComponent(m[1]); } catch { /* fall through */ }
  }
  if (h.startsWith('//')) return 'https:' + h;
  return h;
}

function safeUrl(raw) {
  try {
    const u = new URL(String(raw).trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    const host = u.hostname.toLowerCase();
    // no loopback or private space, ever
    if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return null;
    if (host.endsWith('.internal') || host.endsWith('.local')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- search */

function parseResults(html, limit) {
  const out = [];
  const seen = new Set();

  // html.duckduckgo.com markup
  const re = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) && out.length < limit) {
    const url = safeUrl(unwrap(m[1]));
    const title = strip(m[2]);
    if (!url || !title || seen.has(url)) continue;
    seen.add(url);
    out.push({ title, url, snippet: '' });
  }

  // lite.duckduckgo.com markup
  if (!out.length) {
    const re2 = /<a[^>]+class="[^"]*result-link[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((m = re2.exec(html)) && out.length < limit) {
      const url = safeUrl(unwrap(m[1]));
      const title = strip(m[2]);
      if (!url || !title || seen.has(url)) continue;
      seen.add(url);
      out.push({ title, url, snippet: '' });
    }
  }

  // snippets, matched in document order and paired up with the titles above
  const snips = [];
  const sre = /class="[^"]*(?:result__snippet|result-snippet)[^"]*"[^>]*>([\s\S]*?)<\/(?:a|td)>/gi;
  while ((m = sre.exec(html))) snips.push(strip(m[1]).slice(0, 400));
  out.forEach((r, i) => { if (snips[i]) r.snippet = snips[i]; });

  return out;
}

/**
 * Search the open web.
 * @returns {Promise<{query:string, results:Array<{title,url,snippet}>, error?:string}>}
 */
export async function webSearch(query, limit = 6) {
  const q = String(query || '').trim().slice(0, 300);
  if (!q) return { query: q, results: [], error: 'Empty query.' };
  const n = Math.max(1, Math.min(8, Number(limit) || 6));
  const endpoints = [
    'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q),
    'https://lite.duckduckgo.com/lite/?q=' + encodeURIComponent(q)
  ];

  for (const url of endpoints) {
    const html = await get(url);
    if (!html) continue;
    const results = parseResults(html, n);
    if (results.length) return { query: q, results };
  }

  // last resort: render the results page in the managed browser
  try {
    const html = await browser.html(endpoints[0]);
    const results = parseResults(String(html || ''), n);
    if (results.length) return { query: q, results };
  } catch (err) {
    return { query: q, results: [], error: 'Search failed: ' + (err && err.message ? err.message : 'unavailable') };
  }

  return { query: q, results: [], error: 'No results came back for that query.' };
}

/* ------------------------------------------------------------- page read */

/**
 * Read one page as plain text.
 * @returns {Promise<{url:string, title?:string, text?:string, truncated?:boolean, error?:string}>}
 */
export async function readPage(rawUrl) {
  const url = safeUrl(rawUrl);
  if (!url) return { url: String(rawUrl || ''), error: 'That is not a public http(s) address.' };

  let html = await get(url);
  if (!html || strip(html).length < 240) {
    try {
      html = String((await browser.html(url)) || html || '');
    } catch {
      if (!html) return { url, error: 'The page could not be fetched.' };
    }
  }

  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html || '');
  const text = strip(html);
  if (!text) return { url, error: 'The page returned nothing readable.' };

  return {
    url,
    title: titleMatch ? decode(strip(titleMatch[1])).slice(0, 200) : undefined,
    text: text.slice(0, PAGE_CHARS),
    truncated: text.length > PAGE_CHARS
  };
}
