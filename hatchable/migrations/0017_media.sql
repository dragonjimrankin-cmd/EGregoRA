-- Episodes and films uploaded through the Admin Only doors on /podcast/ and
-- /videos/, rather than committed as files. The master is held in the
-- project's object storage; this table is the catalogue in front of it.
CREATE TABLE IF NOT EXISTS media (
  id           BIGSERIAL PRIMARY KEY,
  kind         TEXT NOT NULL,                     -- 'audio' | 'video'
  title        TEXT NOT NULL,
  summary      TEXT,
  number       TEXT,                              -- episode number, for audio
  length_text  TEXT,                              -- '1h 04m', written out
  seconds      INTEGER,
  tags         TEXT,                              -- comma separated, as typed
  storage_key  TEXT,
  mime         TEXT,
  bytes        BIGINT,
  original_bytes BIGINT,
  treatment    TEXT,                              -- what the enhancer did
  state        TEXT NOT NULL DEFAULT 'draft',     -- draft | published
  who          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS media_kind_idx ON media (kind, state, created_at DESC);

-- A browser cannot hand a whole hour of audio over in one request, so an
-- upload arrives in pieces and is put together when the last one lands.
CREATE TABLE IF NOT EXISTS media_chunks (
  id        BIGSERIAL PRIMARY KEY,
  upload_id TEXT NOT NULL,
  seq       INTEGER NOT NULL,
  part      TEXT NOT NULL,                        -- base64
  at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS media_chunks_one ON media_chunks (upload_id, seq);
CREATE INDEX IF NOT EXISTS media_chunks_age ON media_chunks (at);
