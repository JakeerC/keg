"use client";
import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { Link2, Copy, Check } from 'lucide-react';

export default function CollectionShareActions({
  collectionSlug, collectionId, isPublic
}: { collectionSlug: string; collectionId: string; isPublic: boolean }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const copyLink = async () => {
    const url = `${window.location.origin}/collections/${collectionSlug}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const duplicateCollection = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    setDuplicating(true);

    const res = await fetch('/api/collections/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceCollectionId: collectionId }),
    });

    if (res.ok) {
      const { slug } = await res.json();
      router.push(`/collections/${slug}`);
    } else {
      alert('Failed to duplicate collection.');
    }
    setDuplicating(false);
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {isPublic && (
        <button onClick={copyLink} className="share-action-btn" style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '20px',
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'white', cursor: 'pointer', fontSize: '0.8rem', backdropFilter: 'blur(4px)', transition: 'background 0.2s'
        }}>
          {linkCopied ? <><Check size={14} /> Copied</> : <><Link2 size={14} /> Share</>}
        </button>
      )}
      <button onClick={duplicateCollection} disabled={duplicating} className="share-action-btn" style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '20px',
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'white', cursor: 'pointer', fontSize: '0.8rem', backdropFilter: 'blur(4px)', transition: 'background 0.2s',
          opacity: duplicating ? 0.7 : 1
        }}>
        <Copy size={14} /> {duplicating ? 'Duplicating...' : 'Duplicate'}
      </button>
    </div>
  );
}
