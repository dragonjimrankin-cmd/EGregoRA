-- 0028: the forum mirror. The threads themselves live in the EGregoRA
-- project; this side only needs the profile shelf, so a member's chosen
-- face and words can be mirrored here and vouched through the signed
-- whois door when they post in the shared room.

CREATE TABLE IF NOT EXISTS forum_profiles (
  member_id    BIGINT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  display_name TEXT,
  bio          TEXT,                 -- 400 words at most, enforced in the api
  avatar_key   TEXT,                 -- storage key; served signed
  home         TEXT NOT NULL DEFAULT 'two-infinities',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE members ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'human';
