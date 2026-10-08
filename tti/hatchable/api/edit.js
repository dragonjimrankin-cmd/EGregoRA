/**
 * POST /api/edit — Admin Edit Mode.
 *
 * The small editor that lives in the bottom-left corner of every page. An
 * administrator draws a rectangle, says what they want changed inside it,
 * and this endpoint turns that sentence into a list of operations against
 * the elements the browser found in the box. The change is previewed on the
 * page first and published only when confirmed, and every published change
 * is written to a log that can be read, undone and redone.
 *
 * The rule the whole thing is built on: an operation may only name an
 * element the browser reported as inside the selection. The model never
 * sees the page, only the handful of nodes in the box, and anything it
 * returns that names something else is thrown away here rather than
 * trusted and thrown away in the browser.
 *
 * Actions
 *   { action: 'draft',     pass, page, prompt, rect, nodes }  propose changes
 *   { action: 'save',      pass, page, prompt, rect, ops, source,
 *                          confirm }                          publish them
 *   { action: 'list',      pass, page? }                      the log
 *   { action: 'undo',      pass, id }                         put one back
 *   { action: 'redo',      pass, id }                         and forward
 *   { action: 'overrides', page }                             public: what
 *                          every visitor should see on this page
 */
import { ai, db } from 'hatchable';
import { adminDoor } from '../lib/door.js';
import { freeChat } from '../lib/freeai.js';
import { openChat } from '../lib/openchat.js';
import { openaiChat } from '../lib/openai.js';

export const access = 'public';
export const methods = ['POST'];

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const MAX_NODES = 40;
const MAX_OPS = 60;

/* The only operations that exist. Anything else is refused, which is what
   keeps "change the colour of that heading" from becoming "run this". */
const OPS = ['text', 'colour', 'background', 'border', 'font-size', 'align', 'hide', 'show', 'style',
  'span-text', 'span-style'];

/* Styles an op may set, and nothing outside this list. No url(), no
   content, no position — a visual edit, not a redesign of the document. */
const STYLE_OK = [
  'color', 'background-color', 'border-color', 'border-width', 'border-style',
  'font-family', 'font-size', 'font-weight', 'font-style', 'text-align',
  'letter-spacing', 'word-spacing', 'line-height', 'opacity', 'text-decoration',
  'text-transform', 'padding', 'margin'
];

/* Hex, rgb(), a length, a keyword, or a font stack with its quotes. No
   url(), no semicolon: nothing that could close one declaration and open
   another. */
