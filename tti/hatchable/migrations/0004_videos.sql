-- Short 480p clips the oracle generates with HunyuanVideo 1.5.
CREATE TABLE IF NOT EXISTS videos (
  id           BIGSERIAL PRIMARY KEY,
  prompt       TEXT NOT NULL,
  provider     TEXT NOT NULL DEFAULT 'fal',
  model        TEXT,
  request_id   TEXT,
  status_url   TEXT,
  response_url TEXT,
  status       TEXT NOT NULL DEFAULT 'queued',   -- queued | running | ready | failed
  url          TEXT,
  storage_key  TEXT,
  error        TEXT,
  asker_name   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS videos_created_idx ON videos (created_at DESC);
