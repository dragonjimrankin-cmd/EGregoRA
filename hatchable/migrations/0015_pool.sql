-- Health memory for every credential and worker the render pool can use.
-- A route that has just failed is put on a short cooldown rather than being
-- forgotten, so the next request skips it instead of waiting for it to fail
-- again, and so the control endpoint can show which account is sulking.
CREATE TABLE IF NOT EXISTS provider_health (
  provider        TEXT        NOT NULL,
  account         TEXT        NOT NULL,
  fails           INTEGER     NOT NULL DEFAULT 0,
  successes       INTEGER     NOT NULL DEFAULT 0,
  last_error      TEXT,
  last_ok         TIMESTAMPTZ,
  last_try        TIMESTAMPTZ,
  cooldown_until  TIMESTAMPTZ,
  PRIMARY KEY (provider, account)
);
CREATE INDEX IF NOT EXISTS provider_health_cool ON provider_health (provider, cooldown_until);

-- Which Google account a Colab worker belongs to, so the pool can spread
-- work across accounts rather than hammering whichever one registered first.
ALTER TABLE colab_workers ADD COLUMN IF NOT EXISTS account TEXT;
ALTER TABLE colab_workers ADD COLUMN IF NOT EXISTS fails INTEGER NOT NULL DEFAULT 0;
