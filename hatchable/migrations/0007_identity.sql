-- Age and identity checks, required before the image and video studio opens.
ALTER TABLE members ADD COLUMN IF NOT EXISTS legal_name    TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS dob           DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS country       TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS id_doc_type   TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS id_doc_key    TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS id_status     TEXT NOT NULL DEFAULT 'none';
ALTER TABLE members ADD COLUMN IF NOT EXISTS age_verified  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS verified_at   TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS declared_ip   TEXT;

-- Every check, kept as an audit trail rather than overwritten in place.
CREATE TABLE IF NOT EXISTS identity_checks (
  id         BIGSERIAL PRIMARY KEY,
  member_id  BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  outcome    TEXT NOT NULL,
  age_years  INT,
  doc_type   TEXT,
  doc_key    TEXT,
  note       TEXT,
  ip         TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS identity_member_idx ON identity_checks (member_id);
