-- Extend the consented voiceprint registry beyond the two founding podcast
-- speakers. Edward Gregory and Jim Rankin remain first-class matching targets,
-- while any further person may be enrolled only through the same explicit
-- consent, encryption, audit and revocation controls.
ALTER TABLE speaker_voiceprints
  DROP CONSTRAINT IF EXISTS speaker_voiceprints_name_check;

-- Names remain unique and non-generic at the API boundary. This index makes
-- case-only duplicate enrollment impossible as the registry grows.
CREATE UNIQUE INDEX IF NOT EXISTS speaker_voiceprints_name_ci
  ON speaker_voiceprints (LOWER(name));