import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface IngestionResult {
  processed: number;
  skipped: number;
  failed: number;
  partial?: boolean;
  error_summary?: string;
}

export async function runIngestionJob(
  jobName: string, 
  logic: (runId: string) => Promise<IngestionResult>
) {
  // 1. Create run record (idempotent setup not strictly needed as it generates a new UUID, but we can check if one is running)
  
  // Optional: lightweight job lock by checking if there's a recent 'running' job for the same name
  const { data: existingRuns } = await supabaseAdmin
    .from('ingestion_runs')
    .select('id, started_at')
    .eq('job_name', jobName)
    .eq('status', 'running')
    .order('started_at', { ascending: false })
    .limit(1);

  if (existingRuns && existingRuns.length > 0) {
    const startedAt = new Date(existingRuns[0].started_at).getTime();
    const now = Date.now();
    // If the job started less than 5 minutes ago, consider it locked.
    if (now - startedAt < 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Job is already running' }, { status: 409 });
    }
  }

  const { data: run, error: runError } = await supabaseAdmin
    .from('ingestion_runs')
    .insert({ job_name: jobName, status: 'running' })
    .select('id')
    .single();

  if (runError || !run) {
    console.error('Failed to create ingestion run:', runError);
    return NextResponse.json({ error: 'Failed to initialize ingestion run' }, { status: 500 });
  }

  const runId = run.id;

  try {
    const result = await logic(runId);
    
    // 2. Update run on success or partial success
    await supabaseAdmin
      .from('ingestion_runs')
      .update({
        status: result.partial ? 'partial' : 'succeeded',
        finished_at: new Date().toISOString(),
        processed_count: result.processed,
        skipped_count: result.skipped,
        failed_count: result.failed,
        error_summary: result.error_summary || null
      })
      .eq('id', runId);

    if (result.partial) {
      return NextResponse.json({ status: 'partial success', ...result }, { status: 207 });
    }
    return NextResponse.json({ status: 'success', ...result });

  } catch (error: unknown) {
    // 3. Update run on hard failure
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Ingestion job ${jobName} failed:`, errorMsg);
    await supabaseAdmin
      .from('ingestion_runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_summary: errorMsg
      })
      .eq('id', runId);

    return NextResponse.json({ error: 'Ingestion failed', details: errorMsg }, { status: 500 });
  }
}

export async function fetchWithTimeout(url: string, timeoutMs = 15000, options: RequestInit = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal  
    });
    clearTimeout(id);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
