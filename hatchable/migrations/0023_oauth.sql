-- Signing in with an account you already have. The state row is a one-shot
-- ticket: it is written when the visitor leaves for the provider and deleted
-- the moment they come back, so a callback can never be replayed.
CREATE TABLE IF NOT EXISTS oauth_states (
  state      TEXT PRIMARY KEY,
  provider   TEXT NOT NULL,
  verifier   TEXT,
  back       TEXT,
  made_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Which outside account belongs to which member. Kept so a person who signs
-- in with Google today and GitHub tomorrow lands on the same account, and so
-- an identity can be disowned later without deleting the member.
CREATE TABLE IF NOT EXISTS oauth_identities (
  id        BIGSERIAL PRIMARY KEY,
  provider  TEXT NOT NULL,
  subject   TEXT NOT NULL,
  member_id BIGINT NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  handle    TEXT,
  made_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS oauth_identities_one ON oauth_identities (provider, subject);
CREATE INDEX IF NOT EXISTS oauth_identities_member ON oauth_identities (member_id);
