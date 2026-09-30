"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'installed', label: 'Most Installed' },
  { value: 'recent', label: 'Recently Updated' },
];

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('sort') || 'installed';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    params.delete('limit'); // Reset pagination on sort change
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="sort-dropdown">
      <ArrowUpDown size={14} />
      <select value={current} onChange={handleChange} className="sort-select">
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
