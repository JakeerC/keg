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
          <Link href="/" className={`nav-item ${isHome ? 'active' : ''}`}><LayoutGrid className="nav-icon" /> Browse</Link>
          <Link href="/?filter=featured" className={`nav-item ${activeFilter === 'featured' ? 'active' : ''}`}><Star className="nav-icon" /> Featured</Link>
          <Link href="/?filter=top" className={`nav-item ${activeFilter === 'top' ? 'active' : ''}`}><TrendingUp className="nav-icon" /> Top Charts</Link>
          <Link href="/?filter=recent" className={`nav-item ${activeFilter === 'recent' ? 'active' : ''}`}><Clock className="nav-icon" /> Recently Added</Link>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-title">Categories</div>
        <div className="nav-list" style={{ overflowY: 'auto' }}>
          <Link href="/?category=ai-llms" className={`nav-item ${activeCategory === 'ai-llms' ? 'active' : ''}`}><Sparkles className="nav-icon" /> AI & LLMs</Link>
          <Link href="/?category=audio-music" className={`nav-item ${activeCategory === 'audio-music' ? 'active' : ''}`}><Music className="nav-icon" /> Audio & Music</Link>
          <Link href="/?category=browsers" className={`nav-item ${activeCategory === 'browsers' ? 'active' : ''}`}><Globe className="nav-icon" /> Browsers</Link>
          <Link href="/?category=cloud-storage" className={`nav-item ${activeCategory === 'cloud-storage' ? 'active' : ''}`}><Cloud className="nav-icon" /> Cloud & Storage</Link>
          <Link href="/?category=communication" className={`nav-item ${activeCategory === 'communication' ? 'active' : ''}`}><MessageSquare className="nav-icon" /> Communication</Link>
          <Link href="/?category=design-graphics" className={`nav-item ${activeCategory === 'design-graphics' ? 'active' : ''}`}><PenTool className="nav-icon" /> Design & Graphics</Link>
          <Link href="/?category=developer-tools" className={`nav-item ${activeCategory === 'developer-tools' ? 'active' : ''}`}><Terminal className="nav-icon" /> Developer Tools</Link>
          <Link href="/?category=finance-crypto" className={`nav-item ${activeCategory === 'finance-crypto' ? 'active' : ''}`}><Bitcoin className="nav-icon" /> Finance & Crypto</Link>
          <Link href="/?category=games" className={`nav-item ${activeCategory === 'games' ? 'active' : ''}`}><Gamepad2 className="nav-icon" /> Games</Link>
          <Link href="/?category=menu-bar" className={`nav-item ${activeCategory === 'menu-bar' ? 'active' : ''}`}><MenuSquare className="nav-icon" /> Menu Bar</Link>
          <Link href="/?category=productivity" className={`nav-item ${activeCategory === 'productivity' ? 'active' : ''}`}><Briefcase className="nav-icon" /> Productivity</Link>
          <Link href="/?category=science-education" className={`nav-item ${activeCategory === 'science-education' ? 'active' : ''}`}><GraduationCap className="nav-icon" /> Science & Education</Link>
          <Link href="/?category=security-privacy" className={`nav-item ${activeCategory === 'security-privacy' ? 'active' : ''}`}><Shield className="nav-icon" /> Security & Privacy</Link>
          <Link href="/?category=utilities" className={`nav-item ${activeCategory === 'utilities' ? 'active' : ''}`}><Wrench className="nav-icon" /> Utilities</Link>
          <Link href="/?category=video" className={`nav-item ${activeCategory === 'video' ? 'active' : ''}`}><Video className="nav-icon" /> Video</Link>
          <Link href="/?category=web-development" className={`nav-item ${activeCategory === 'web-development' ? 'active' : ''}`}><Code className="nav-icon" /> Web Development</Link>
          <Link href="/?category=uncategorized" className={`nav-item ${activeCategory === 'uncategorized' ? 'active' : ''}`}><List className="nav-icon" /> Other</Link>
        </div>
      </div>
    </aside>
  );
}
