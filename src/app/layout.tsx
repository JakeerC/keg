import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'

import Sidebar from '@/components/Sidebar'
import { Suspense } from 'react'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: {
    default: 'Keg — Discover Mac Apps & CLI Tools',
    template: '%s | Keg'
  },
  description:
    'Browse, discover, and install thousands of Mac apps and CLI tools from Homebrew and beyond.'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={manrope.className}>
        <svg
          width="0"
          height="0"
          style={{ position: 'absolute' }}
          aria-hidden="true"
        >
          <filter
            id="lg-filter"
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              href="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22420%22%20height%3D%22280%22%20viewBox%3D%220%200%20420%20280%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22Y%22%20x1%3D%220%22%20x2%3D%220%22%20y1%3D%223%25%22%20y2%3D%2297%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230F0%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23000%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22X%22%20x1%3D%222%25%22%20x2%3D%2298%25%22%20y1%3D%220%22%20y2%3D%220%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23F00%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23000%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22420%22%20height%3D%22280%22%20fill%3D%22%23808080%22%2F%3E%3Cg%20filter%3D%22blur(2px)%22%3E%3Crect%20width%3D%22420%22%20height%3D%22280%22%20fill%3D%22%23000080%22%2F%3E%3Crect%20width%3D%22420%22%20height%3D%22280%22%20fill%3D%22url(%23Y)%22%20style%3D%22mix-blend-mode%3Ascreen%22%2F%3E%3Crect%20width%3D%22420%22%20height%3D%22280%22%20fill%3D%22url(%23X)%22%20style%3D%22mix-blend-mode%3Ascreen%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%226%22%20width%3D%22408%22%20height%3D%22268%22%20rx%3D%2234%22%20ry%3D%2234%22%20fill%3D%22%23808080%22%20filter%3D%22blur(6px)%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E"
              result="displacementMap"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacementMap"
              scale="72"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        <style
          dangerouslySetInnerHTML={{
            __html: `
          .app-card, .hero-card, .collection-card, .install-btn, .app-icon, .hero-icon-wrapper {
            backdrop-filter: url(#lg-filter) blur(8px) saturate(1.8) brightness(1.15) !important;
            -webkit-backdrop-filter: url(#lg-filter) blur(8px) saturate(1.8) brightness(1.15) !important;
          }
        `
          }}
        />
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
        >
          <div className="app-window">
            {/* Sidebar */}
            <Suspense
              fallback={<div className="sidebar" style={{ width: 260 }}></div>}
            >
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
  )
}
