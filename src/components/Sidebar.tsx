"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, usePathname } from 'next/navigation';
import { LayoutGrid, Star, TrendingUp, Clock, Sparkles, Music, Globe, Cloud, MessageSquare, PenTool, Terminal, Bitcoin, Gamepad2, MenuSquare, Briefcase, FileText, GraduationCap, Shield, Wrench, Video, Code, ImageIcon, List, PanelLeft } from "lucide-react";
import { createSupabaseBrowser } from '@/lib/supabase-browser';

import type { User } from '@supabase/supabase-js';

export default function Sidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeCategory = searchParams.get('category');
  const activeFilter = searchParams.get('filter');
  
  const [user, setUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);
  
  // Home is active when we're at / and there's no specific filter/category selected
  const isHome = pathname === '/' && !activeCategory && !activeFilter;

  const createLink = (type: 'category' | 'filter' | 'home', value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('filter');
    params.delete('query');
    params.delete('limit');
    
    if (type === 'category' && value) params.set('category', value);
    if (type === 'filter' && value) params.set('filter', value);
    
    return `/?${params.toString()}`;
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.25rem', fontWeight: 700 }}>
          <Image src="/apple-touch-icon.png" alt="Keg Logo" width={32} height={32} style={{ borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }} />
          <span className="logo-text">Keg</span>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="sidebar-toggle-btn"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', borderRadius: '8px' }}
          aria-label="Toggle Sidebar"
        >
          <PanelLeft size={20} />
        </button>
      </div>
      
      <div className="nav-section">
        <div className="nav-title">Discover</div>
        <div className="nav-list">
          <Link title="Browse" href={createLink('home')} className={`nav-item ${isHome ? 'active' : ''}`}><LayoutGrid className="nav-icon" /> Browse</Link>
          <Link title="Featured" href={createLink('filter', 'featured')} className={`nav-item ${activeFilter === 'featured' ? 'active' : ''}`}><Star className="nav-icon" /> Featured</Link>
          <Link title="Top Charts" href={createLink('filter', 'top')} className={`nav-item ${activeFilter === 'top' ? 'active' : ''}`}><TrendingUp className="nav-icon" /> Top Charts</Link>
          <Link title="Recently Added" href={createLink('filter', 'recent')} className={`nav-item ${activeFilter === 'recent' ? 'active' : ''}`}><Clock className="nav-icon" /> Recently Added</Link>
          {user && (
            <>
              <Link title="My Stars" href="/stars" className={`nav-item ${pathname === '/stars' ? 'active' : ''}`}><Star className="nav-icon" /> My Stars</Link>
              <Link title="My Collections" href="/my-collections" className={`nav-item ${pathname === '/my-collections' ? 'active' : ''}`}><List className="nav-icon" /> My Collections</Link>
            </>
          )}
        </div>
      </div>

      <div className="nav-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="nav-title">Categories</div>
        <div className="nav-list hide-scrollbar" style={{ overflowY: 'auto', flex: 1 }}>
          <Link title="AI & LLMs" href={createLink('category', 'ai-llms')} className={`nav-item ${activeCategory === 'ai-llms' ? 'active' : ''}`}><Sparkles className="nav-icon" /> AI & LLMs</Link>
          <Link title="Audio & Music" href={createLink('category', 'audio-music')} className={`nav-item ${activeCategory === 'audio-music' ? 'active' : ''}`}><Music className="nav-icon" /> Audio & Music</Link>
          <Link title="Browsers" href={createLink('category', 'browsers')} className={`nav-item ${activeCategory === 'browsers' ? 'active' : ''}`}><Globe className="nav-icon" /> Browsers</Link>
          <Link title="Cloud & Storage" href={createLink('category', 'cloud-storage')} className={`nav-item ${activeCategory === 'cloud-storage' ? 'active' : ''}`}><Cloud className="nav-icon" /> Cloud & Storage</Link>
          <Link title="Communication" href={createLink('category', 'communication')} className={`nav-item ${activeCategory === 'communication' ? 'active' : ''}`}><MessageSquare className="nav-icon" /> Communication</Link>
          <Link title="Design & Graphics" href={createLink('category', 'design-graphics')} className={`nav-item ${activeCategory === 'design-graphics' ? 'active' : ''}`}><PenTool className="nav-icon" /> Design & Graphics</Link>
          <Link title="Developer Tools" href={createLink('category', 'developer-tools')} className={`nav-item ${activeCategory === 'developer-tools' ? 'active' : ''}`}><Terminal className="nav-icon" /> Developer Tools</Link>
          <Link title="Finance & Crypto" href={createLink('category', 'finance-crypto')} className={`nav-item ${activeCategory === 'finance-crypto' ? 'active' : ''}`}><Bitcoin className="nav-icon" /> Finance & Crypto</Link>
          <Link title="Games" href={createLink('category', 'games')} className={`nav-item ${activeCategory === 'games' ? 'active' : ''}`}><Gamepad2 className="nav-icon" /> Games</Link>
          <Link title="Menu Bar" href={createLink('category', 'menu-bar')} className={`nav-item ${activeCategory === 'menu-bar' ? 'active' : ''}`}><MenuSquare className="nav-icon" /> Menu Bar</Link>
          <Link title="Office Tools" href={createLink('category', 'office-tools')} className={`nav-item ${activeCategory === 'office-tools' ? 'active' : ''}`}><FileText className="nav-icon" /> Office Tools</Link>
          <Link title="Productivity" href={createLink('category', 'productivity')} className={`nav-item ${activeCategory === 'productivity' ? 'active' : ''}`}><Briefcase className="nav-icon" /> Productivity</Link>
          <Link title="Science & Education" href={createLink('category', 'science-education')} className={`nav-item ${activeCategory === 'science-education' ? 'active' : ''}`}><GraduationCap className="nav-icon" /> Science & Education</Link>
          <Link title="Security & Privacy" href={createLink('category', 'security-privacy')} className={`nav-item ${activeCategory === 'security-privacy' ? 'active' : ''}`}><Shield className="nav-icon" /> Security & Privacy</Link>
          <Link title="Screensaver & Wallpaper" href={createLink('category', 'screensaver-wallpaper')} className={`nav-item ${activeCategory === 'screensaver-wallpaper' ? 'active' : ''}`}><ImageIcon className="nav-icon" /> Screensaver & Wallpaper</Link>
          <Link title="Utilities" href={createLink('category', 'utilities')} className={`nav-item ${activeCategory === 'utilities' ? 'active' : ''}`}><Wrench className="nav-icon" /> Utilities</Link>
          <Link title="Video" href={createLink('category', 'video')} className={`nav-item ${activeCategory === 'video' ? 'active' : ''}`}><Video className="nav-icon" /> Video</Link>
          <Link title="Web Development" href={createLink('category', 'web-development')} className={`nav-item ${activeCategory === 'web-development' ? 'active' : ''}`}><Code className="nav-icon" /> Web Development</Link>
          <Link title="Other" href={createLink('category', 'uncategorized')} className={`nav-item ${activeCategory === 'uncategorized' ? 'active' : ''}`}><List className="nav-icon" /> Other</Link>
        </div>
      </div>
    </aside>
  );
}
