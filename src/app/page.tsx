import { supabase } from '@/lib/supabase';
import AppIcon from '@/components/AppIcon';
import SearchBar from '@/components/SearchBar';
import SortDropdown from '@/components/SortDropdown';
import { Download, TerminalSquare } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 0; // Dynamic page

type PageProps = { 
  searchParams: Promise<{ query?: string; category?: string; filter?: string; limit?: string; sort?: string }> 
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { query, category } = await props.searchParams;
  if (query) return { title: `Search: "${query}"` };
  if (category) {
    const name = category.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    return { title: name };
  }
  return {};
}

export default async function Home(props: PageProps) {
  const searchParams = await props.searchParams;
  const { query, category, filter, sort = 'installed' } = searchParams;
  
  // Default to 13 (1 hero + 12 grid). Increase by 12 on each load more.
  const limit = searchParams.limit ? parseInt(searchParams.limit) : 13;
  
  let apps: any[] = [];
  
  if (query) {
    // Search mode
    const { data } = await supabase
      .from('resources')
      .select(`
        token,
        display_name,
        description,
        latest_version,
        kind,
        updated_at,
        analytics_snapshots(count)
      `)
      .or(`display_name.ilike.%${query}%,token.ilike.%${query}%`)
      .limit(limit);
      
    // Map to expected structure
    apps = data?.map(r => ({
      count: r.analytics_snapshots?.[0]?.count || 0,
      resources: r
    })) || [];
    
  } else if (category) {
    // Category mode
    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single();
      
    if (catData) {
      const { data } = await supabase
        .from('resource_categories')
        .select(`
          resources (
            token,
            display_name,
            description,
            latest_version,
            kind,
            updated_at,
            analytics_snapshots(count)
          )
        `)
        .eq('category_id', catData.id)
        .limit(limit);
        
      apps = data?.map(rc => ({
        count: (rc.resources as any)?.analytics_snapshots?.[0]?.count || 0,
        resources: rc.resources
      })) || [];
    }
  } else {
    // Default mode: Top trending
    let dbQuery = supabase
      .from('analytics_snapshots')
      .select(`
        count,
        resources!inner (
          token,
          display_name,
          description,
          latest_version,
          kind,
          updated_at
        )
      `)
      .eq('time_window', '30d')
      .in('metric', ['install-on-request', 'cask-install'])
      .limit(limit);
      
    if (sort === 'recent') {
      dbQuery = dbQuery.order('resources(updated_at)', { ascending: false });
    } else {
      dbQuery = dbQuery.order('count', { ascending: false }); // Default most installed
    }
      
    const { data } = await dbQuery;
    apps = data || [];
  }

  // JS-side sorting for query/category (where we fetch resources directly)
  if (query || category) {
    if (sort === 'recent') {
      apps.sort((a, b) => new Date(b.resources.updated_at || 0).getTime() - new Date(a.resources.updated_at || 0).getTime());
    } else {
      // Default: most installed
      apps.sort((a, b) => b.count - a.count);
    }
  }

  const heroApp = apps?.[0];
  const gridApps = apps?.slice(1) || [];

  const formatCount = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-title">
          Browse <span className="top-bar-subtitle">apps</span>
        </div>
        <SearchBar />
      </div>

      <main className="content-scroll">
        {heroApp && (
          <Link href={`/app/${heroApp.resources?.token}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="hero-card">
              <div>
                <div className="hero-tag">✦ {query ? 'TOP RESULT' : category ? 'CATEGORY TOP' : 'HOUSE PICK'}</div>
                <h1 className="hero-title">{heroApp.resources?.display_name || heroApp.resources?.token}</h1>
                <p className="hero-desc">{heroApp.resources?.description}</p>
                <div className="hero-meta">
                  <span className="status-badge">Installed</span>
                  <span>{formatCount(heroApp.count)} pours</span>
                  <span>v{heroApp.resources?.latest_version || '1.0.0'}</span>
                  <span>{heroApp.resources?.kind === 'gui_app' ? 'Mac App' : 'CLI Tool'}</span>
                </div>
              </div>
              <div className="hero-icon-wrapper">
                {heroApp.resources?.kind === 'gui_app' ? (
                  <AppIcon token={heroApp.resources?.token} isHero />
                ) : (
                  <TerminalSquare size={48} strokeWidth={1.5} color="var(--text-secondary)" />
                )}
              </div>
            </div>
          </Link>
        )}

        <div className="section-header">
          <h2>{query ? 'Search Results' : category ? 'Apps in Category' : 'Most Popular'}</h2>
          <SortDropdown />
        </div>

        <div className="app-grid">
          {gridApps.map((app: any, idx: number) => (
            <Link key={idx} href={`/app/${app.resources?.token}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="app-card">
                <div className="card-header">
                  <div className="app-icon">
                    {app.resources?.kind === 'gui_app' ? (
                      <AppIcon token={app.resources?.token} />
                    ) : (
                      <TerminalSquare size={24} strokeWidth={1.5} color="var(--text-secondary)" />
                    )}
                  </div>
                  <div className="app-info">
                    <div className="app-name">{app.resources?.display_name || app.resources?.token}</div>
                    <div className="app-category">{app.resources?.kind === 'gui_app' ? 'Mac App' : 'CLI Tool'}</div>
                  </div>
                </div>
                <div className="app-desc">
                  {app.resources?.description || "No description available."}
                </div>
                <div className="card-footer">
                  <div className="install-stats">
                    <span>↓ {formatCount(app.count)}</span>
                    <span>• v{app.resources?.latest_version?.substring(0, 8) || 'latest'}</span>
                  </div>
                  <button className="install-btn">
                    <Download size={14} /> Install
                  </button>
                </div>
              </div>
            </Link>
          ))}
          {apps.length === 0 && (
            <div style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0' }}>
              No apps found. Try a different search.
            </div>
          )}
        </div>

        {apps.length >= limit && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0', gridColumn: '1 / -1' }}>
            <Link 
              href={`/?query=${query || ''}&category=${category || ''}&limit=${limit + 12}`} 
              scroll={false} 
              style={{ textDecoration: 'none' }}
            >
              <button className="install-btn" style={{ padding: '0.8rem 2rem', fontSize: '1rem', backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-primary)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                Load More
              </button>
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
