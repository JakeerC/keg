import { supabase } from '@/lib/supabase';
import AppIcon from '@/components/AppIcon';
import { Search, Download, TerminalSquare } from 'lucide-react';

export const revalidate = 3600;

export default async function Home() {
  // Fetch top 12 trending apps based on 30d install-on-request
  const { data: popularApps } = await supabase
    .from('analytics_snapshots')
    .select(`
      count,
      resources (
        token,
        display_name,
        description,
        latest_version,
        kind
      )
    `)
    .eq('time_window', '30d')
    .in('metric', ['install-on-request', 'cask-install'])
    .order('count', { ascending: false })
    .limit(13); // 1 for Hero, 12 for grid

  const heroApp = popularApps?.[0];
  const gridApps = popularApps?.slice(1) || [];

  // Helper to format large numbers (e.g., 1,500,000 -> 1.5M)
  const formatCount = (num: number) => {
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
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
          <input type="text" className="search-input" placeholder="Search apps..." />
        </div>
      </div>

      <main className="content-scroll">
        {heroApp && (
          <div className="hero-card">
            <div>
              <div className="hero-tag">✦ HOUSE PICK</div>
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
        )}

        <div className="section-header">
          <h2>Most Popular</h2>
          <span className="view-all">View All</span>
        </div>

        <div className="app-grid">
          {gridApps.map((app: any, idx: number) => (
            <div key={idx} className="app-card">
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
          ))}
        </div>
      </main>
    </>
  );
}
