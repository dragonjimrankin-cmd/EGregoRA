-- Artwork for an episode, and images cued to a moment in it. A podcast is
-- sound, but a page is not: a plate that appears when the thing being
-- described is described is worth more than a cover nobody looks at twice.
ALTER TABLE media ADD COLUMN IF NOT EXISTS cover_key TEXT;

CREATE TABLE IF NOT EXISTS media_images (
  id          BIGSERIAL PRIMARY KEY,
  media_id    BIGINT NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  at_seconds  NUMERIC NOT NULL DEFAULT 0,
  storage_key TEXT NOT NULL,
  mime        TEXT,
  caption     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS media_images_for ON media_images (media_id, at_seconds);
