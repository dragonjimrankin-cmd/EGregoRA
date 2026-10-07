-- The order's own ledger of what the five Free.ai doors have spent.
-- Free.ai publishes no balance endpoint, so the allowance shown in the
-- admin panel is counted here from each response's free_ai_usage block.
CREATE TABLE IF NOT EXISTS freeai_use (
  slot       SMALLINT NOT NULL,
  day        DATE NOT NULL,
  month      TEXT NOT NULL DEFAULT '',
  tokens     BIGINT NOT NULL DEFAULT 0,
  videos     INTEGER NOT NULL DEFAULT 0,
  images     INTEGER NOT NULL DEFAULT 0,
  requests   INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL DEFAULT '',
  at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (slot, day)
);
CREATE INDEX IF NOT EXISTS freeai_use_month ON freeai_use (month, slot);