const SAFE_VALUE = /^[#a-zA-Z0-9 ,.()%'"+/-]{1,120}$/;

function tidyOps(list, allowed) {
  const out = [];
  for (const raw of Array.isArray(list) ? list.slice(0, MAX_OPS) : []) {
    if (!raw || typeof raw !== 'object') continue;
    const ref = clean(raw.ref, 60);
    const op = clean(raw.op, 16).toLowerCase();
    if (!ref || allowed.indexOf(ref) < 0) continue;      /* outside the box */
    if (OPS.indexOf(op) < 0) continue;
    const entry = { ref, op };

    /* A run of characters inside one text node: the node's index among its
       parent's children, and a start and an end measured in characters.
       Everything about it is a number, and every number is checked. */
    if (op === 'span-text' || op === 'span-style') {
      const node = Number(raw.node);
      const start = Number(raw.start);
      const end = Number(raw.end);
      if (!Number.isInteger(node) || node < 0 || node > 500) continue;
      if (!Number.isInteger(start) || start < 0) continue;
      if (!Number.isInteger(end) || end < start || end > 100000) continue;
      entry.node = node;
      entry.start = start;
      entry.end = end;
      if (op === 'span-text') {
        entry.value = String(raw.value == null ? '' : raw.value).slice(0, 4000);
      } else {
        const prop = clean(raw.prop, 40).toLowerCase();
        const value = clean(raw.value, 120);
        if (STYLE_OK.indexOf(prop) < 0 || !SAFE_VALUE.test(value)) continue;
        entry.prop = prop;
        entry.value = value;
      }
      out.push(entry);
      continue;
    }

    if (op === 'text') {
      entry.value = clean(raw.value, 2000);
      if (!entry.value) continue;
    } else if (op === 'hide' || op === 'show') {
      entry.value = '';
    } else if (op === 'style') {
      const prop = clean(raw.prop, 40).toLowerCase();
      const value = clean(raw.value, 120);
      if (STYLE_OK.indexOf(prop) < 0 || !SAFE_VALUE.test(value)) continue;
      entry.prop = prop;
      entry.value = value;
    } else {
      const value = clean(raw.value, 80);
      if (!SAFE_VALUE.test(value)) continue;
      entry.value = value;
    }
    out.push(entry);
  }
  return out;
}

/* ---------------------------------------------------------------- rules --
   A small interpreter for the instructions people actually type, used when
   no model door answers and as a sanity net when one does. It is not
   clever and does not pretend to be: it reads a colour, a size, a piece of
   replacement text or an instruction to hide, and applies it to every node
   in the box. The browser shows exactly what it will do before anything is
   published. */
const COLOURS = {
  gold: '#d7b05a', bright: '#f3ddaa', dim: '#9f947a', verdant: '#6fae7f',
  green: '#6fae7f', amethyst: '#9b7ddb', purple: '#9b7ddb', rose: '#cf7f8d',
  pink: '#cf7f8d', red: '#c05a4a', blue: '#8fb6d8', white: '#f6f1e6',
  black: '#0e0c0a', ink: '#0e0c0a', grey: '#9f947a', gray: '#9f947a',
  parchment: '#f4ecd8', orange: '#c98b6a', yellow: '#e8c766'
};

function readColour(text) {
  const hex = text.match(/#[0-9a-f]{3,8}\b/i);
  if (hex) return hex[0];
  const rgb = text.match(/rgba?\([^)]{1,40}\)/i);
  if (rgb) return rgb[0];
  for (const name of Object.keys(COLOURS)) {
    if (new RegExp('\\b' + name + '\\b', 'i').test(text)) return COLOURS[name];
  }
  return '';
}

function byRules(prompt, nodes) {
  const p = prompt.toLowerCase();
  const refs = nodes.map((n) => n.ref);
  const ops = [];

  const quoted = prompt.match(/["\u201c]([^"\u201d]{1,400})["\u201d]/);
  const toText = prompt.match(/\b(?:say|read|replace (?:it |the text )?with|change the text to|set the text to)\s+(.{2,400})$/i);
  if (quoted || toText) {
    const words = clean((quoted && quoted[1]) || (toText && toText[1]) || '', 400);
    const target = nodes.find((n) => n.text && n.text.length) || nodes[0];
    if (words && target) ops.push({ ref: target.ref, op: 'text', value: words });
  }

  if (/\bhide\b|\bremove\b|\bdelete\b|\btake (it|that) (out|away)\b/.test(p)) {
    for (const r of refs) ops.push({ ref: r, op: 'hide' });
  }

  const colour = readColour(prompt);
  if (colour) {
    const background = /\bbackground|\bbehind|\bfill\b/.test(p);
    const border = /\bborder|\bframe|\boutline\b/.test(p);
    for (const r of refs) {
      ops.push({
        ref: r, op: 'style',
        prop: background ? 'background-color' : border ? 'border-color' : 'color',
        value: colour
      });
    }
  }

  if (/\bbigger|\blarger|\bbold/.test(p)) {
    for (const r of refs) {
      ops.push({ ref: r, op: 'style', prop: /\bbold\b/.test(p) ? 'font-weight' : 'font-size',
        value: /\bbold\b/.test(p) ? '700' : '120%' });
    }
  } else if (/\bsmaller\b|\bshrink\b/.test(p)) {
    for (const r of refs) ops.push({ ref: r, op: 'style', prop: 'font-size', value: '85%' });
  }

  if (/\bcent(re|er)\b/.test(p)) {
    for (const r of refs) ops.push({ ref: r, op: 'style', prop: 'text-align', value: 'center' });
  }

  return ops;
}

/* ---------------------------------------------------------------- model --
   The model is given the nodes and nothing else, and is asked for JSON. It
   is a convenience on top of the rules, never an authority: whatever comes
   back goes through tidyOps, which drops anything naming a node outside the
   selection or an operation that is not on the list.

   The route is the oracle's route, in the oracle's order, so that there is
   one model stack on this site rather than two that can drift apart: the
   order's own Free.ai doors first (this endpoint is behind the passcode, so
   the asker is always an administrator), then the open-weights route —
   OpenRouter, Hugging Face, the order's own Colab GPU — then OpenAI on the
   order's key, then the project's own BYOK gateway. The first route that
   returns usable JSON wins. */
async function askTheStack(system, user) {
  const messages = [{ role: 'user', content: user }];

  try {
    const free = await freeChat({ system, messages, maxTokens: 700, temperature: 0.2 });
    if (free && free.text) return { text: free.text, via: 'free.ai ' + (free.label || '') };
  } catch (e) { console.error('edit: free.ai route failed', e && e.message); }

  try {
    const open = await openChat({ system, messages, temperature: 0.2, maxTokens: 700 });
    if (open && open.text) return { text: open.text, via: open.model + ' (' + open.route + ')' };
  } catch (e) { console.error('edit: open-weights route failed', e && e.message); }

  try {
    const oa = await openaiChat({ system, messages, temperature: 0.2, maxTokens: 700 });
    if (oa && oa.text) return { text: oa.text, via: (oa.model || 'openai') + ' (OpenAI)' };
  } catch (e) { console.error('edit: openai route failed', e && e.message); }

  for (const model of ['openai/gpt-4o-mini', 'anthropic/claude-3-5-haiku']) {
    try {
      const out = await ai.generateText({
        model, system, messages, maxTokens: 700, temperature: 0.2, purpose: 'page-edit'
      });
      const text = String(out && out.text ? out.text : '').trim();
      if (text) return { text, via: (out && out.model) || model };
    } catch (e) {
      if (e && e.code === 'SetupRequired') break;
      console.error('edit: byok route failed', e && e.message);
    }
  }
  return null;
}

async function byModel(prompt, nodes, page) {
  const brief = nodes.map((n) => ({
    ref: n.ref, kind: n.kind || 'element', tag: n.tag, classes: n.classes || '',
    text: String(n.text || '').slice(0, 240)
  }));
  const system = [
    'You are the editor inside an occult-themed website\'s admin tool.',
    'The administrator has drawn a rectangle on one page. You are given only what is inside it,',
    'as a list of items. An item with kind "words" is a run of text the administrator dragged',
    'across; an item with kind "element" is a whole block, such as a panel or a figure.',
    'You are also given an instruction. Reply with JSON only: {"ops":[...]} and nothing else.',
    'Each op is {"ref":"<one of the given refs, copied exactly>","op":"text|style|hide|show",',
    '"value":"...","prop":"<css property, for style only>"}.',
    'Use op "text" to replace the words of an item, verbatim, with exactly the value given.',
    'Use op "style" with a prop for anything visual. Allowed props: ' + STYLE_OK.join(', ') + '.',
    'Colours must be hex or rgb(); sizes must carry a unit, usually px.',
    'Items of kind "words" accept only text and style. hide and show are for elements.',
    'Never invent a ref, never name anything not in the list, and prefer the smallest change',
    'that does what was asked. If it cannot be done with these operations, reply {"ops":[]}.'
  ].join(' ');
  const user = 'Page: ' + page + '\nInstruction: ' + prompt + '\nElements: ' + JSON.stringify(brief);
  const said = await askTheStack(system, user);
  if (!said || !said.text) return null;
  const match = said.text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.ops)) return null;
    return { ops: parsed.ops, via: said.via };
  } catch (e) {
    return null;
  }
}

