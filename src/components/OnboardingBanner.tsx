"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';

export default function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="onboarding-banner">
      <button onClick={() => setDismissed(true)} className="banner-dismiss" aria-label="Dismiss">
        <X size={16} />
      </button>
      <Sparkles size={24} />
      <div style={{ flex: 1 }}>
        <h3>Welcome to Keg! 🍺</h3>
        <p>Start with a curated collection or browse apps to build your perfect Mac setup.</p>
      </div>
      <div style={{ display: 'flex', gap: '0.8rem', alignSelf: 'center' }}>
        <Link href="/collections" style={{ textDecoration: 'none' }}>
          <button className="install-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontWeight: 600 }}>
            Browse Starter Packs
          </button>
        </Link>
      </div>
    </div>
  );
}
