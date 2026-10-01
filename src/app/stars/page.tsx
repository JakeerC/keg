import { createSupabaseServer } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import AuthButton from '@/components/AuthButton';
import AppIcon from '@/components/AppIcon';
import StarButton from '@/components/StarButton';
import SaveToCollectionButton from '@/components/SaveToCollectionButton';
import { TerminalSquare, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function StarsPage() {
  const supabaseServer = await createSupabaseServer();
  const { data: { session } } = await supabaseServer.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch bookmarks
  const { data: bookmarks } = await supabaseServer
    .from('bookmarks')
    .select(`
      resource_id,
      resources (
        id,
        token,
        display_name,
        description,
        latest_version,
        kind
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  type StarredApp = {
    id: string;
    token: string;
    display_name: string | null;
    description: string | null;
    kind: string;
    latest_version: string | null;
    owner: string | null;
    repo: string | null;
  };

  const apps = (bookmarks?.map(b => b.resources) || []) as unknown as StarredApp[];

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </Link>
          My Stars
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>

      <main className="content-scroll">
        <div className="section-header" style={{ marginTop: '2rem' }}>
          <h2>Saved Apps ({apps.length})</h2>
          {apps.length > 0 && (
            <a href="/api/brewfile" download="Brewfile" style={{ textDecoration: 'none' }}>
              <button className="install-btn" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={16} /> Export Brewfile
              </button>
            </a>
          )}
        </div>

        <div className="app-grid">
          {apps.map((app: StarredApp) => (
            <div key={app.id} style={{ position: 'relative' }}>
              <div className="app-card">
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem', gap: '0.5rem' }}>
                      <div className="app-name" style={{ marginBottom: 0 }}>{app.display_name || app.token}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <StarButton resourceId={app.id} initialIsStarred={true} />
                        <SaveToCollectionButton resourceId={app.id} />
                      </div>
                    </div>
                    <div className="app-category">{app.kind === 'gui_app' ? 'Mac App' : 'CLI Tool'}</div>
                  </div>
                </div>
                <div className="app-desc">
                  {app.description || "No description available."}
                </div>
                <div className="card-footer">
                  <div className="install-stats">
                    <span>v{app.latest_version?.substring(0, 8) || 'latest'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {apps.length === 0 && (
            <div style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0' }}>
              You haven&apos;t starred any apps yet.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
