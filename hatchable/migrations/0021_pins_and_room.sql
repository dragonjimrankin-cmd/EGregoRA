-- Up to three episodes or films held at the top of their page.
ALTER TABLE media ADD COLUMN IF NOT EXISTS pinned INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS media_pinned_idx ON media (kind, pinned DESC, created_at DESC);

-- The live room: members who are in it, what they are allowed to do, and
-- what they have said. A member who joins with their own camera gets a feed
-- of their own, hung off the broadcaster's as a child.
ALTER TABLE live_feeds ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES live_feeds (id) ON DELETE CASCADE;
ALTER TABLE live_feeds ADD COLUMN IF NOT EXISTS who TEXT;
CREATE INDEX IF NOT EXISTS live_feeds_parent ON live_feeds (parent_id, state);

CREATE TABLE IF NOT EXISTS live_people (
  id         BIGSERIAL PRIMARY KEY,
  feed_id    BIGINT NOT NULL REFERENCES live_feeds (id) ON DELETE CASCADE,
  member_id  BIGINT,
  who        TEXT NOT NULL,
  can_chat   BOOLEAN NOT NULL DEFAULT TRUE,
  can_cam    BOOLEAN NOT NULL DEFAULT FALSE,
  blocked    BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS live_people_one ON live_people (feed_id, member_id);

CREATE TABLE IF NOT EXISTS live_chat (
  id        BIGSERIAL PRIMARY KEY,
  feed_id   BIGINT NOT NULL REFERENCES live_feeds (id) ON DELETE CASCADE,
  member_id BIGINT,
  who       TEXT NOT NULL,
  body      TEXT NOT NULL,
  is_order  BOOLEAN NOT NULL DEFAULT FALSE,
  hidden    BOOLEAN NOT NULL DEFAULT FALSE,
  at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS live_chat_feed ON live_chat (feed_id, id);
