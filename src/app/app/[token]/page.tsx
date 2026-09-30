import { supabase } from '@/lib/supabase';
import AppIcon from '@/components/AppIcon';
import { TerminalSquare, Download, Globe, ArrowLeft, Command } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 3600;

export default async function AppDetailsPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const token = params.token;

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
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>We couldn't find an app with the token '{token}'.</p>
        <Link href="/">
          <button className="install-btn" style={{ margin: '0 auto' }}>
            <ArrowLeft size={16} /> Back to Browse
          </button>
        </Link>
      </div>
    );
  }

  // 2. Fetch 30d analytics
  const { data: analytics } = await supabase
    .from('analytics_snapshots')
    .select('count')
    .eq('resource_id', resource.id)
    .eq('time_window', '30d')
    .in('metric', ['install-on-request', 'cask-install'])
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  const count = analytics?.count || 0;
  const formatCount = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const categoryName = (resource.resource_categories as any)?.[0]?.categories?.display_name || 'Uncategorized';
  const isCask = resource.kind === 'gui_app';

  return (
    <>
      <div className="top-bar">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back
        </Link>
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
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                {resource.display_name || resource.token}
              </h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                {resource.description}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="install-btn" style={{ padding: '0.6rem 1.5rem', fontSize: '1rem', backgroundColor: 'var(--accent-green)', color: 'white', border: 'none' }}>
                  <Download size={18} /> Install
                </button>
                
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
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCount(count)}</div>
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

          <div className="app-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Command size={20} /> Terminal Instructions
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              You can install {resource.display_name || resource.token} via Homebrew by running the following command in your terminal:
            </p>
            <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
              <span>brew install {isCask ? '--cask ' : ''}{resource.token}</span>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
