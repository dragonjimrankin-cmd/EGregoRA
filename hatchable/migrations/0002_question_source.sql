-- Where each answer came from: the order's written corpus, or a model call.
ALTER TABLE questions ADD COLUMN source TEXT;
