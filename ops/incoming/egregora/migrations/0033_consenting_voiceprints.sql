-- Revocable biometric voice templates for the two explicitly consenting
-- podcast speakers. Feature extraction and AES-GCM encryption happen in the
-- administrator's browser; the server stores ciphertext, never raw embeddings
-- or extra audio. These templates label podcast turns and are not accepted as
-- authentication credentials.
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
  CHECK (name IN ('Edward Gregory', 'Jim Rankin')),
  CHECK (sample_seconds > 0 AND sample_seconds <= 180),
  CHECK (sample_frames > 0 AND sample_frames <= 10000)
);

-- The audit deliberately contains no template, embedding, audio, passcode or
-- reusable biometric measurement. Deletion removes the encrypted template but
-- retains evidence that consent/revocation controls were exercised.
CREATE TABLE IF NOT EXISTS voiceprint_audit (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  action           TEXT NOT NULL,
  media_id         BIGINT REFERENCES media(id) ON DELETE SET NULL,
  who              TEXT NOT NULL,
  detail           TEXT,
  at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS voiceprint_audit_name
  ON voiceprint_audit (name, id DESC);