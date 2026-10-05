-- Accounts for the order: passwordless email verification, plus passkeys
-- (Face ID, Touch ID, Windows Hello, Android biometrics) as a second way in.

CREATE TABLE IF NOT EXISTS members (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS member_codes (
  id          BIGSERIAL PRIMARY KEY,
  member_id   BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  purpose     TEXT NOT NULL DEFAULT 'verify',
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS member_codes_lookup ON member_codes (member_id, purpose, used_at);

CREATE TABLE IF NOT EXISTS member_sessions (
  token       TEXT PRIMARY KEY,
  member_id   BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  method      TEXT NOT NULL DEFAULT 'email',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS member_passkeys (
  id          BIGSERIAL PRIMARY KEY,
  member_id   BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  cred_id     TEXT NOT NULL UNIQUE,
  public_key  TEXT NOT NULL,            -- base64url SPKI
  label       TEXT,
  sign_count  BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS member_passkeys_member ON member_passkeys (member_id);

CREATE TABLE IF NOT EXISTS member_challenges (
  challenge   TEXT PRIMARY KEY,
  member_id   BIGINT REFERENCES members(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,            -- 'register' | 'login'
  expires_at  TIMESTAMPTZ NOT NULL
);
