-- The elemental phase a member's integral is aligned with, declared at the
-- door of a feed, and the microphone override that goes with the camera one.
ALTER TABLE live_people ADD COLUMN IF NOT EXISTS element TEXT;
ALTER TABLE live_people ADD COLUMN IF NOT EXISTS can_mic BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS live_people_element ON live_people (feed_id, element);

-- The archive. A feed's segments are still deleted when it ends, because
-- they are a transport format and not a recording; what is kept is the
-- programme the broadcaster recorded alongside them, filed in a folder.
CREATE TABLE IF NOT EXISTS live_tapes (
  id       BIGSERIAL PRIMARY KEY,
  feed_id  BIGINT,
  folder   TEXT NOT NULL,
  name     TEXT NOT NULL,
  title    TEXT NOT NULL,
  store    TEXT NOT NULL,
  mime     TEXT NOT NULL DEFAULT 'video/webm',
  bytes    BIGINT NOT NULL DEFAULT 0,
  seconds  INTEGER NOT NULL DEFAULT 0,
  at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS live_tapes_folder ON live_tapes (folder, at DESC);
