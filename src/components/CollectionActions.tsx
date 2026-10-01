"use client";
import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { Trash, Lock, Globe } from 'lucide-react';

export default function CollectionActions({ collectionId, initialIsPrivate }: { collectionId: string, initialIsPrivate: boolean }) {
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const togglePrivacy = async () => {
    const newState = !isPrivate;
    setIsPrivate(newState);
    await supabase.from('collections').update({ is_private: newState }).eq('id', collectionId);
    router.refresh();
  };

  const deleteCollection = async () => {
    if (!confirm("Are you sure you want to delete this collection? This cannot be undone.")) return;
    setIsDeleting(true);
    await supabase.from('collections').delete().eq('id', collectionId);
    router.push('/my-collections');
  };

  return (
    <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
      <button 
        onClick={togglePrivacy}
        style={{
          background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '20px', padding: '0.4rem 0.8rem',
          color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', backdropFilter: 'blur(4px)',
          fontSize: '0.8rem'
        }}
      >
        {isPrivate ? <><Lock size={14} /> Private</> : <><Globe size={14} /> Public</>}
      </button>

      <button 
        onClick={deleteCollection}
        disabled={isDeleting}
        style={{
          background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '20px', padding: '0.4rem 0.8rem',
          color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', backdropFilter: 'blur(4px)',
          fontSize: '0.8rem', opacity: isDeleting ? 0.5 : 1
        }}
      >
        <Trash size={14} /> Delete
      </button>
    </div>
  );
}
