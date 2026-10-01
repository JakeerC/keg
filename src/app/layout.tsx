import type { Metadata } from "next";
import { Manrope } from "next/font/google";
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
import Sidebar from "@/components/Sidebar";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Keg — Discover Mac Apps & CLI Tools",
    template: "%s | Keg",
  },
  description: "Browse, discover, and install thousands of Mac apps and CLI tools from Homebrew and beyond.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={manrope.className}>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <div className="app-window">
          {/* Sidebar */}
          <Suspense fallback={<div className="sidebar" style={{ width: 260 }}></div>}>
            <Sidebar />
          </Suspense>

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
        </ThemeProvider>
      </body>
    </html>
  );
}
