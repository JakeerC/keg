import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyCronAuth } from '@/lib/cron-auth';

export async function GET(request: Request) {
  const authResponse = verifyCronAuth(request);
  if (authResponse) return authResponse;

  try {
    // 1. Get the Homebrew source ID
    const { data: source } = await supabaseAdmin
      .from('sources')
      .select('id')
      .eq('slug', 'homebrew')
      .single();

    if (!source) {
      return NextResponse.json({ error: 'Homebrew source not found. Did you run the seed script?' }, { status: 500 });
    }
    const sourceId = source.id;

    // 2. Fetch and upsert Formulae
    console.log('Fetching Homebrew Formulae...');
    const formulaRes = await fetch('https://formulae.brew.sh/api/formula.json');
    const formulae = await formulaRes.json();
    
    console.log('Fetching Homebrew Casks...');
    const caskRes = await fetch('https://formulae.brew.sh/api/cask.json');
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

    console.log(`Upserting ${resourcesToUpsert.length} resources...`);
    const chunkSize = 1000;
    for (let i = 0; i < resourcesToUpsert.length; i += chunkSize) {
      const chunk = resourcesToUpsert.slice(i, i + chunkSize);
      const { error } = await supabaseAdmin
        .from('resources')
        .upsert(chunk, { onConflict: 'source_id,token' });
      if (error) console.error('Error upserting chunk:', error);
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
        console.log(`Fetching ${window} Analytics...`);
        const formulaRes = await fetch(`https://formulae.brew.sh/api/analytics/install-on-request/${window}.json`);
        const formulaData = await formulaRes.json();
        const caskRes = await fetch(`https://formulae.brew.sh/api/analytics/cask-install/${window}.json`);
        const caskData = await caskRes.json();
        
        allData.formula[window] = formulaData.items.slice(0, 1000);
        allData.cask[window] = caskData.items.slice(0, 1000);
        
        allData.formula[window].forEach((i: { formula: string }) => tokensToFetch.add(i.formula));
        allData.cask[window].forEach((i: { cask: string }) => tokensToFetch.add(i.cask));
      }

      // 4. Map to IDs using specific tokens
      console.log('Fetching resource IDs for analytics mapping...');
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
        // Formulae analytics
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

        // Cask analytics
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
        console.log(`Upserting ${snapshotsToInsert.length} Analytics Snapshots...`);
        const chunk_size = 1000;
        for (let i = 0; i < snapshotsToInsert.length; i += chunk_size) {
          const chunk = snapshotsToInsert.slice(i, i + chunk_size);
          const { error } = await supabaseAdmin
            .from('analytics_snapshots')
            .upsert(chunk, { onConflict: 'resource_id,time_window,metric,captured_at' });
          if (error) console.error('Error upserting snapshots:', error);
        }
        snapshotsInserted = snapshotsToInsert.length;
      }
    } catch (analyticsError) {
      console.error('Error fetching/upserting analytics, but resource sync succeeded:', analyticsError);
    }

    return NextResponse.json({ success: true, message: `Sync executed. ${resourcesToUpsert.length} apps, ${snapshotsInserted} analytics records.` });
  } catch (error) {
    console.error('Error during sync cron:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
