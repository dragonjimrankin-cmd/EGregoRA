-- Money: the shop's ledger, paid memberships, and donations.
--
-- TTI already had shop_orders, from the day the shop opened — but nothing was
-- charged, and the confirmation said the payment link would go out by hand.
-- These columns are what turns that into a checkout: an order is written first,
-- the Stripe session is attached to it, and the payment lands on it afterwards.
-- The table is created here too, so EGregoRA gets the same shelf without a
-- second, differently-shaped copy of the idea.
--
-- payment_state moves forward only in code, never by default: an order starts
-- 'awaiting' and becomes 'paid' when Stripe says the money arrived, which is
-- checked against Stripe rather than believed from the browser.

CREATE TABLE IF NOT EXISTS shop_orders (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ref          TEXT NOT NULL UNIQUE,
  product_key  TEXT NOT NULL,
  product_name TEXT NOT NULL,
  qty          INTEGER NOT NULL CHECK (qty BETWEEN 1 AND 10),
  unit_price   NUMERIC(8,2) NOT NULL,
  total        NUMERIC(8,2) NOT NULL,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS shop_orders_email_idx ON shop_orders (email, created_at);

ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS stripe_session TEXT;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS stripe_intent  TEXT;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS payment_state  TEXT NOT NULL DEFAULT 'awaiting';
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS paid_at        TIMESTAMPTZ;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS amount_paid    NUMERIC(8,2);
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS house          TEXT;

CREATE INDEX IF NOT EXISTS shop_orders_session_idx ON shop_orders (stripe_session);
CREATE INDEX IF NOT EXISTS shop_orders_state_idx ON shop_orders (payment_state);

-- Paid membership. What a member gets for it is a separate decision; this is
-- the record that they paid, when, and until when.
CREATE TABLE IF NOT EXISTS memberships (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email              TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL DEFAULT '',
  tier               TEXT NOT NULL,
  amount             NUMERIC(8,2) NOT NULL,
  interval           TEXT NOT NULL DEFAULT 'month',
  stripe_session     TEXT,
  stripe_customer    TEXT,
  stripe_sub         TEXT,
  state              TEXT NOT NULL DEFAULT 'awaiting',  -- awaiting|active|past_due|cancelled
  period_end         TIMESTAMPTZ,
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS memberships_state_idx ON memberships (state);
CREATE INDEX IF NOT EXISTS memberships_sub_idx ON memberships (stripe_sub);

-- Given freely, once. No tiers, no renewal: the giver sets the amount.
CREATE TABLE IF NOT EXISTS donations (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email          TEXT NOT NULL,
  name           TEXT NOT NULL DEFAULT '',
  amount         NUMERIC(8,2) NOT NULL,
  message        TEXT NOT NULL DEFAULT '',
  stripe_session TEXT,
  stripe_intent  TEXT,
  state          TEXT NOT NULL DEFAULT 'awaiting',   -- awaiting|paid|failed
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS donations_session_idx ON donations (stripe_session);

-- Stripe sends the same event more than once, and says so in its own docs.
-- Every event handled is remembered by its id, so a repeat is a no-op rather
-- than a second paid order.
CREATE TABLE IF NOT EXISTS stripe_events (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL,
  handled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
