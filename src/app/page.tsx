import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import AppIcon from '@/components/AppIcon';
import SearchBar from '@/components/SearchBar';
import SortDropdown from '@/components/SortDropdown';
import KindToggle from '@/components/KindToggle';
import AuthButton from '@/components/AuthButton';
import StarButton from '@/components/StarButton';
import SaveToCollectionButton from '@/components/SaveToCollectionButton';
import { Download, TerminalSquare } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getBrowseResults, type AppData } from '@/lib/browse-queries';
export const revalidate = 0; // Dynamic page

type PageProps = { 
  searchParams: Promise<{ query?: string; category?: string; filter?: string; limit?: string; sort?: string; kind?: string }> 
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
  const { query, category, filter, sort = 'installed', kind } = searchParams;
  
  // Default to 13 (1 hero + 12 grid). Increase by 12 on each load more.
  const limit = searchParams.limit ? parseInt(searchParams.limit) : 13;
  
  const supabaseServer = await createSupabaseServer();
  const { data: { session } } = await supabaseServer.auth.getSession();
  
  // Fetch featured collections
  const { data: featuredCollections } = await supabase
    .from('collections')
    .select('*')
    .eq('is_featured', true)
    .order('sort_order', { ascending: true })
    .limit(4);
  
  let userBookmarks = new Set<string>();
  if (session) {
    const { data: bookmarks } = await supabaseServer
      .from('bookmarks')
      .select('resource_id')
      .eq('user_id', session.user.id);
    
    if (bookmarks) {
      userBookmarks = new Set(bookmarks.map(b => b.resource_id));
    }
  }
  
  let filterValue = filter as import('@/lib/browse-queries').BrowseFilter | undefined;
  if (!filterValue || !['featured', 'top', 'recent'].includes(filterValue)) {
    filterValue = 'none';
  }

  const apps = await getBrowseResults(supabase, {
    query,
    category,
    filter: filterValue,
    sort,
    kind,
    limit,
  });

  const heroApp = apps?.[0];
  const gridApps = apps?.slice(1) || [];

  const formatCount = (num: number | undefined) => {
    if (num === undefined) return 'N/A';
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const loadMoreParams = new URLSearchParams();
  if (query) loadMoreParams.set('query', query);
  if (category) loadMoreParams.set('category', category);
  if (filter) loadMoreParams.set('filter', filter);
  if (sort && sort !== 'installed') loadMoreParams.set('sort', sort);
  if (kind && kind !== 'both') loadMoreParams.set('kind', kind);
  loadMoreParams.set('limit', (limit + 12).toString());

  const getHeading = () => {
    if (query) return 'Search Results';
    if (category) return 'Apps in Category';
    if (filterValue === 'featured') return 'Featured Apps';
    if (filterValue === 'recent') return 'Recently Added';
    if (filterValue === 'top') return 'Top Charts';
    return 'Most Popular';
  };

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-title">
          Browse <span className="top-bar-subtitle">apps</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SearchBar />
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>

      <main className="content-scroll">
        {heroApp && (
          <div style={{ position: 'relative' }}>
            <div className="hero-card">
              <Link href={`/app/${heroApp.resources?.token}`} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div className="hero-tag">✦ {query ? 'TOP RESULT' : category ? 'CATEGORY TOP' : 'HOUSE PICK'}</div>
                <h1 className="hero-title">{heroApp.resources?.display_name || heroApp.resources?.token}</h1>
                <p className="hero-desc">{heroApp.resources?.description}</p>
                <div className="hero-meta" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span>{formatCount(heroApp.count)} pours</span>
                  <span>v{heroApp.resources?.latest_version || '1.0.0'}</span>
                  <span>{heroApp.resources?.kind === 'gui_app' ? 'Mac App' : 'CLI Tool'}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <StarButton resourceId={heroApp.resources?.id} initialIsStarred={userBookmarks.has(heroApp.resources?.id)} />
                    <SaveToCollectionButton resourceId={heroApp.resources?.id} />
                  </div>
                </div>
              </div>
              <div className="hero-icon-wrapper" style={{ position: 'relative', zIndex: 2 }}>
                {heroApp.resources?.kind === 'gui_app' ? (
                  <AppIcon token={heroApp.resources?.token} isHero />
                ) : (
                  <TerminalSquare size={48} strokeWidth={1.5} color="var(--text-secondary)" />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="section-header">
          <h2>{getHeading()}</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <KindToggle />
            <SortDropdown />
          </div>
        </div>
        
        {/* Featured Collections (Only show on default home) */}
        {!query && !category && featuredCollections && featuredCollections.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <div className="section-header" style={{ marginTop: '0' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Featured Collections</h2>
              <Link href="/collections" style={{ textDecoration: 'none', color: 'var(--accent-orange)', fontSize: '0.9rem', fontWeight: 600 }}>View All →</Link>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              overflowX: 'auto', 
              paddingBottom: '1rem',
              scrollbarWidth: 'none', // Firefox
              WebkitOverflowScrolling: 'touch'
            }} className="hide-scrollbar">
              {featuredCollections.map(c => (
                <Link key={c.id} href={`/collections/${c.slug}`} style={{ textDecoration: 'none', flexShrink: 0, width: '280px' }}>
                  <div className="collection-card" style={{
                    background: `linear-gradient(135deg, ${c.gradient_from}, ${c.gradient_to})`,
                    padding: '1.5rem',
                    borderRadius: '12px',
                    color: 'white',
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}>
                    <span style={{ fontSize: '2.5rem', position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0.8 }}>
                      {c.emoji}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      {c.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="app-grid">
          {gridApps.map((app: AppData, idx: number) => (
            <div key={idx} style={{ position: 'relative' }}>
              <div className="app-card">
                <Link href={`/app/${app.resources?.token}`} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
                <div className="card-header">
                  <div className="app-icon">
                    {app.resources?.kind === 'gui_app' ? (
                      <AppIcon token={app.resources?.token} />
                    ) : (
                      <TerminalSquare size={24} strokeWidth={1.5} color="var(--text-secondary)" />
                    )}
                  </div>
                  <div className="app-info" style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem', gap: '0.5rem' }}>
                      <div className="app-name" style={{ marginBottom: 0 }}>{app.resources?.display_name || app.resources?.token}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <StarButton resourceId={app.resources?.id} initialIsStarred={userBookmarks.has(app.resources?.id)} />
                        <SaveToCollectionButton resourceId={app.resources?.id} />
                      </div>
                    </div>
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
                </div>
              </div>
            </div>
          ))}
          {apps.length === 0 && (
            <div style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0' }}>
              {query ? 'No apps found matching your search.' : 
               category ? 'No apps found in this category.' : 
               filterValue === 'featured' ? 'No featured apps found.' :
               'No apps found.'}
            </div>
          )}
        </div>

        {apps.length >= limit && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0', gridColumn: '1 / -1' }}>
            <Link 
              href={`/?${loadMoreParams.toString()}`} 
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
