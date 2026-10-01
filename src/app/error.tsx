'use client';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <AlertTriangle size={48} color="var(--accent-orange)" />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Something went wrong</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 400, marginBottom: '1rem' }}>
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => reset()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            cursor: 'pointer',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: 'var(--border-color)'
          }}
        >
          <RotateCcw size={18} />
          Try again
        </button>
        <Link 
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontWeight: 600,
          }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
