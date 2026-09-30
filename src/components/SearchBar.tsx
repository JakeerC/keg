"use client";
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');

  useEffect(() => {
    // Prevent infinite loop by only pushing if the query actually changed
    const currentQuery = searchParams.get('query') || '';
    if (query === currentQuery) return;

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('query', query);
      } else {
        params.delete('query');
      }
      
      // Preserve category/filter if present when searching, or maybe not. 
      // Usually, it's fine to preserve them.
      router.push(`/?${params.toString()}`);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, router, searchParams]);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
      <input 
        type="text" 
        className="search-input" 
        placeholder="Search apps..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
