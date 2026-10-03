"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Globe } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export type CollectionData = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  is_private: boolean;
  slug: string;
};

export default function EditCollectionModal({ 
  collection, isOpen, onClose 
}: { 
  collection: CollectionData, isOpen: boolean, onClose: () => void 
}) {
  const [title, setTitle] = useState(collection.title);
  const [description, setDescription] = useState(collection.description || '');
  const [emoji, setEmoji] = useState(collection.emoji);
  const [isPrivate, setIsPrivate] = useState(collection.is_private);
  const [slug, setSlug] = useState(collection.slug);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('You must be logged in to edit a collection.');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('collections')
      .update({
        title,
        description,
        emoji,
        is_private: isPrivate,
        slug,
        updated_at: new Date().toISOString()
      })
      .eq('id', collection.id)
      .eq('user_id', session.user.id); // Ensure ownership

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setLoading(false);
      router.refresh();
      // If the slug changed, we need to navigate to the new slug
      if (slug !== collection.slug) {
        router.push(`/collections/${slug}`);
      }
      onClose();
    }
  };

  const modalContent = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--bg-card)', 
        border: '1px solid var(--border)', 
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Edit Collection</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: '0 0 60px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Icon</label>
              <input 
                type="text" 
                value={emoji} 
                onChange={e => setEmoji(e.target.value)}
                maxLength={2}
                style={{
                  width: '100%', padding: '0.8rem', fontSize: '1.5rem', textAlign: 'center',
                  background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%', padding: '0.8rem', fontSize: '1rem',
                  background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Slug (URL)</label>
            <input 
              type="text" 
              required
              value={slug}
              onChange={e => setSlug(e.target.value)}
              style={{
                width: '100%', padding: '0.8rem', fontSize: '1rem',
                background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)'
              }}
            />
            {slug !== collection.slug && (
              <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.3rem' }}>
                Warning: Changing the slug will break existing shared links.
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '0.8rem', fontSize: '1rem', resize: 'vertical',
                background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Visibility</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                onClick={() => setIsPrivate(false)}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '8px', border: `1px solid ${!isPrivate ? 'var(--accent-orange)' : 'var(--border)'}`,
                  background: !isPrivate ? 'var(--accent-orange)' : 'var(--bg-card-hover)',
                  color: !isPrivate ? 'white' : 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Globe size={18} /> Public
              </button>
              <button 
                type="button"
                onClick={() => setIsPrivate(true)}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '8px', border: `1px solid ${isPrivate ? 'var(--accent-orange)' : 'var(--border)'}`,
                  background: isPrivate ? 'var(--accent-orange)' : 'var(--bg-card-hover)',
                  color: isPrivate ? 'white' : 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Lock size={18} /> Private
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{
                padding: '0.8rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="install-btn"
              style={{ padding: '0.8rem 2rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
