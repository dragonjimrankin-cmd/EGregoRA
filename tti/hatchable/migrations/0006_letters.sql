-- Letters written to Ed directly, and the record of the acknowledgement sent back.
CREATE TABLE IF NOT EXISTS letters (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  topic       TEXT,
  question    TEXT NOT NULL,
  publicity   TEXT,
  reference   TEXT UNIQUE,
  autoreplied BOOLEAN DEFAULT FALSE,
  forwarded   BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS letters_email_idx ON letters (email);
CREATE INDEX IF NOT EXISTS letters_created_idx ON letters (created_at DESC);
