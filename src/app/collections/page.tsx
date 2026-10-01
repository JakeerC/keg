import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import AuthButton from '@/components/AuthButton';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';

export const revalidate = 0;

export default async function CollectionsPage() {
  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-title">
          Browse <span className="top-bar-subtitle">collections</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SearchBar />
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>

      <main className="content-scroll">
        <div className="section-header" style={{ marginTop: '2rem' }}>
          <h2>All Collections</h2>
        </div>

        <div className="collections-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
          paddingBottom: '2rem'
        }}>
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
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {c.title}
                </h3>
                <p style={{ fontSize: '1rem', opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.3)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.description}
                </p>
              </div>
            </Link>
          ))}
          {(!collections || collections.length === 0) && (
            <div style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0' }}>
              No collections available yet.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
