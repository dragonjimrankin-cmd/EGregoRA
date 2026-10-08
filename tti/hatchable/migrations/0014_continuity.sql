-- Continuity and progress for generated frames and clips.
--
-- sheet      the continuity sheet (characters, setting, camera, light, style)
--            carried from the shot this one was extended from, as JSON text
-- parent_id  the generation this one continues
-- seed       the same noise as the parent, so the world does not change
-- init_url   the frame handed to the model as the first frame, where the
--            route supports image-to-video
-- progress   0-100, last known, so a reloaded page does not start at zero
-- hardware   which GPU is actually doing the work, in plain words
ALTER TABLE videos ADD COLUMN IF NOT EXISTS sheet     TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS parent_id BIGINT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS seed      BIGINT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS init_url  TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS progress  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS hardware  TEXT;
