"use client";

import React, { useState } from 'react';
import Image from 'next/image';

export default function AppIcon({ token, isHero }: { token: string; isHero?: boolean }) {
  const [error, setError] = useState(false);
  // Instead of 100% which covers the whole glass background, use a fixed relative size
  const sizeClass = isHero ? { width: '84px', height: '84px', objectFit: 'contain' as const, borderRadius: '18px' } : undefined;

  if (error) {
    return <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: isHero ? '4rem' : '1.5rem' }}>⌘</span>;
  }

  return (
    <div style={{ position: 'relative', ...(sizeClass || { width: '48px', height: '48px' }) }}>
      <Image 
        src={`https://raw.githubusercontent.com/alielsokary/CaskFlow/icons/${token}.png`} 
        alt={`${token} icon`}
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ objectFit: 'contain', borderRadius: sizeClass?.borderRadius || '12px' }}
        onError={() => setError(true)}
      />
    </div>
  );
}
