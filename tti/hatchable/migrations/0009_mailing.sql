-- The order's mailing list. Everyone who joins is on it; leaving takes one click.
ALTER TABLE members ADD COLUMN IF NOT EXISTS subscribed      BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS unsub_token     TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS subscribed_at   TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS welcomed        BOOLEAN NOT NULL DEFAULT FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS members_unsub_idx ON members (unsub_token);

-- Every dispatch sent, and to how many.
CREATE TABLE IF NOT EXISTS dispatches (
  id         BIGSERIAL PRIMARY KEY,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  sent       INT NOT NULL DEFAULT 0,
  failed     INT NOT NULL DEFAULT 0,
  test_only  BOOLEAN NOT NULL DEFAULT FALSE,
  sent_by    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
