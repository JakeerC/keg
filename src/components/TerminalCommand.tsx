"use client";

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function TerminalCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--bg-main)', 
      padding: '0.8rem 1rem', 
      borderRadius: '8px', 
      fontFamily: 'monospace', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      border: '1px solid var(--border-color)',
      marginBottom: '0.8rem'
    }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{command}</span>
      <button 
        onClick={handleCopy}
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          color: copied ? 'var(--accent-green)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.2rem'
        }}
        aria-label="Copy command"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}
