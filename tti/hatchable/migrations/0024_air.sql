-- Whether the order considers itself on air at all. One row, because there
-- is one house: the broadcaster flips it, and every watcher's page reads it
-- so an empty schedule looks deliberate rather than broken.
CREATE TABLE IF NOT EXISTS live_air (
  only_row BOOLEAN PRIMARY KEY DEFAULT TRUE,
  on_air   BOOLEAN NOT NULL DEFAULT FALSE,
  note     TEXT NOT NULL DEFAULT '',
  back_at  TEXT NOT NULL DEFAULT '',
  at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT live_air_one CHECK (only_row)
);

INSERT INTO live_air (only_row, on_air) VALUES (TRUE, FALSE)
  ON CONFLICT (only_row) DO NOTHING;
