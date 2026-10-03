"use client";
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export default function CollectionItemActions({
  collectionId, resourceId, isFirst, isLast
}: {
  collectionId: string; resourceId: string;
  sortOrder?: number; isFirst: boolean; isLast: boolean;
}) {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const removeItem = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Remove this app from the collection?')) return;
    await supabase.from('collection_items').delete()
      .eq('collection_id', collectionId)
      .eq('resource_id', resourceId);
    router.refresh();
  };

  const moveItem = async (e: React.MouseEvent, direction: 'up' | 'down') => {
    e.preventDefault(); e.stopPropagation();
    // Swap sort_order with adjacent item via API
    const res = await fetch('/api/collections/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionId, resourceId, direction }),
    });
    if (res.ok) router.refresh();
  };

  return (
    <div style={{ display: 'flex', gap: '0.3rem' }}>
      {!isFirst && (
        <button onClick={(e) => moveItem(e, 'up')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}>
          <ChevronUp size={16} />
        </button>
      )}
      {!isLast && (
        <button onClick={(e) => moveItem(e, 'down')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}>
          <ChevronDown size={16} />
        </button>
      )}
      <button onClick={removeItem} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', marginLeft: '0.5rem' }}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}
