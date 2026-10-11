-- Owner mode, the remembered door key, the activity trail and the traffic.
--
-- members gains two columns: privilege (member / admin / owner) and status
-- (active / suspended). A suspended member is refused at every signed-in
-- path, because they all run through whoAmI().
--
-- admin_tokens is the remembered key: a door proved once with the right
-- passcode mints one of these, the browser keeps it in a cookie, and every
-- door on the site stands open for its week without asking again.
--
-- activity_log is the trail the owner reads: one row for anything worth
-- remembering, against a member or on their behalf.
--
-- visits is the house traffic, one row per page load.

ALTER TABLE members ADD COLUMN IF NOT EXISTS privilege text NOT NULL DEFAULT 'member';
ALTER TABLE members ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS admin_tokens (
  token text PRIMARY KEY,
  kind text NOT NULL DEFAULT 'admin',
  member_id bigint REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_tokens_expires_idx ON admin_tokens (expires_at);

CREATE TABLE IF NOT EXISTS activity_log (
  id bigserial PRIMARY KEY,
  member_id bigint,
  actor text NOT NULL DEFAULT 'system',
  action text NOT NULL,
  detail text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_member_idx ON activity_log (member_id, at DESC);
CREATE INDEX IF NOT EXISTS activity_log_at_idx ON activity_log (at DESC);

CREATE TABLE IF NOT EXISTS visits (
  id bigserial PRIMARY KEY,
  path text NOT NULL,
  referrer text,
  agent text,
  member_email text,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visits_at_idx ON visits (at DESC);
CREATE INDEX IF NOT EXISTS visits_path_idx ON visits (path, at DESC);

-- The founder's account holds the owner privilege.
UPDATE members SET privilege = 'owner'
 WHERE email = 'shakradragon@gmail.com' AND privilege = 'member';