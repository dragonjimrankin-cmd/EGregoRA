-- The live room, on air in both houses at once.
--
-- A feed opened on one side is opened on the other, and the two-second
-- segments are relayed as they are recorded, so a watcher on either site is
-- watching the same broadcast a few seconds behind the camera — not being
-- handed a link to somewhere else.
--
-- twin_key is the identity both houses share for one feed. It survives either
-- side renumbering, which the local id does not. twin_origin marks a feed
-- that arrived from the twin; such a feed is never relayed back, or the two
-- rooms would announce each other's segments until the queues were full of
-- echoes.
--
-- The watchword itself never crosses. Both houses salt the hash with the same
-- fixed string, so sending word_hash is enough for a watcher on the other
-- side to be let in with the same word.

ALTER TABLE live_feeds ADD COLUMN IF NOT EXISTS twin_key    TEXT;
ALTER TABLE live_feeds ADD COLUMN IF NOT EXISTS twin_origin TEXT;

-- One shared identity per feed, where one exists.
CREATE UNIQUE INDEX IF NOT EXISTS live_feeds_twin_key_uniq
  ON live_feeds (twin_key) WHERE twin_key IS NOT NULL;
