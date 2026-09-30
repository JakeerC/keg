import { supabase } from '@/lib/supabase';

// Revalidate this page every hour
export const revalidate = 3600;

export default async function Home() {
  // Fetch top 12 trending apps based on 30d install-on-request
  const { data: trendingApps } = await supabase
    .from('analytics_snapshots')
    .select(`
      count,
      resources (
        token,
        display_name,
        description
      )
    `)
    .eq('time_window', '30d')
    .in('metric', ['install-on-request', 'cask-install'])
    .order('count', { ascending: false })
    .limit(12);

  return (
    <div className="container">
      <header className="header">
        <h1>App Browser</h1>
        <p>Discover Homebrew Formulae and Casks</p>
      </header>
      
      <main className="main-content">
        <section className="search-section">
          <input type="search" placeholder="Search apps..." className="search-input" />
        </section>

        <section className="trending-section">
          <h2>Trending Now</h2>
          <div className="app-grid">
            {trendingApps && trendingApps.length > 0 ? (
              trendingApps.map((app: any, idx: number) => (
                <div key={idx} className="app-card">
                  <h3>{app.resources?.display_name || app.resources?.token}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {app.resources?.description?.substring(0, 80)}
                    {app.resources?.description?.length > 80 ? '...' : ''}
                  </p>
                  <p style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {app.count.toLocaleString()} installs (30d)
                  </p>
                </div>
              ))
            ) : (
              <div className="app-card placeholder">
                <h3>No data yet...</h3>
                <p>Run the cron job to sync Homebrew data.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
