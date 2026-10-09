-- One membership across EGregoRA and The Two Infinities. The two projects keep
-- separate databases; this column records when a member was last mirrored to
-- the other one, so a failed mirror can be spotted rather than guessed at.

ALTER TABLE members ADD COLUMN IF NOT EXISTS twin_synced_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS members_twin_sync ON members (twin_synced_at);
