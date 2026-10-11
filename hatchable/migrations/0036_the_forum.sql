-- 0036: the shared forum, and the account centre's profile shelf.
--
-- One forum for both houses. It lives in this project's database; the twin
-- site renders the same threads by calling this project's /api/forum, and
-- its members post with tokens this project verifies through the twin's
-- signed whois door. Authors are therefore snapshotted onto each post: a
-- member of either house, an oracle (Gink, ShakDrah), or one of the four
-- construct-moderators the order enrolled at the founding of the room.

CREATE TABLE IF NOT EXISTS forum_threads (
  id          TEXT PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text)),
  title       TEXT NOT NULL,
  blurb       TEXT,
  author_kind TEXT NOT NULL DEFAULT 'member',   -- member | oracle | bot
  author_id   BIGINT,                            -- members.id when a member
  author_name TEXT NOT NULL,
  author_home TEXT NOT NULL DEFAULT 'egregora',  -- egregora | two-infinities
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  locked      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id            BIGSERIAL PRIMARY KEY,
  thread_id     TEXT NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_kind   TEXT NOT NULL DEFAULT 'member',
  author_id     BIGINT,
  author_name   TEXT NOT NULL,
  author_home   TEXT NOT NULL DEFAULT 'egregora',
  author_avatar TEXT,                            -- signed url or static path
  author_tag    TEXT,                            -- badge: oracle / moderator / twin
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS forum_posts_thread ON forum_posts(thread_id, created_at);

-- The account centre's shelf: what a member chooses to show of themselves.
CREATE TABLE IF NOT EXISTS forum_profiles (
  member_id    BIGINT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  display_name TEXT,
  bio          TEXT,                 -- 400 words at most, enforced in the api
  avatar_key   TEXT,                 -- storage key; served signed
  home         TEXT NOT NULL DEFAULT 'egregora',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bots are enrolled members, plainly marked as constructs.
ALTER TABLE members ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'human';
