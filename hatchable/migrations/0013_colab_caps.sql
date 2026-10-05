-- A Colab worker says what it can do: render video, serve a chat model, or both.
ALTER TABLE colab_workers ADD COLUMN IF NOT EXISTS caps TEXT NOT NULL DEFAULT 'video';
ALTER TABLE colab_workers ADD COLUMN IF NOT EXISTS model TEXT;
