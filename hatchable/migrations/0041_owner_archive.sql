-- 0041 · The owner's vault.
--
-- Every save leaves a row here, and the row is not a pointer to the shelf.
-- It carries the storage key, the title and the shape of the file itself,
-- so a recording can still be fetched from owner mode after the episode has
-- been unpublished, archived, or deleted off the media shelf altogether.
-- media_id is therefore ON DELETE SET NULL rather than CASCADE: losing the
-- shelf entry is exactly the case the vault exists to survive.
--
-- Nothing outside owner mode reads this table. The list and the file fetch
-- both run behind requireOwner() in api/owner.js, which accepts either the
-- remembered owner key or a signed-in account holding the owner privilege.
-- An admin is not enough, by design: this is the founder's copy.

CREATE TABLE IF NOT EXISTS owner_archive (
  id          bigserial PRIMARY KEY,
  media_id    bigint REFERENCES media (id) ON DELETE SET NULL,
  kind        text NOT NULL DEFAULT 'audio',
  title       text NOT NULL,
  storage_key text,
  mime        text,
  bytes       bigint,
  seconds     integer,
  state       text NOT NULL DEFAULT 'published',
  did         text NOT NULL DEFAULT 'saved',
  note        text NOT NULL DEFAULT '',
  saved_by    text NOT NULL DEFAULT '',
  saved_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS owner_archive_at_idx ON owner_archive (saved_at DESC);
CREATE INDEX IF NOT EXISTS owner_archive_media_idx ON owner_archive (media_id);
CREATE INDEX IF NOT EXISTS owner_archive_kind_idx ON owner_archive (kind, saved_at DESC);
