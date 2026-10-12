-- 0031 · Bring this house's media shelf up to the same shape as its twin's.
--
-- The podcast and films sections are being cloned across from EGregoRA so the
-- two houses can publish as one. That editor expects tables and columns this
-- project never had. Rather than replay eight of the twin's migrations in
-- order — one of which empties a podcast shelf — the whole gap is closed here
-- in one idempotent step, so re-running it is harmless.
--
-- The two founding speakers named in the voiceprint registry are the same two
-- people on both sides of the mirror, so that constraint carries over as it
-- stands; 0034 on the twin relaxes it, and the same relaxation is applied
-- below rather than left as a difference between the houses.

-- ------------------------------------------------------------ missing tables

CREATE TABLE IF NOT EXISTS creation_date_log (
  id              BIGSERIAL PRIMARY KEY,
  scope           TEXT NOT NULL,             -- page | media
  object_key      TEXT NOT NULL,
  previous_date   DATE,
  purported_date  DATE,                      -- NULL means the claim was cleared
  who             TEXT,
  at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_speakers (
  media_id       BIGINT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  speaker_no     INTEGER NOT NULL CHECK (speaker_no > 0 AND speaker_no < 20),
  name           TEXT NOT NULL,
  profiled_chars INTEGER,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (media_id, speaker_no)
);

CREATE TABLE IF NOT EXISTS media_subtitles (
  media_id   BIGINT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  lang       TEXT   NOT NULL,
  lines      TEXT   NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (media_id, lang)
);

CREATE TABLE IF NOT EXISTS speaker_profiles (
  name            TEXT PRIMARY KEY,
  patterns        TEXT NOT NULL DEFAULT '{}',
  sample_words    INTEGER NOT NULL DEFAULT 0,
  source_media_id BIGINT REFERENCES media(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS speaker_voiceprints (
  name             TEXT PRIMARY KEY,
  ciphertext       TEXT NOT NULL,
  salt             TEXT NOT NULL,
  iv               TEXT NOT NULL,
  kdf              TEXT NOT NULL,
  kdf_iterations   INTEGER NOT NULL,
  cipher           TEXT NOT NULL,
  feature_version  TEXT NOT NULL,
  sample_seconds   REAL NOT NULL,
  sample_frames    INTEGER NOT NULL,
  source_media_id  BIGINT REFERENCES media(id) ON DELETE SET NULL,
  consented_at     TIMESTAMPTZ NOT NULL,
  consented_by     TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (sample_seconds > 0 AND sample_seconds <= 180),
  CHECK (sample_frames > 0 AND sample_frames <= 10000)
);

CREATE TABLE IF NOT EXISTS voiceprint_audit (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  action           TEXT NOT NULL,
  media_id         BIGINT REFERENCES media(id) ON DELETE SET NULL,
  who              TEXT NOT NULL,
  detail           TEXT,
  at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* The owner's vault, so a save on this side is recorded here exactly as it is
   on the twin. Rows carry the storage key rather than pointing at the shelf. */
CREATE TABLE IF NOT EXISTS owner_archive (
  id          bigserial PRIMARY KEY,
  media_id    bigint REFERENCES media (id) ON DELETE SET NULL,
  kind        text NOT NULL DEFAULT 'audio',
  title       text NOT NULL,
  storage_key text,
  mime        text,
  bytes       bigint,
  seconds     integer,
  state       text NOT NULL DEFAULT 'published',
  did         text NOT NULL DEFAULT 'saved',
  note        text NOT NULL DEFAULT '',
  saved_by    text NOT NULL DEFAULT '',
  saved_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS owner_archive_at_idx ON owner_archive (saved_at DESC);
CREATE INDEX IF NOT EXISTS owner_archive_media_idx ON owner_archive (media_id);

-- ---------------------------------------------------------- missing columns

ALTER TABLE media ADD COLUMN IF NOT EXISTS purported_date DATE;
ALTER TABLE media ADD COLUMN IF NOT EXISTS speaker_bootstrap_at TIMESTAMPTZ;
ALTER TABLE media ADD COLUMN IF NOT EXISTS speaker_bootstrap_status TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS speaker_bootstrap_fallback_at TIMESTAMPTZ;

-- ------------------------------------------------- the twin's relaxations

ALTER TABLE speaker_voiceprints
  DROP CONSTRAINT IF EXISTS speaker_voiceprints_name_check;
CREATE UNIQUE INDEX IF NOT EXISTS speaker_voiceprints_name_ci
  ON speaker_voiceprints (LOWER(name));

CREATE INDEX IF NOT EXISTS media_purported_date_idx ON media (purported_date);
CREATE INDEX IF NOT EXISTS voiceprint_audit_name_idx ON voiceprint_audit (name, at DESC);
