-- Colab workers: a notebook running on somebody's Google account announces
-- itself here with the public URL of its tunnel, and heartbeats while alive.
CREATE TABLE IF NOT EXISTS colab_workers (
  id         SERIAL PRIMARY KEY,
  label      TEXT NOT NULL,
  endpoint   TEXT NOT NULL UNIQUE,
  gpu        TEXT,
  account    TEXT,
  jobs       INTEGER NOT NULL DEFAULT 0,
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS colab_workers_seen ON colab_workers (last_seen DESC);