export default async function (req, res) {
  const body = req.body || {};
  const action = clean(body.action || 'overrides', 12);
  const page = clean(body.page || '/', 200);

  /* The one public action: what a visitor should see. It returns published
     changes and nothing about who made them or what was asked for. */
  if (action === 'overrides') {
    try {
      const { rows } = await db.query(
        "SELECT id, ops FROM page_edits WHERE page = $1 AND state = 'live' ORDER BY id", [page]);
      const ops = [];
      for (const row of rows || []) {
        let parsed = [];
        try { parsed = JSON.parse(row.ops); } catch (e) { parsed = []; }
        for (const op of parsed) ops.push(op);
      }
      return res.json({ ok: true, ops });
    } catch (e) {
      return res.json({ ok: true, ops: [] });
    }
  }

  /* Everything else is behind the publishing passcode, with the same three
     tries and twenty-minute lockout as the other admin doors. */
  const door = await adminDoor(req, clean(body.pass, 120));
  if (!door.ok) return res.status(door.status || 401).json({ error: door.error });

  try {
    if (action === 'draft') {
      const prompt = clean(body.prompt, 600);
      if (!prompt) return res.status(400).json({ error: 'Say what should change inside the box.' });
      const nodes = (Array.isArray(body.nodes) ? body.nodes : []).slice(0, MAX_NODES).map((n) => ({
        ref: clean(n && n.ref, 60),
        kind: clean(n && n.kind, 12) || 'element',
        tag: clean(n && n.tag, 20),
        classes: clean(n && n.classes, 120),
        text: clean(n && n.text, 400)
      })).filter((n) => n.ref);
      if (!nodes.length) {
        return res.status(400).json({ error: 'That box has nothing in it that can be changed.' });
      }
      const allowed = nodes.map((n) => n.ref);

      let source = 'rules';
      let via = '';
      const said = await byModel(prompt, nodes, page);
      let ops = tidyOps(said && said.ops, allowed);
      if (ops.length) { source = 'model'; via = (said && said.via) || ''; }
      if (!ops.length) ops = tidyOps(byRules(prompt, nodes), allowed);

      if (!ops.length) {
        return res.json({
          ok: true, ops: [], source,
          note: 'Nothing could be made of that. Try naming a colour, a size, or the words to use \u2014 ' +
            'for example: make the heading gold, or replace the text with "Life, Love, Magic."'
        });
      }
      return res.json({ ok: true, ops, source, via });
    }

    if (action === 'save') {
      /* One confirmation. The preview is on the page in front of the
         administrator before this is ever called, and anything published
         can be undone from the log. */
      if (clean(body.confirm, 20) !== 'publish') {
        return res.status(400).json({
          error: 'Changes do not take effect until they are confirmed. Nothing has been saved.'
        });
      }
      const prompt = clean(body.prompt, 600);
      const rect = clean(JSON.stringify(body.rect || {}), 300);
      const ops = tidyOps(body.ops, (Array.isArray(body.ops) ? body.ops : []).map((o) => clean(o && o.ref, 60)));
      if (!ops.length) return res.status(400).json({ error: 'There is nothing in that change.' });

      const { rows } = await db.query(
        `INSERT INTO page_edits (page, prompt, rect, ops, source, state, who)
         VALUES ($1,$2,$3,$4,$5,'live',$6) RETURNING id, at`,
        [page, prompt, rect, JSON.stringify(ops), clean(body.source, 12) || 'rules', 'admin']);
      const id = rows && rows[0] && Number(rows[0].id);
      await db.query(
        'INSERT INTO page_edit_log (edit_id, page, action, detail, who) VALUES ($1,$2,$3,$4,$5)',
        [id, page, 'publish', ops.length + ' change(s): ' + prompt, 'admin']).catch(() => {});
      return res.json({ ok: true, id, at: rows && rows[0] && rows[0].at, ops });
    }

    if (action === 'list') {
      const only = clean(body.page, 200);
      const { rows } = only
        ? await db.query(
          'SELECT id, page, prompt, ops, source, state, at, changed_at FROM page_edits WHERE page = $1 ORDER BY id DESC LIMIT 100',
          [only])
        : await db.query(
          'SELECT id, page, prompt, ops, source, state, at, changed_at FROM page_edits ORDER BY id DESC LIMIT 100');
      const { rows: log } = await db.query(
        'SELECT id, edit_id, page, action, detail, at FROM page_edit_log ORDER BY id DESC LIMIT 100');
      return res.json({
        ok: true,
        edits: (rows || []).map((r) => ({
          id: Number(r.id), page: r.page, prompt: r.prompt, state: r.state,
          source: r.source, at: r.at, changed_at: r.changed_at,
          count: (() => { try { return JSON.parse(r.ops).length; } catch (e) { return 0; } })()
        })),
        log: log || []
      });
    }

    if (action === 'undo' || action === 'redo') {
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Which change?' });
      const state = action === 'undo' ? 'undone' : 'live';
      const { rows } = await db.query(
        'UPDATE page_edits SET state = $2, changed_at = NOW() WHERE id = $1 RETURNING page, prompt',
        [id, state]);
      if (!rows || !rows[0]) return res.status(404).json({ error: 'There is no such change.' });
      await db.query(
        'INSERT INTO page_edit_log (edit_id, page, action, detail, who) VALUES ($1,$2,$3,$4,$5)',
        [id, rows[0].page, action, rows[0].prompt, 'admin']).catch(() => {});
      return res.json({ ok: true, id, state });
    }

    return res.status(400).json({ error: 'No such action.' });
  } catch (err) {
    return res.status(500).json({ error: 'The editor could not do that: ' + (err && err.message) });
  }
}
