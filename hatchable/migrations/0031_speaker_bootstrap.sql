-- One guarded attempt may ask the configured speech provider to recover the
-- missing transcript of the already named latest podcast. This marker makes
-- the public, idempotent bootstrap incapable of becoming a general free STT
-- proxy or of spending repeatedly.
ALTER TABLE media ADD COLUMN IF NOT EXISTS speaker_bootstrap_at TIMESTAMPTZ;
ALTER TABLE media ADD COLUMN IF NOT EXISTS speaker_bootstrap_status TEXT;