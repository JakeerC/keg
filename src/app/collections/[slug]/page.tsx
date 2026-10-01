import { createSupabaseServer } from '@/lib/supabase-server';
import { ThemeToggle } from '@/components/ThemeToggle';
import AuthButton from '@/components/AuthButton';
import AppIcon from '@/components/AppIcon';
import StarButton from '@/components/StarButton';
import SaveToCollectionButton from '@/components/SaveToCollectionButton';
import CollectionActions from '@/components/CollectionActions';
import { TerminalSquare, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function CollectionDetailsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;

  const supabaseServer = await createSupabaseServer();
  const { data: { session } } = await supabaseServer.auth.getSession();

  const { data: collection } = await supabaseServer
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!collection) {
    return (
      <div className="content-scroll" style={{ padding: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Collection Not Found</h1>
        <Link href="/collections">
          <button className="install-btn" style={{ margin: '0 auto' }}>
            <ArrowLeft size={16} /> Back to Collections
          </button>
        </Link>
      </div>
    );
  }

  const { data: items } = await supabaseServer
    .from('collection_items')
    .select(`
      resources (
        id,
        token,
        display_name,
        description,
        latest_version,
        kind
      )
    `)
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true });

  const apps = (items?.map(item => item.resources).filter(Boolean) || []) as unknown as Array<{
    id: string;
    token: string;
    display_name: string | null;
    description: string | null;
    latest_version: string | null;
    kind: string;
  }>;

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

  const isOwner = session?.user?.id === collection.user_id;

  return (
    <>
      <div className="top-bar">
        <Link href="/collections" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>

      <main className="content-scroll">
        <div style={{ 
          background: `linear-gradient(135deg, ${collection.gradient_from}, ${collection.gradient_to})`,
          padding: '4rem 2rem',
          borderRadius: '16px',
          color: 'white',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {isOwner && (
            <CollectionActions collectionId={collection.id} initialIsPrivate={collection.is_private} />
          )}
          {!isOwner && collection.is_private && (
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'white', backdropFilter: 'blur(4px)' }}>
              <Lock size={14} /> Private Collection
            </div>
          )}
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{collection.emoji}</div>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.3)', marginBottom: '1rem' }}>
              {collection.title}
            </h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.3)', maxWidth: '600px', lineHeight: 1.5 }}>
              {collection.description}
            </p>
          </div>
        </div>

        <div className="app-grid">
          {apps.map((app) => (
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
                        <StarButton resourceId={app.id} initialIsStarred={userBookmarks.has(app.id)} />
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
              This collection is empty.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
