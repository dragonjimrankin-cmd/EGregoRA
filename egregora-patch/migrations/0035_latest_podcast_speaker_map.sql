-- The currently latest published podcast was uploaded after the original 0029
-- one-time mapping migration had run. The administrators have explicitly
-- identified its transcript numbering: Speaker 1 is Edward Gregory and
-- Speaker 2 is Jim Rankin. Refresh only that single latest published episode;
-- no future upload is labelled automatically and no identity is inferred.
WITH latest AS (
  SELECT id
    FROM media
   WHERE kind = 'audio' AND state = 'published'
   ORDER BY created_at DESC, id DESC
   LIMIT 1
), declared(speaker_no, name) AS (
  VALUES (1, 'Edward Gregory'), (2, 'Jim Rankin')
)
INSERT INTO media_speakers (media_id, speaker_no, name, profiled_chars, updated_at)
SELECT latest.id, declared.speaker_no, declared.name, NULL, NOW()
  FROM latest CROSS JOIN declared
ON CONFLICT (media_id, speaker_no) DO UPDATE
  SET name = EXCLUDED.name,
      profiled_chars = NULL,
      updated_at = NOW();
