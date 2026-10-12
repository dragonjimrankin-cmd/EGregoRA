-- 0040: cached episode subtitles (podcast captioning)
-- One translation per episode per language. The first request for a
-- language is made by the house models; the answer is kept here so the
-- reader's next play costs nothing.

CREATE TABLE IF NOT EXISTS media_subtitles (
  media_id   BIGINT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  lang       TEXT   NOT NULL,
  lines      TEXT   NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (media_id, lang)
);