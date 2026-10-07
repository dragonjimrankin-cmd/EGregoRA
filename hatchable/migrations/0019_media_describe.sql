-- What a transcription produced: the words themselves, and the title,
-- summary, tags and site links written from them.
ALTER TABLE media ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS links TEXT;         -- JSON: [{title, href, why}]
ALTER TABLE media ADD COLUMN IF NOT EXISTS topics TEXT;        -- JSON: [{at, heading}]
