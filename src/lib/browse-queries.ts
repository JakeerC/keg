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
  count: number;
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

  // We either query `analytics_snapshots` (if we need to sort by count) or `resources` directly.
  // Actually, 'top' or default 'installed' sort requires sorting by count.
  const isTopRanking = filter === 'top' || (filter !== 'recent' && sort !== 'recent');

  if (isTopRanking) {
    let dbQuery = supabase
      .from('analytics_snapshots')
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
      .in('metric', ['install-on-request', 'cask-install']);

    if (kind && kind !== 'both') dbQuery = dbQuery.eq('resources.kind', kind);
    if (query) dbQuery = dbQuery.or(`display_name.ilike.%${query}%,token.ilike.%${query}%`, { foreignTable: 'resources' });
    if (validResourceIds) dbQuery = dbQuery.in('resource_id', validResourceIds);
    
    dbQuery = dbQuery.order('count', { ascending: false });

    const { data } = await dbQuery.limit(limit);
    return (data || []) as unknown as AppData[];
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
        analytics_snapshots(count)
      `);

    if (kind && kind !== 'both') dbQuery = dbQuery.eq('kind', kind);
    if (query) dbQuery = dbQuery.or(`display_name.ilike.%${query}%,token.ilike.%${query}%`);
    if (validResourceIds) dbQuery = dbQuery.in('id', validResourceIds);

    // Filter analytics to 30d
    dbQuery = dbQuery.eq('analytics_snapshots.time_window', '30d').in('analytics_snapshots.metric', ['install-on-request', 'cask-install']);

    dbQuery = dbQuery.order('updated_at', { ascending: false });

    const { data } = await dbQuery.limit(limit);

    return (data || []).map((r: Record<string, unknown>) => {
      const snapshots = r.analytics_snapshots as { count: number }[] | undefined;
      return {
        count: snapshots?.[0]?.count || 0,
        resources: r
      };
    }) as unknown as AppData[];
  }
}
