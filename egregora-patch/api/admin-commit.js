/**
 * GET/POST /api/admin-commit — public, read-only effective Admin Edit state.
 *
 * Admin Edit Mode stores published operations in the project database so the
 * live page changes immediately. Before either site is deployed again, its
 * GitHub workflow fetches this deterministic snapshot, commits it to the
 * repository, and only then continues to deployment. The export contains no
 * passcodes, prompts, administrator names or audit notes: only page state that
 * is already public to visitors.
 */
import { createHash } from 'node:crypto';
import { db } from 'hatchable';

export const access = 'public';
export const methods = ['GET', 'POST'];

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function parseOps(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? canonical(parsed) : [];
  } catch {
    return [];
  }
}

function dateOnly(value) {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const made = new Date(value);
  return Number.isFinite(made.getTime()) ? made.toISOString().slice(0, 10) : '';
}

async function rows(sql) {
  try {
    const result = await db.query(sql);
    return result && Array.isArray(result.rows) ? result.rows : [];
  } catch {
    /* Older project databases may not yet contain every optional editor
       table. An absent optional table contributes an empty collection. */
    return [];
  }
}

export default async function (_req, res) {
  const editRows = await rows(
    "SELECT id, page, ops FROM page_edits WHERE state = 'live' ORDER BY page, id");
  const sourceRows = await rows(
    'SELECT page, html FROM page_sources ORDER BY page');
  const dateRows = await rows(
    'SELECT page, purported_date FROM page_dates ORDER BY page');

  const effective = canonical({
    dates: dateRows.map((row) => ({
      page: String(row.page || '/'),
      date: dateOnly(row.purported_date)
    })).filter((row) => row.date),
    edits: editRows.map((row) => ({
      id: Number(row.id),
      page: String(row.page || '/'),
      ops: parseOps(row.ops)
    })).filter((row) => Number.isFinite(row.id) && row.ops.length),
    sources: sourceRows.map((row) => ({
      page: String(row.page || '/'),
      html: String(row.html || '')
    })).filter((row) => row.html)
  });
  const encoded = JSON.stringify(effective);
  const digest = createHash('sha256').update(encoded).digest('hex');

  if (typeof res.set === 'function') res.set('cache-control', 'no-store, max-age=0');
  return res.json({
    ok: true,
    kind: 'admin-edit-commit-snapshot',
    schema: 1,
    digest,
    ...effective
  });
}
