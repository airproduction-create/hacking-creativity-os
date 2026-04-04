-- ═══════════════════════════════════════════════════════════════════════════
-- HACKING CREATIVITY OS — PIPELINE JOBS SCHEMA
-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/yossieeqpgmvfuiiwcbl/sql/new
-- ═══════════════════════════════════════════════════════════════════════════

-- ── PIPELINE JOBS ────────────────────────────────────────────────────────
-- Tracks every video render job from queue → done
CREATE TABLE IF NOT EXISTS pipeline_jobs (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),

  -- What to render
  composition       text NOT NULL,              -- Remotion composition ID (e.g. "TestCard")
  payload           jsonb DEFAULT '{}'::jsonb,  -- JSON props passed into the composition

  -- Status lifecycle
  status            text NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued','scripting','voicing','rendering','davinci','done','failed')),
  error_message     text,                       -- populated on failure

  -- Output
  output_path       text,                       -- local file path or CDN URL of final render
  duration_frames   integer,
  fps               integer DEFAULT 30,
  width             integer DEFAULT 1920,
  height            integer DEFAULT 1080,

  -- Context (links back to a project in the main OS)
  project_id        uuid REFERENCES projects(id) ON DELETE SET NULL,
  metadata          jsonb DEFAULT '{}'::jsonb   -- brief, client, platform, etc.
);

-- ── INDEXES ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS pipeline_jobs_status_idx ON pipeline_jobs(status);
CREATE INDEX IF NOT EXISTS pipeline_jobs_created_idx ON pipeline_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS pipeline_jobs_project_idx ON pipeline_jobs(project_id);

-- ── AUTO-UPDATE updated_at ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_pipeline_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pipeline_jobs_updated_at ON pipeline_jobs;
CREATE TRIGGER pipeline_jobs_updated_at
  BEFORE UPDATE ON pipeline_jobs
  FOR EACH ROW EXECUTE FUNCTION update_pipeline_jobs_timestamp();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────
ALTER TABLE pipeline_jobs ENABLE ROW LEVEL SECURITY;

-- Allow all for now (tighten when auth is added)
CREATE POLICY "Allow all pipeline_jobs" ON pipeline_jobs
  FOR ALL USING (true) WITH CHECK (true);

-- ── PIPELINE ASSETS ──────────────────────────────────────────────────────
-- Tracks reusable assets (audio, fonts, brand files) for the pipeline
CREATE TABLE IF NOT EXISTS pipeline_assets (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now(),
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('audio','font','image','lut','logo','motion','script','voiceover')),
  file_path     text,              -- local path
  cdn_url       text,              -- CDN/Supabase storage URL
  tags          text[] DEFAULT '{}',
  metadata      jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE pipeline_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pipeline_assets" ON pipeline_assets
  FOR ALL USING (true) WITH CHECK (true);

-- ── VERIFY ───────────────────────────────────────────────────────────────
SELECT 'pipeline_jobs created' AS status, count(*) AS row_count FROM pipeline_jobs
UNION ALL
SELECT 'pipeline_assets created', count(*) FROM pipeline_assets;
