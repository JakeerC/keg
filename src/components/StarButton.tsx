"use client";
import { useState, useEffect } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StarButton({ resourceId, initialIsStarred }: { resourceId: string, initialIsStarred?: boolean }) {
  const [isStarred, setIsStarred] = useState(initialIsStarred || false);
  const [loading, setLoading] = useState(initialIsStarred === undefined);
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  useEffect(() => {
    if (initialIsStarred !== undefined) {
      setIsStarred(initialIsStarred);
      setLoading(false);
    } else {
      const checkStar = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data } = await supabase
            .from('bookmarks')
            .select('id')
            .eq('resource_id', resourceId)
            .single();
          if (data) setIsStarred(true);
        }
        setLoading(false);
      };
      checkStar();
    }

    const handleBookmarkChange = (e: any) => {
      if (e.detail.resourceId === resourceId) {
        setIsStarred(e.detail.isStarred);
      }
    };
    window.addEventListener('bookmarkChanged', handleBookmarkChange);
    return () => window.removeEventListener('bookmarkChanged', handleBookmarkChange);
  }, [resourceId, supabase, initialIsStarred]);

  const toggleStar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const previousState = isStarred;
    setIsStarred(!previousState);
    window.dispatchEvent(new CustomEvent('bookmarkChanged', { detail: { resourceId, isStarred: !previousState } }));

    if (previousState) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('resource_id', resourceId)
        .eq('user_id', session.user.id);
        
      if (error) {
        setIsStarred(previousState);
        window.dispatchEvent(new CustomEvent('bookmarkChanged', { detail: { resourceId, isStarred: previousState } }));
        console.error('Failed to unstar:', error);
      }
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({ resource_id: resourceId, user_id: session.user.id });
        
      if (error && error.code !== '23505') { // Ignore unique constraint violation if already starred
        setIsStarred(previousState);
        window.dispatchEvent(new CustomEvent('bookmarkChanged', { detail: { resourceId, isStarred: previousState } }));
        console.error('Failed to star:', error);
      }
    }
    
    router.refresh();
  };

  if (loading) {
    return <div style={{ width: 24, height: 24 }}></div>;
  }

  return (
    <button 
      onClick={toggleStar}
      style={{ 
        background: 'transparent', 
        border: 'none', 
        cursor: 'pointer',
        color: isStarred ? 'var(--accent-orange)' : 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.2rem',
        borderRadius: '50%',
        transition: 'all 0.2s ease'
      }}
      className="star-btn"
      aria-label={isStarred ? "Unstar app" : "Star app"}
    >
      <Star fill={isStarred ? "var(--accent-orange)" : "none"} size={20} />
    </button>
  );
}
