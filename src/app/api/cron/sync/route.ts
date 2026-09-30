import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    const resourcesToUpsert: any[] = [];

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
    console.log('Fetching 30d Analytics for Formulae (install-on-request)...');
    const formulaAnalyticsRes = await fetch('https://formulae.brew.sh/api/analytics/install-on-request/30d.json');
    const formulaAnalyticsData = await formulaAnalyticsRes.json();

    console.log('Fetching 30d Analytics for Casks (cask-install)...');
    const caskAnalyticsRes = await fetch('https://formulae.brew.sh/api/analytics/cask-install/30d.json');
    const caskAnalyticsData = await caskAnalyticsRes.json();

    const topFormulae = formulaAnalyticsData.items.slice(0, 1000); 
    const topCasks = caskAnalyticsData.items.slice(0, 1000); 

    const tokensToFetch = [
      ...topFormulae.map((i: any) => i.formula),
      ...topCasks.map((i: any) => i.cask)
    ];

    // 4. Map to IDs using specific tokens to avoid the 1000 row fetch limit
    console.log('Fetching resource IDs for analytics mapping...');
    const resourceMap = new Map();
    
    // Fetch in chunks to avoid URL too long / max query size
    const tokenChunkSize = 200;
    for (let i = 0; i < tokensToFetch.length; i += tokenChunkSize) {
      const chunk = tokensToFetch.slice(i, i + tokenChunkSize);
      const { data: existingResources } = await supabaseAdmin
        .from('resources')
        .select('id, token')
        .eq('source_id', sourceId)
        .in('token', chunk);
        
      if (existingResources) {
        existingResources.forEach((r: any) => resourceMap.set(r.token, r.id));
      }
    }

    const snapshotsToInsert: any[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Top 1000 formulae analytics
    for (const item of topFormulae) {
      const rId = resourceMap.get(item.formula);
      if (rId) {
        snapshotsToInsert.push({
          resource_id: rId,
          time_window: '30d',
          metric: 'install-on-request',
          count: parseInt(item.count.replace(/,/g, ''), 10),
          captured_at: today
        });
      }
    }

    // Top 1000 cask analytics
    for (const item of topCasks) {
      const rId = resourceMap.get(item.cask);
      if (rId) {
        snapshotsToInsert.push({
          resource_id: rId,
          time_window: '30d',
          metric: 'cask-install',
          count: parseInt(item.count.replace(/,/g, ''), 10),
          captured_at: today
        });
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
    }

    return NextResponse.json({ success: true, message: `Sync executed. ${resourcesToUpsert.length} apps, ${snapshotsToInsert.length} analytics records.` });
  } catch (error) {
    console.error('Error during sync cron:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
