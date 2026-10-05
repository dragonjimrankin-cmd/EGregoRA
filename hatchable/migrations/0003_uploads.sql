-- Files visitors hand to the oracle: references, notes, transcripts, data.
CREATE TABLE IF NOT EXISTS uploads (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  mime         TEXT,
  kind         TEXT NOT NULL DEFAULT 'text',   -- 'text' | 'image' | 'binary'
  bytes        INTEGER NOT NULL DEFAULT 0,
  chars        INTEGER NOT NULL DEFAULT 0,
  body         TEXT,                            -- extracted plain text, when there is any
  storage_key  TEXT,                            -- object-storage key, for images
  asker_name   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS uploads_created_idx ON uploads (created_at DESC);
