"use client";

import React, { useState } from 'react';

export default function AppIcon({ token, isHero }: { token: string; isHero?: boolean }) {
  const [error, setError] = useState(false);
  // Instead of 100% which covers the whole glass background, use a fixed relative size
  const sizeClass = isHero ? { width: '84px', height: '84px', objectFit: 'contain' as const, borderRadius: '18px' } : undefined;

  if (error) {
    return <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: isHero ? '4rem' : '1.5rem' }}>⌘</span>;
  }

  return (
    <img 
      src={`https://raw.githubusercontent.com/alielsokary/CaskFlow/icons/${token}.png`} 
      alt=""
      style={sizeClass}
      onError={() => setError(true)}
    />
  );
}
