-- Take every published episode off the public shelf: the four placeholder
-- recordings (001–003 committed, 004 recorded through the door) are removed
-- from the podcast page and the feed. Archiving, not deleting — the file,
-- transcript and notes stay in the vault until an admin presses delete.
UPDATE media
   SET state = 'archived', updated_at = NOW()
 WHERE kind = 'audio' AND state = 'published';
