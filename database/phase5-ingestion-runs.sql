CREATE TABLE IF NOT EXISTS public.ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'partial', 'failed')),
    processed_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    error_summary TEXT,
    metadata JSONB
);

-- Index for querying recent runs quickly
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_job_name_started_at ON public.ingestion_runs (job_name, started_at DESC);

-- Allow reading ingestion runs by anon/authenticated
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for ingestion_runs" 
    ON public.ingestion_runs 
    FOR SELECT 
    USING (true);

-- Insert/update is restricted to service_role by default (RLS blocks anon/authenticated from writing)
