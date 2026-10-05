-- The gate-word: a short-lived challenge the asker must read and type back.
CREATE TABLE IF NOT EXISTS captchas (
  token      TEXT PRIMARY KEY,
  answer     TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'word',
  attempts   INT NOT NULL DEFAULT 0,
  used_at    TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS captchas_expiry_idx ON captchas (expires_at);
