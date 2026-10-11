-- Named voices and compact linguistic speaking-pattern summaries for podcast
-- transcripts. The profile deliberately stores aggregate cadence and wording
-- statistics, not audio, clips, or a reversible biometric voiceprint.
CREATE TABLE IF NOT EXISTS media_speakers (
  media_id       BIGINT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  speaker_no     INTEGER NOT NULL CHECK (speaker_no > 0 AND speaker_no < 20),
  name           TEXT NOT NULL,
  profiled_chars INTEGER,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (media_id, speaker_no)
);

CREATE TABLE IF NOT EXISTS speaker_profiles (
  name            TEXT PRIMARY KEY,
  patterns        TEXT NOT NULL DEFAULT '{}',
  sample_words    INTEGER NOT NULL DEFAULT 0,
  source_media_id BIGINT REFERENCES media(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The latest uploaded podcast was identified by the administrators: voice 1
-- is Edward Gregory and voice 2 is Jim Rankin. Keep the association beside
-- that episode; the API derives and stores their aggregate speaking patterns
-- from its existing labelled transcript.
WITH latest AS (
  SELECT id FROM media
   WHERE kind = 'audio' AND state = 'published'
   ORDER BY created_at DESC, id DESC
   LIMIT 1
), named(speaker_no, name) AS (
  VALUES (1, 'Edward Gregory'), (2, 'Jim Rankin')
)
INSERT INTO media_speakers (media_id, speaker_no, name)
SELECT latest.id, named.speaker_no, named.name
  FROM latest CROSS JOIN named
ON CONFLICT (media_id, speaker_no) DO UPDATE
  SET name = EXCLUDED.name, profiled_chars = NULL, updated_at = NOW();