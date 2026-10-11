-- Administrators may change the date a page or published recording purports
-- to have been created. The actual database creation timestamps stay intact:
-- these are presentation/metadata claims, with their own append-only audit.
CREATE TABLE IF NOT EXISTS page_dates (
  page            TEXT PRIMARY KEY,
  purported_date  DATE NOT NULL,
  who             TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE media ADD COLUMN IF NOT EXISTS purported_date DATE;
CREATE INDEX IF NOT EXISTS media_purported_date_idx
  ON media (kind, purported_date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS creation_date_log (
  id              BIGSERIAL PRIMARY KEY,
  scope           TEXT NOT NULL,             -- page | media
  object_key      TEXT NOT NULL,
  previous_date   DATE,
  purported_date  DATE,                      -- NULL means the claim was cleared
  who             TEXT,
  at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS creation_date_log_object
  ON creation_date_log (scope, object_key, id DESC);
