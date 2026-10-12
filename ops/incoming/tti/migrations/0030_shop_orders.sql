-- 0030: the shop's ledger — orders are written here the moment they are made.
-- Products live on the page (public/shop/index.html) and in api/shop.js's
-- SHELF constant; the database keeps what was ordered, so it cannot be lost.

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