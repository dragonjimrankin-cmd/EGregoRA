-- 0039 · The house shelves, one migration at a time.
--
--   live_cursor   the director's mouse, while a picture is on the live screen
--   code_tries    counted wrong codes, so a six-digit code cannot be guessed
--   upload_knock  a quiet throttle on the oracle's file shelf
--   member_bios   the members' own biographies, waiting on the owner's nod

CREATE TABLE IF NOT EXISTS live_cursor (
  feed_id    BIGINT PRIMARY KEY REFERENCES live_feeds (id) ON DELETE CASCADE,
  x          REAL NOT NULL DEFAULT 0,
  y          REAL NOT NULL DEFAULT 0,
  name       TEXT NOT NULL DEFAULT 'the director',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_tries (
  email TEXT NOT NULL,
  at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS code_tries_at_idx ON code_tries (email, at);

CREATE TABLE IF NOT EXISTS upload_knock (
  ip TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS upload_knock_at_idx ON upload_knock (at);

CREATE TABLE IF NOT EXISTS member_bios (
  member_id    BIGINT PRIMARY KEY REFERENCES members (id) ON DELETE CASCADE,
  display_name TEXT,
  bio          TEXT NOT NULL,
  image_key    TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS member_bios_status_idx ON member_bios (status);