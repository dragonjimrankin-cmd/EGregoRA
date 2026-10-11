-- The configured speech provider accepted the first diarization request but
-- returned timestamped segments without speaker labels. Allow exactly one additional
-- recovery call for that recorded outcome so the existing pause/dialogue-turn
-- fallback can consume a fresh response. This remains a narrow, latest-media
-- bootstrap marker; it is not a reusable transcription allowance.
ALTER TABLE media ADD COLUMN IF NOT EXISTS speaker_bootstrap_fallback_at TIMESTAMPTZ;
