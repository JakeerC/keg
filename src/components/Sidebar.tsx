"use client";
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  Star, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  Music, 
  Globe, 
  Cloud, 
  MessageSquare, 
  PenTool, 
  Terminal, 
  Bitcoin, 
  Gamepad2, 
  MenuSquare,
  Briefcase,
  GraduationCap,
  Shield,
  Wrench,
  Video,
  Code,
  List
} from "lucide-react";

export default function Sidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeCategory = searchParams.get('category');
  const activeFilter = searchParams.get('filter');
  
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
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
        </div>
        Keg
      </div>
      
      <div className="nav-section">
        <div className="nav-title">Discover</div>
        <div className="nav-list">
          <Link href={createLink('home')} className={`nav-item ${isHome ? 'active' : ''}`}><LayoutGrid className="nav-icon" /> Browse</Link>
          <Link href={createLink('filter', 'featured')} className={`nav-item ${activeFilter === 'featured' ? 'active' : ''}`}><Star className="nav-icon" /> Featured</Link>
          <Link href={createLink('filter', 'top')} className={`nav-item ${activeFilter === 'top' ? 'active' : ''}`}><TrendingUp className="nav-icon" /> Top Charts</Link>
          <Link href={createLink('filter', 'recent')} className={`nav-item ${activeFilter === 'recent' ? 'active' : ''}`}><Clock className="nav-icon" /> Recently Added</Link>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-title">Categories</div>
        <div className="nav-list" style={{ overflowY: 'auto' }}>
          <Link href={createLink('category', 'ai-llms')} className={`nav-item ${activeCategory === 'ai-llms' ? 'active' : ''}`}><Sparkles className="nav-icon" /> AI & LLMs</Link>
          <Link href={createLink('category', 'audio-music')} className={`nav-item ${activeCategory === 'audio-music' ? 'active' : ''}`}><Music className="nav-icon" /> Audio & Music</Link>
          <Link href={createLink('category', 'browsers')} className={`nav-item ${activeCategory === 'browsers' ? 'active' : ''}`}><Globe className="nav-icon" /> Browsers</Link>
          <Link href={createLink('category', 'cloud-storage')} className={`nav-item ${activeCategory === 'cloud-storage' ? 'active' : ''}`}><Cloud className="nav-icon" /> Cloud & Storage</Link>
          <Link href={createLink('category', 'communication')} className={`nav-item ${activeCategory === 'communication' ? 'active' : ''}`}><MessageSquare className="nav-icon" /> Communication</Link>
          <Link href={createLink('category', 'design-graphics')} className={`nav-item ${activeCategory === 'design-graphics' ? 'active' : ''}`}><PenTool className="nav-icon" /> Design & Graphics</Link>
          <Link href={createLink('category', 'developer-tools')} className={`nav-item ${activeCategory === 'developer-tools' ? 'active' : ''}`}><Terminal className="nav-icon" /> Developer Tools</Link>
          <Link href={createLink('category', 'finance-crypto')} className={`nav-item ${activeCategory === 'finance-crypto' ? 'active' : ''}`}><Bitcoin className="nav-icon" /> Finance & Crypto</Link>
          <Link href={createLink('category', 'games')} className={`nav-item ${activeCategory === 'games' ? 'active' : ''}`}><Gamepad2 className="nav-icon" /> Games</Link>
          <Link href={createLink('category', 'menu-bar')} className={`nav-item ${activeCategory === 'menu-bar' ? 'active' : ''}`}><MenuSquare className="nav-icon" /> Menu Bar</Link>
          <Link href={createLink('category', 'productivity')} className={`nav-item ${activeCategory === 'productivity' ? 'active' : ''}`}><Briefcase className="nav-icon" /> Productivity</Link>
          <Link href={createLink('category', 'science-education')} className={`nav-item ${activeCategory === 'science-education' ? 'active' : ''}`}><GraduationCap className="nav-icon" /> Science & Education</Link>
          <Link href={createLink('category', 'security-privacy')} className={`nav-item ${activeCategory === 'security-privacy' ? 'active' : ''}`}><Shield className="nav-icon" /> Security & Privacy</Link>
          <Link href={createLink('category', 'utilities')} className={`nav-item ${activeCategory === 'utilities' ? 'active' : ''}`}><Wrench className="nav-icon" /> Utilities</Link>
          <Link href={createLink('category', 'video')} className={`nav-item ${activeCategory === 'video' ? 'active' : ''}`}><Video className="nav-icon" /> Video</Link>
          <Link href={createLink('category', 'web-development')} className={`nav-item ${activeCategory === 'web-development' ? 'active' : ''}`}><Code className="nav-icon" /> Web Development</Link>
          <Link href={createLink('category', 'uncategorized')} className={`nav-item ${activeCategory === 'uncategorized' ? 'active' : ''}`}><List className="nav-icon" /> Other</Link>
        </div>
      </div>
    </aside>
  );
}
