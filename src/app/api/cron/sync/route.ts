
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyCronAuth } from '@/lib/cron-auth';
import { runIngestionJob, fetchWithTimeout } from '@/lib/ingestion-runner';

export const revalidate = 0;
export const maxDuration = 300; // Vercel maximum duration

export async function GET(request: Request) {
  const authResponse = verifyCronAuth(request);
  if (authResponse) return authResponse;

  return runIngestionJob('sync-homebrew', async (runId) => {
    let processed = 0;
    let failed = 0;
    let partial = false;
    let error_summary = '';

    // 1. Get the Homebrew source ID
    const { data: source } = await supabaseAdmin
      .from('sources')
      .select('id')
      .eq('slug', 'homebrew')
      .single();

    if (!source) {
      throw new Error('Homebrew source not found. Did you run the seed script?');
    }
    const sourceId = source.id;

    // 2. Fetch and upsert Formulae
    console.log(`[${runId}] Fetching Homebrew Formulae...`);
    const formulaRes = await fetchWithTimeout('https://formulae.brew.sh/api/formula.json', 30000);
    const formulae = await formulaRes.json();
    
    console.log(`[${runId}] Fetching Homebrew Casks...`);
    const caskRes = await fetchWithTimeout('https://formulae.brew.sh/api/cask.json', 30000);
    const casks = await caskRes.json();

    const resourcesToUpsert: Record<string, unknown>[] = [];

    // Process formulae
    for (const formula of formulae) {
      resourcesToUpsert.push({
        source_id: sourceId,
        kind: 'cli_tool',
        token: formula.name,
        display_name: formula.full_name || formula.name,
        description: formula.desc,
        homepage: formula.homepage,
        license: typeof formula.license === 'string' ? formula.license : (formula.license ? JSON.stringify(formula.license) : null),
        latest_version: formula.versions?.stable || null
      });
    }

    // Process casks
    for (const cask of casks) {
      resourcesToUpsert.push({
        source_id: sourceId,
        kind: 'gui_app',
        token: cask.token,
        display_name: cask.name?.[0] || cask.token,
        description: cask.desc,
        homepage: cask.homepage,
        license: null, 
        latest_version: cask.version
      });
    }

    console.log(`[${runId}] Upserting ${resourcesToUpsert.length} resources...`);
    const chunkSize = 1000;
    for (let i = 0; i < resourcesToUpsert.length; i += chunkSize) {
      const chunk = resourcesToUpsert.slice(i, i + chunkSize);
      const { error } = await supabaseAdmin
        .from('resources')
        .upsert(chunk, { onConflict: 'source_id,token' });
      
      if (error) {
        console.error(`[${runId}] Error upserting chunk:`, error);
        partial = true;
        failed += chunk.length;
        error_summary += `Resource upsert error: ${error.message}. `;
      } else {
        processed += chunk.length;
      }
    }

    // 3. Fetch Analytics
    let snapshotsInserted = 0;
    try {
      const windows = ['30d', '90d', '365d'];
      const today = new Date().toISOString().split('T')[0];
      const snapshotsToInsert: Record<string, unknown>[] = [];
      const tokensToFetch = new Set<string>();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allData: Record<string, any> = { formula: {}, cask: {} };

      for (const window of windows) {
        console.log(`[${runId}] Fetching ${window} Analytics...`);
        const fRes = await fetchWithTimeout(`https://formulae.brew.sh/api/analytics/install-on-request/${window}.json`, 30000);
        const formulaData = await fRes.json();
        const cRes = await fetchWithTimeout(`https://formulae.brew.sh/api/analytics/cask-install/${window}.json`, 30000);
        const caskData = await cRes.json();
        
        allData.formula[window] = formulaData.items.slice(0, 1000);
        allData.cask[window] = caskData.items.slice(0, 1000);
        
        allData.formula[window].forEach((i: { formula: string }) => tokensToFetch.add(i.formula));
        allData.cask[window].forEach((i: { cask: string }) => tokensToFetch.add(i.cask));
      }

      console.log(`[${runId}] Fetching resource IDs for analytics mapping...`);
      const resourceMap = new Map();
      const tokensArray = Array.from(tokensToFetch);
      const tokenChunkSize = 200;
      for (let i = 0; i < tokensArray.length; i += tokenChunkSize) {
        const chunk = tokensArray.slice(i, i + tokenChunkSize);
        const { data: existingResources } = await supabaseAdmin
          .from('resources')
          .select('id, token')
          .eq('source_id', sourceId)
          .in('token', chunk);
          
        if (existingResources) {
          existingResources.forEach((r: { token: string, id: string }) => resourceMap.set(r.token, r.id));
        }
      }

      for (const window of windows) {
        for (const item of allData.formula[window]) {
          const rId = resourceMap.get(item.formula);
          if (rId) {
            snapshotsToInsert.push({
              resource_id: rId,
              time_window: window,
              metric: 'install-on-request',
              count: parseInt(item.count.replace(/,/g, ''), 10),
              captured_at: today
            });
          }
        }
        for (const item of allData.cask[window]) {
          const rId = resourceMap.get(item.cask);
          if (rId) {
            snapshotsToInsert.push({
              resource_id: rId,
              time_window: window,
              metric: 'cask-install',
              count: parseInt(item.count.replace(/,/g, ''), 10),
              captured_at: today
            });
          }
        }
      }

      if (snapshotsToInsert.length > 0) {
        console.log(`[${runId}] Upserting ${snapshotsToInsert.length} Analytics Snapshots...`);
        const chunk_size = 1000;
        for (let i = 0; i < snapshotsToInsert.length; i += chunk_size) {
          const chunk = snapshotsToInsert.slice(i, i + chunk_size);
          const { error } = await supabaseAdmin
            .from('analytics_snapshots')
            .upsert(chunk, { onConflict: 'resource_id,time_window,metric,captured_at' });
          if (error) {
            console.error(`[${runId}] Error upserting snapshots:`, error);
            partial = true;
            error_summary += `Analytics upsert error: ${error.message}. `;
          } else {
            snapshotsInserted += chunk.length;
          }
        }
      }
    } catch (analyticsError) {
      console.error(`[${runId}] Error fetching/upserting analytics:`, analyticsError);
      partial = true;
      error_summary += `Analytics fetch error: ${analyticsError instanceof Error ? analyticsError.message : String(analyticsError)}. `;
    }

    return {
      processed: processed + snapshotsInserted,
      skipped: 0,
      failed,
      partial,
      error_summary: error_summary || undefined
    };
  });
}
