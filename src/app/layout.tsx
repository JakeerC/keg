import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Link from "next/link";
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
  MenuSquare 
} from "lucide-react";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CaskHub",
  description: "Browse Homebrew Casks and Formulae",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <div className="app-window">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="logo">
              <div className="logo-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
              </div>
              CaskHub
            </div>
            
            <div className="nav-section">
              <div className="nav-title">Discover</div>
              <div className="nav-list">
                <Link href="/" className="nav-item active"><LayoutGrid className="nav-icon" /> Browse</Link>
                <Link href="/?filter=featured" className="nav-item"><Star className="nav-icon" /> Featured</Link>
                <Link href="/?filter=top" className="nav-item"><TrendingUp className="nav-icon" /> Top Charts</Link>
                <Link href="/?filter=recent" className="nav-item"><Clock className="nav-icon" /> Recently Added</Link>
              </div>
            </div>

            <div className="nav-section">
              <div className="nav-title">Categories</div>
              <div className="nav-list">
                <Link href="/?category=ai-llms" className="nav-item"><Sparkles className="nav-icon" /> AI & LLMs</Link>
                <Link href="/?category=audio-music" className="nav-item"><Music className="nav-icon" /> Audio & Music</Link>
                <Link href="/?category=browsers" className="nav-item"><Globe className="nav-icon" /> Browsers</Link>
                <Link href="/?category=cloud-storage" className="nav-item"><Cloud className="nav-icon" /> Cloud & Storage</Link>
                <Link href="/?category=communication" className="nav-item"><MessageSquare className="nav-icon" /> Communication</Link>
                <Link href="/?category=design-graphics" className="nav-item"><PenTool className="nav-icon" /> Design & Graphics</Link>
                <Link href="/?category=developer-tools" className="nav-item"><Terminal className="nav-icon" /> Developer Tools</Link>
                <Link href="/?category=finance-crypto" className="nav-item"><Bitcoin className="nav-icon" /> Finance & Crypto</Link>
                <Link href="/?category=games" className="nav-item"><Gamepad2 className="nav-icon" /> Games</Link>
                <Link href="/?category=menu-bar" className="nav-item"><MenuSquare className="nav-icon" /> Menu Bar</Link>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="main-view">
            {children}
            
            {/* Status Bar */}
            <div className="status-bar">
              <span>brew 4.2.16</span>
              <span className="status-divider">•</span>
              <span>tap homebrew/cask</span>
              <span className="status-divider">•</span>
              <span>16,387 apps synced</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
