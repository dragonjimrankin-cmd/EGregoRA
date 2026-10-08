-- API tokens: keys another agent can use to drive this project from outside.
-- Only the SHA-256 of a token is stored; the token itself is shown once, when
-- it is issued.
CREATE TABLE IF NOT EXISTS api_tokens (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL,
  scope      TEXT NOT NULL DEFAULT 'control',
  uses       INTEGER NOT NULL DEFAULT 0,
  last_used  TIMESTAMPTZ,
  last_action TEXT,
  revoked    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- JIM1 — issued for Jim Rankin, co-founder, so other chats can drive the site.
INSERT INTO api_tokens (name, token_hash, scope)
VALUES ('JIM1', '9d7bccc034d0df1abbadfaedeedc6857b7e1b0297ec940c73a97c6bb42f853ef', 'control')
ON CONFLICT (name) DO NOTHING;
