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
              href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iWSIgeDE9IjAiIHgyPSIwIiB5MT0iMyUiIHkyPSI5NyUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwRjAiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMDAiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iWCIgeDE9IjIlIiB4Mj0iOTglIiB5MT0iMCIgeTI9IjAiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGMDAiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMDAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjODA4MDgwIi8+PGcgZmlsdGVyPSJibHVyKDJweCkiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMwMDAwODAiLz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI1kpIiBzdHlsZT0ibWl4LWJsZW5kLW1vZGU6c2NyZWVuIi8+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNYKSIgc3R5bGU9Im1peC1ibGVuZC1tb2RlOnNjcmVlbiIvPjxyZWN0IHg9IjMlIiB5PSI1JSIgd2lkdGg9Ijk0JSIgaGVpZ2h0PSI5MCUiIHJ4PSIxNiIgcnk9IjE2IiBmaWxsPSIjODA4MDgwIiBmaWx0ZXI9ImJsdXIoMTRweCkiLz48L2c+PC9zdmc+"
              result="displacementMap"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacementMap"
              scale="80"
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
