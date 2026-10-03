import { SupabaseClient } from '@supabase/supabase-js';

export type BrowseFilter = 'featured' | 'top' | 'recent' | 'none';

export type BrowseParams = {
  query?: string;
  category?: string;
  filter: BrowseFilter;
  sort?: string;
  kind?: string;
  limit: number;
};

export type AppData = {
  count: number | undefined;
  resources: {
    id: string;
    token: string;
    display_name: string | null;
    description: string | null;
    latest_version: string | null;
    kind: string;
    updated_at: string | null;
    analytics_snapshots?: { count: number }[] | null;
  };
};

export async function getBrowseResults(
  supabase: SupabaseClient,
  params: BrowseParams
): Promise<AppData[]> {
  const { query, category, filter, sort, kind, limit } = params;

  let categoryResourceIds: string[] | null = null;

  // 1. Resolve category to resource IDs
  if (category) {
    const { data: catData } = await supabase.from('categories').select('id').eq('slug', category).single();
    if (catData) {
      const { data: catResources } = await supabase.from('resource_categories').select('resource_id').eq('category_id', catData.id);
      categoryResourceIds = catResources?.map(r => r.resource_id) || [];
      if (categoryResourceIds.length === 0) return [];
    } else {
      return [];
    }
  }

  // 2. Resolve featured to resource IDs
  let featuredResourceIds: string[] | null = null;
  if (filter === 'featured') {
    const { data: collections } = await supabase.from('collections').select('id').eq('is_featured', true);
    if (collections && collections.length > 0) {
      const colIds = collections.map(c => c.id);
      const { data: featuredItems } = await supabase.from('collection_items').select('resource_id').in('collection_id', colIds);
      featuredResourceIds = featuredItems?.map(f => f.resource_id) || [];
      if (featuredResourceIds.length === 0) return [];
    } else {
      return [];
    }
  }

  // Intersect category and featured if both exist
  let validResourceIds: string[] | null = null;
  if (categoryResourceIds && featuredResourceIds) {
    validResourceIds = categoryResourceIds.filter(id => featuredResourceIds!.includes(id));
    if (validResourceIds.length === 0) return [];
  } else if (categoryResourceIds) {
    validResourceIds = categoryResourceIds;
  } else if (featuredResourceIds) {
    validResourceIds = featuredResourceIds;
  }

  // We either query `latest_analytics_snapshots` (if we need to sort by count) or `resources` directly.
  const isTopRanking = filter === 'top' || (filter !== 'recent' && sort !== 'recent');

  if (isTopRanking) {
    // Determine whether the user explicitly picked a kind
    const explicitKind = kind && kind !== 'both' ? kind : null;

    if (explicitKind) {
      // Single-kind query — straightforward
      return fetchTopRanking(supabase, {
        kind: explicitKind,
        query, validResourceIds, limit,
      });
    }

    // No explicit kind. When a category, search, or featured filter is active
    // we need to show *both* Mac Apps and CLI Tools so the user isn't confused
    // by an empty page (categories like Developer Tools are predominantly CLI
    // tools). We run two parallel queries (one per metric) and merge results.
    const needsBothKinds = !!(category || query || validResourceIds);

    if (needsBothKinds) {
      const [guiResults, cliResults] = await Promise.all([
        fetchTopRanking(supabase, { kind: 'gui_app', query, validResourceIds, limit }),
        fetchTopRanking(supabase, { kind: 'cli_tool', query, validResourceIds, limit }),
      ]);

      // Merge by count descending, taking the top `limit` results
      const merged = [...guiResults, ...cliResults]
        .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
        .slice(0, limit);

      return merged;
    }

    // Default home page with no filters: show only gui_app to keep rankings
    // clean (cask-install and install-on-request counts aren't comparable).
    return fetchTopRanking(supabase, {
      kind: 'gui_app',
      query, validResourceIds, limit,
    });
  } else {
    // recent or specific query sorting by recent
    let dbQuery = supabase
      .from('resources')
      .select(`
        id,
        token,
        display_name,
        description,
        latest_version,
        kind,
        updated_at,
        latest_analytics_snapshots(count)
      `);

    if (kind && kind !== 'both') dbQuery = dbQuery.eq('kind', kind);
    if (query) dbQuery = dbQuery.or(`display_name.ilike.%${query}%,token.ilike.%${query}%`);
    if (validResourceIds) dbQuery = dbQuery.in('id', validResourceIds);

    // Filter analytics to 30d
    dbQuery = dbQuery.eq('latest_analytics_snapshots.time_window', '30d');
    
    // For related/recent, we still need to filter by correct metric if possible
    // Supabase nested queries don't easily allow dynamic metric filtering based on parent row in select string without a view change, 
    // but the latest_analytics_snapshots view already has at most one metric per resource from sync.

    dbQuery = dbQuery.order('updated_at', { ascending: false });

    const { data } = await dbQuery.limit(limit);

    return (data || []).map((r: Record<string, unknown>) => {
      const snapshots = r.latest_analytics_snapshots as { count: number }[] | undefined;
      return {
        count: snapshots && snapshots.length > 0 ? snapshots[0].count : undefined,
        resources: r
      };
    }) as unknown as AppData[];
  }
}

/** Fetch top-ranked resources for a single kind from the analytics view. */
async function fetchTopRanking(
  supabase: SupabaseClient,
  opts: {
    kind: string;
    query?: string;
    validResourceIds: string[] | null;
    limit: number;
  }
): Promise<AppData[]> {
  const metric = opts.kind === 'gui_app' ? 'cask-install' : 'install-on-request';

  let dbQuery = supabase
    .from('latest_analytics_snapshots')
    .select(`
      count,
      resources!inner (
        id,
        token,
        display_name,
        description,
        latest_version,
        kind,
        updated_at
      )
    `)
    .eq('time_window', '30d')
    .eq('resources.kind', opts.kind)
    .eq('metric', metric);

  if (opts.query) {
    dbQuery = dbQuery.or(
      `display_name.ilike.%${opts.query}%,token.ilike.%${opts.query}%`,
      { foreignTable: 'resources' }
    );
  }
  if (opts.validResourceIds) {
    dbQuery = dbQuery.in('resource_id', opts.validResourceIds);
  }

  dbQuery = dbQuery.order('count', { ascending: false });

  const { data } = await dbQuery.limit(opts.limit);
  return (data || []) as unknown as AppData[];
}
