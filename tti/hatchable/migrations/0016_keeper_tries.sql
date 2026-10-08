-- The keeper's door remembers who has been knocking.
--
-- Three wrong keys from one browser and the door will not open again for
-- twenty minutes, however many times it is tried. The row is keyed on a
-- hash of the address and the browser's own signature, so one person
-- guessing cannot lock out another.
CREATE TABLE IF NOT EXISTS keeper_tries (
  who        TEXT PRIMARY KEY,
  fails      INTEGER NOT NULL DEFAULT 0,
  locked_at  TIMESTAMPTZ,
  last_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
