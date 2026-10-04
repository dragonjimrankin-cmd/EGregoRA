-- The Ask Ed mailbag: every question put to the oracle, with the reply it gave.
CREATE TABLE questions (
  id          BIGSERIAL PRIMARY KEY,
  asker_name  TEXT,
  limb        TEXT,
  question    TEXT NOT NULL,
  answer      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX questions_created_at_idx ON questions (created_at DESC);
