-- One GPU on a free Kaggle account, so one job at a time.
CREATE TABLE IF NOT EXISTS gpu_jobs (
  id          BIGSERIAL PRIMARY KEY,
  kind        TEXT NOT NULL,                 -- 'video' | 'image'
  slug        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'queued',
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS gpu_jobs_status_idx ON gpu_jobs (status, started_at DESC);

-- Images can be queued on the same GPU, so the jobs table serves both.
ALTER TABLE videos ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'video';
