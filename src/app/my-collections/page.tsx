import { supabase } from '@/lib/supabase';
import { createSupabaseServer } from '@/lib/supabase-server';
import { ThemeToggle } from '@/components/ThemeToggle';
import AuthButton from '@/components/AuthButton';
import Link from 'next/link';
import { Lock, Globe, Plus, ArrowLeft } from 'lucide-react';

export const revalidate = 0;

export default async function MyCollectionsPage() {
  const supabaseServer = await createSupabaseServer();
  const { data: { session } } = await supabaseServer.auth.getSession();

  if (!session) {
    return (
      <div className="content-scroll" style={{ padding: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Unauthorized</h1>
        <Link href="/login">
          <button className="install-btn" style={{ margin: '0 auto' }}>
            Log in to view your collections
          </button>
        </Link>
      </div>
    );
  }

  const { data: collections } = await supabaseServer
    .from('collections')
    .select('*, collection_items(count)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <>
      <div className="top-bar">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Home
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>

      <main className="content-scroll">
        <div className="section-header" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>My Collections</h2>
        </div>

        <div className="collections-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
          paddingBottom: '2rem'
        }}>
          {/* We don't render the create button directly as a card here since we need a client component for the modal.
              The SaveToCollectionButton already has the modal, but we should probably expose the modal here too.
              For simplicity, we'll just rely on creating from the Save menu for now, or we can make a client component here. */}

          {collections?.map(c => (
            <Link key={c.id} href={`/collections/${c.slug}`} style={{ textDecoration: 'none' }}>
              <div className="collection-card" style={{
                background: `linear-gradient(135deg, ${c.gradient_from}, ${c.gradient_to})`,
                padding: '2rem',
                borderRadius: '16px',
                color: 'white',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}>
                <span style={{ fontSize: '3rem', position: 'absolute', top: '1rem', right: '1rem', opacity: 0.8 }}>
                  {c.emoji}
                </span>
                
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', backdropFilter: 'blur(4px)' }}>
                  {c.is_private ? <><Lock size={12} /> Private</> : <><Globe size={12} /> Public</>}
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {c.title}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <p style={{ fontSize: '1rem', opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.3)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0, flex: 1 }}>
                    {c.description || 'No description'}
                  </p>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 600, background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>
                    {c.collection_items?.[0]?.count || 0} apps
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {(!collections || collections.length === 0) && (
            <div style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0' }}>
              You haven&apos;t created any collections yet.
              <br/>
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Click the folder icon on any app to create one.</span>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
