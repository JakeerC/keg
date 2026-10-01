'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function KindToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('kind') || 'both'

  const handleChange = (newKind: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newKind === 'both') {
      params.delete('kind')
    } else {
      params.set('kind', newKind)
    }
    params.delete('limit')
    router.push(`/?${params.toString()}`)
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.2rem',
        backgroundColor: 'var(--bg-card)',
        padding: '0.2rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}
    >
      <button
        onClick={() => handleChange('gui_app')}
        style={{
          padding: '0.4rem 0.8rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          backgroundColor:
            current === 'gui_app' ? 'var(--bg-main)' : 'transparent',
          color:
            current === 'gui_app' ? 'var(--text-primary)' : 'var(--text-muted)',
          boxShadow: current === 'gui_app' ? 'var(--shadow-sm)' : 'none'
        }}
      >
        Mac Apps
      </button>
      <button
        onClick={() => handleChange('both')}
        style={{
          padding: '0.4rem 0.8rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          backgroundColor:
            current === 'both' ? 'var(--bg-main)' : 'transparent',
          color:
            current === 'both' ? 'var(--text-primary)' : 'var(--text-muted)',
          boxShadow: current === 'both' ? 'var(--shadow-sm)' : 'none'
        }}
      >
        Both
      </button>
      <button
        onClick={() => handleChange('cli_tool')}
        style={{
          padding: '0.4rem 0.8rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          backgroundColor:
            current === 'cli_tool' ? 'var(--bg-main)' : 'transparent',
          color:
            current === 'cli_tool'
              ? 'var(--text-primary)'
              : 'var(--text-muted)',
          boxShadow: current === 'cli_tool' ? 'var(--shadow-sm)' : 'none'
        }}
      >
        CLI Tools
      </button>
    </div>
  )
}
