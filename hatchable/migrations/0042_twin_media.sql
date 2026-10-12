-- The podcast and films shelves as one shelf across the two houses.
--
-- The two projects keep separate databases and separate storage. A recording
-- is stored once, on the house it was published from, and the twin holds a
-- listing that points at it: so publishing on one side publishes on both, a
-- title changed on either side is changed on both, and neither shelf shows a
-- file the other has taken down.
--
--   twin_key    a stable identity for the episode, shared by both rows. It is
--               minted by the house that publishes first and never changes, so
--               the pair can be found again after either id is renumbered.
--   twin_origin which house holds the bytes, or NULL when this house does.
--   remote_url  where to play it from when twin_origin is set. It points at the
--               origin house's own /api/media-file endpoint rather than at a
--               signed store link, because those expire in a week and a shelf
--               that went quiet on a Tuesday is worse than one that admits it.

ALTER TABLE media ADD COLUMN IF NOT EXISTS twin_key TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS twin_origin TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS remote_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS media_twin_key_idx ON media (twin_key)
  WHERE twin_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS media_twin_origin_idx ON media (twin_origin)
  WHERE twin_origin IS NOT NULL;
