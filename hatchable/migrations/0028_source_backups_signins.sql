-- Saved page sources (Admin Edit Mode's Source tab), the backups that every
-- publish and every source save leaves behind, and the sign-in ledger.

CREATE TABLE IF NOT EXISTS page_sources (
  page       TEXT PRIMARY KEY,
  html       TEXT NOT NULL,
  who        TEXT,
  at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_backups (
  id     SERIAL PRIMARY KEY,
  page   TEXT NOT NULL,
  kind   TEXT NOT NULL,              -- 'ops' | 'source'
  before TEXT NOT NULL,              -- previous source html ('' = the built page) or the live ops snapshot
  detail TEXT,
  who    TEXT,
  at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS page_backups_page ON page_backups (page, id DESC);

CREATE TABLE IF NOT EXISTS signins (
  id    SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  name  TEXT,
  how   TEXT,
  at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
