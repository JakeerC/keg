"use client";
import { useState, useEffect, useRef } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { FolderPlus, Check, Lock, Globe, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateCollectionModal from './CreateCollectionModal';

export default function SaveToCollectionButton({ resourceId }: { resourceId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<Array<{id: string, title: string, emoji: string, is_private: boolean}>>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const openDropdown = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    setIsOpen(true);
    setLoading(true);

    // Fetch user's collections
    const { data: cols } = await supabase
      .from('collections')
      .select('id, title, emoji, is_private')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    setCollections(cols || []);

    if (cols && cols.length > 0) {
      const colIds = cols.map(c => c.id);
      const { data: items } = await supabase
        .from('collection_items')
        .select('collection_id')
        .eq('resource_id', resourceId)
        .in('collection_id', colIds);

      const counts: Record<string, boolean> = {};
      items?.forEach(item => {
        counts[item.collection_id] = true;
      });
      setItemCounts(counts);
    }
    
    setLoading(false);
  };

  const toggleCollection = async (e: React.MouseEvent, collectionId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const isAdded = itemCounts[collectionId];
    
    // Optimistic update
    setItemCounts(prev => ({ ...prev, [collectionId]: !isAdded }));

    if (isAdded) {
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('resource_id', resourceId);
    } else {
      await supabase
        .from('collection_items')
        .insert({ collection_id: collectionId, resource_id: resourceId });
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={openDropdown}
        style={{ 
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0.2rem', borderRadius: '50%', transition: 'all 0.2s ease'
        }}
        className="star-btn"
        aria-label="Save to collection"
      >
        <FolderPlus size={20} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px',
          width: '240px', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden'
        }}>
          <div style={{ padding: '0.8rem', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Save to collection
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : collections.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                You don&apos;t have any collections yet.
              </div>
            ) : (
              collections.map(c => (
                <div 
                  key={c.id}
                  onClick={(e) => toggleCollection(e, c.id)}
                  style={{
                    padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer',
                    background: 'transparent', transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: itemCounts[c.id] ? 'var(--accent-orange)' : 'transparent',
                    borderColor: itemCounts[c.id] ? 'var(--accent-orange)' : 'var(--text-muted)'
                  }}>
                    {itemCounts[c.id] && <Check size={14} color="white" />}
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>{c.emoji}</span>
                  <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.95rem' }}>
                    {c.title}
                  </div>
                  {c.is_private ? <Lock size={12} color="var(--text-muted)" /> : <Globe size={12} color="var(--text-muted)" />}
                </div>
              ))
            )}
          </div>
          <div 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); setShowCreateModal(true); }}
            style={{ 
              padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
              color: 'var(--accent-orange)', fontSize: '0.95rem', fontWeight: 500,
              background: 'var(--bg-card-hover)', borderTop: '1px solid var(--border)'
            }}
          >
            <Plus size={16} /> Create new collection
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateCollectionModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
