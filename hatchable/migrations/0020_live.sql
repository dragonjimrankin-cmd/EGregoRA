-- Live feeds: the order broadcasting from a camera, watched by signed-up
-- members who hold the watchword for that feed.
--
-- A feed is a run of short recorded segments rather than a true stream.
-- There is no media server here, so the camera records two seconds at a
-- time and the watchers play the segments as they land, a few seconds
-- behind. The first segment carries the format header and is kept for as
-- long as the feed runs; the rest are swept once they are old enough that
-- nobody could still be watching them.
CREATE TABLE IF NOT EXISTS live_feeds (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  note       TEXT,
  word_hash  TEXT NOT NULL,              -- the watchword, hashed
  mime       TEXT,
  state      TEXT NOT NULL DEFAULT 'live',   -- live | ended
  seq        INTEGER NOT NULL DEFAULT 0,
  watchers   INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  beat_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS live_feeds_state ON live_feeds (state, started_at DESC);

CREATE TABLE IF NOT EXISTS live_chunks (
  id      BIGSERIAL PRIMARY KEY,
  feed_id BIGINT NOT NULL REFERENCES live_feeds (id) ON DELETE CASCADE,
  seq     INTEGER NOT NULL,
  is_head BOOLEAN NOT NULL DEFAULT FALSE,
  part    TEXT NOT NULL,
  at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS live_chunks_one ON live_chunks (feed_id, seq);
CREATE INDEX IF NOT EXISTS live_chunks_age ON live_chunks (feed_id, at);
