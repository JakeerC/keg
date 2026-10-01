import { supabase } from '@/lib/supabase';
import { createSupabaseServer } from '@/lib/supabase-server';
import AppIcon from '@/components/AppIcon';
import { ThemeToggle } from '@/components/ThemeToggle';
import AuthButton from '@/components/AuthButton';
import StarButton from '@/components/StarButton';
import SaveToCollectionButton from '@/components/SaveToCollectionButton';
import TerminalCommand from '@/components/TerminalCommand';
import AnalyticsChart from '@/components/AnalyticsChart';
import { TerminalSquare, Download, Globe, ArrowLeft, Command } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateMetadata(props: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await props.params;
  const { data: resource } = await supabase
    .from('resources')
    .select('display_name, description')
    .eq('token', token)
    .single();

  if (!resource) return { title: 'App Not Found' };

  return {
    title: resource.display_name || token,
    description: resource.description || `Install ${token} via Homebrew.`,
  };
}

export default async function AppDetailsPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const token = params.token;
  
  const supabaseServer = await createSupabaseServer();
  const { data: { session } } = await supabaseServer.auth.getSession();
  
  let userBookmarks = new Set<string>();
  if (session) {
    const { data: bookmarks } = await supabaseServer
      .from('bookmarks')
      .select('resource_id')
      .eq('user_id', session.user.id);
    if (bookmarks) {
      userBookmarks = new Set(bookmarks.map((b: { resource_id: string }) => b.resource_id));
    }
  }

  // 1. Fetch resource
  const { data: resource } = await supabase
    .from('resources')
    .select(`
      id,
      token,
      display_name,
      description,
      homepage,
      license,
      latest_version,
      kind,
      resource_categories (
        categories (
          id,
          display_name
        )
      )
    `)
    .eq('token', token)
    .single();

  if (!resource) {
    return (
      <div className="content-scroll" style={{ padding: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>App Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>We couldn&apos;t find an app with the token &apos;{token}&apos;.</p>
        <Link href="/">
          <button className="install-btn" style={{ margin: '0 auto' }}>
            <ArrowLeft size={16} /> Back to Browse
          </button>
        </Link>
      </div>
    );
  }

  const isCask = resource.kind === 'gui_app';

  // 2. Fetch all analytics
  const { data: analyticsData } = await supabase
    .from('latest_analytics_snapshots')
    .select('time_window, count')
    .eq('resource_id', resource.id)
    .eq('metric', isCask ? 'cask-install' : 'install-on-request');

  // Parse analytics for recharts
  const chartData = [
    { name: '30 Days', installs: analyticsData?.find(a => a.time_window === '30d')?.count },
    { name: '90 Days', installs: analyticsData?.find(a => a.time_window === '90d')?.count },
    { name: '365 Days', installs: analyticsData?.find(a => a.time_window === '365d')?.count }
  ];
  
  const count30d = chartData[0].installs;

  const formatCount = (num: number | undefined) => {
    if (num === undefined) return 'N/A';
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const categoryName = (resource.resource_categories as unknown as Array<{ categories: { display_name: string } }>)?.[0]?.categories?.display_name || 'Uncategorized';

  // 3. Fetch live Homebrew extra details
  let extraDetails: {
    auto_updates?: boolean;
    caveats?: string;
    conflicts_with?: Record<string, unknown>;
    dependencies?: string[];
  } | null = null;
  try {
    const res = await fetch(`https://formulae.brew.sh/api/${isCask ? 'cask' : 'formula'}/${token}.json`, { next: { revalidate: 3600 } });
    if (res.ok) {
      extraDetails = await res.json();
    }
  } catch (e) {
    // gracefully fail if homebrew API is down
  }

  // 4. Fetch related apps
  const primaryCategoryId = (resource.resource_categories as unknown as Array<{ categories: { id: string } }>)?.[0]?.categories?.id;
  let relatedApps: Array<{
    resources: {
      id: string;
      token: string;
      display_name: string | null;
      kind: string;
      latest_analytics_snapshots: { count: number }[];
    }
  }> = [];
  if (primaryCategoryId) {
    const { data } = await supabase
      .from('resource_categories')
      .select(`
        resources!inner (
          id, token, display_name, kind,
          latest_analytics_snapshots(count)
        )
      `)
      .eq('category_id', primaryCategoryId)
      .neq('resources.token', token)
      .limit(5);
    relatedApps = (data || []) as unknown as typeof relatedApps;
  }

  return (
    <>
      <div className="top-bar">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>

      <main className="content-scroll">
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '3rem' }}>
            <div className="hero-icon-wrapper" style={{ width: '140px', height: '140px', flexShrink: 0 }}>
              {isCask ? (
                <AppIcon token={resource.token} isHero />
              ) : (
                <TerminalSquare size={64} strokeWidth={1.5} color="var(--text-secondary)" />
              )}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--accent-orange)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                {categoryName} • {isCask ? 'Mac App (Cask)' : 'CLI Tool (Formula)'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 0 }}>
                  {resource.display_name || resource.token}
                </h1>
                <div style={{ display: 'flex', gap: '0.5rem', transform: 'scale(1.2)', transformOrigin: 'left center' }}>
                  <StarButton resourceId={resource.id} initialIsStarred={userBookmarks.has(resource.id)} />
                  <SaveToCollectionButton resourceId={resource.id} />
                </div>
              </div>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                {resource.description}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {resource.homepage && (
                  <a href={resource.homepage} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <button className="install-btn" style={{ padding: '0.6rem 1.5rem', fontSize: '1rem' }}>
                      <Globe size={18} /> Website
                    </button>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
            <div className="app-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}>30-Day Installs</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCount(count30d)}</div>
            </div>
            <div className="app-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}>Latest Version</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{resource.latest_version || 'N/A'}</div>
            </div>
            <div className="app-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}>License</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resource.license || 'Unknown'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '3rem' }}>
            <div className="app-card" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Command size={20} /> Terminal Instructions
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Install or manage {resource.display_name || resource.token} via Homebrew:
              </p>
              
              <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>INSTALL</div>
              <TerminalCommand command={`brew install ${isCask ? '--cask ' : ''}${resource.token}`} />
              
              <div style={{ marginBottom: '0.5rem', marginTop: '1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>UNINSTALL</div>
              <TerminalCommand command={`brew uninstall ${isCask ? '--cask ' : ''}${resource.token}`} />
              
              {isCask && (
                <>
                  <div style={{ marginBottom: '0.5rem', marginTop: '1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>COMPLETELY REMOVE (ZAP)</div>
                  <TerminalCommand command={`brew uninstall --zap --cask ${resource.token}`} />
                </>
              )}
            </div>

            <div className="app-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Install Trends</h3>
              <AnalyticsChart data={chartData} />
            </div>

            {extraDetails && (
              <div className="app-card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Extra Details</h3>
                
                {extraDetails.auto_updates && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Auto Updates</div>
                    <div>Yes (Handles its own updates)</div>
                  </div>
                )}
                
                {extraDetails.caveats && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Caveats</div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--accent-orange)' }}>{extraDetails.caveats}</div>
                  </div>
                )}

                {isCask && extraDetails.conflicts_with && Object.keys(extraDetails.conflicts_with).length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Conflicts With</div>
                    <div style={{ fontSize: '0.9rem' }}>{JSON.stringify(extraDetails.conflicts_with)}</div>
                  </div>
                )}
                
                {!isCask && extraDetails.dependencies && extraDetails.dependencies.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Dependencies</div>
                    <div style={{ fontSize: '0.9rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {extraDetails.dependencies.map((dep: string) => (
                        <span key={dep} style={{ background: 'var(--bg-main)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{dep}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Related Apps */}
          {relatedApps && relatedApps.length > 0 && (
            <div style={{ marginTop: '2rem', marginBottom: '3rem' }}>
              <div className="section-header" style={{ marginTop: '0' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>More in {categoryName}</h2>
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                overflowX: 'auto', 
                paddingBottom: '1rem',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }} className="hide-scrollbar">
                {relatedApps.map((related) => {
                  const app = related.resources;
                  return (
                      <div key={app.id} className="app-card" style={{ position: 'relative', flexShrink: 0, width: '260px' }}>
                        <Link href={`/app/${app.token}`} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
                        <div className="card-header">
                          <div className="app-icon">
                            {app.kind === 'gui_app' ? (
                              <AppIcon token={app.token} />
                            ) : (
                              <TerminalSquare size={24} strokeWidth={1.5} color="var(--text-secondary)" />
                            )}
                          </div>
                          <div className="app-info" style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', gap: '0.5rem' }}>
                              <div className="app-name" style={{ marginBottom: 0 }}>{app.display_name || app.token}</div>
                              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                <StarButton resourceId={app.id} initialIsStarred={userBookmarks.has(app.id)} />
                                <SaveToCollectionButton resourceId={app.id} />
                              </div>
                            </div>
                            <div className="app-category">{app.kind === 'gui_app' ? 'Mac App' : 'CLI Tool'}</div>
                          </div>
                        </div>
                      </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
