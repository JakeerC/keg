"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Star } from 'lucide-react';

import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function AuthButton() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  };

  if (loading) return <div style={{ width: 80, height: 36 }}></div>;

  if (!user) {
    return (
      <Link href="/login" style={{ textDecoration: 'none' }}>
        <button className="install-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Sign In
        </button>
      </Link>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const initial = user.email ? user.email[0].toUpperCase() : 'U';

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Avatar" width={32} height={32} style={{ borderRadius: '50%', border: '1px solid var(--border-color)' }} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--accent-orange)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
            {initial}
          </div>
        )}
      </button>

      {menuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          width: '200px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          padding: '0.5rem',
          zIndex: 100,
          backdropFilter: 'blur(10px)'
        }}>
          <Link href="/stars" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)', borderRadius: '4px' }} className="menu-item">
            <Star size={16} /> My Stars
          </Link>
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }}></div>
          <button onClick={handleSignOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px', textAlign: 'left' }} className="menu-item">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
