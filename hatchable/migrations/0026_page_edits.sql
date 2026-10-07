-- Admin Edit Mode: what was changed on a page, by whom, and in what words.
--
-- Every published change is one row of ops here, and nothing is ever
-- deleted — an undone change keeps its row and flips its state, so the
-- history reads forwards and backwards and a change can be brought back as
-- easily as it was taken away.
CREATE TABLE IF NOT EXISTS page_edits (
  id      SERIAL PRIMARY KEY,
  page    TEXT NOT NULL,                       -- '/cosmic-ledger/'
  prompt  TEXT NOT NULL DEFAULT '',            -- what was asked for, verbatim
  rect    TEXT NOT NULL DEFAULT '',            -- the selection, as JSON
  ops     TEXT NOT NULL DEFAULT '[]',          -- the changes, as JSON
  source  TEXT NOT NULL DEFAULT 'rules',       -- 'model' or 'rules'
  state   TEXT NOT NULL DEFAULT 'live',        -- 'live' or 'undone'
  who     TEXT NOT NULL DEFAULT 'admin',
  at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS page_edits_page ON page_edits (page, state, id);

-- The log proper: every action taken in edit mode, including the undos and
-- the redos, so that the record of what happened cannot be edited by
-- editing the thing it describes.
CREATE TABLE IF NOT EXISTS page_edit_log (
  id      SERIAL PRIMARY KEY,
  edit_id INTEGER,
  page    TEXT NOT NULL DEFAULT '',
  action  TEXT NOT NULL,                       -- 'publish' | 'undo' | 'redo'
  detail  TEXT NOT NULL DEFAULT '',
  who     TEXT NOT NULL DEFAULT 'admin',
  at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS page_edit_log_page ON page_edit_log (page, id);
