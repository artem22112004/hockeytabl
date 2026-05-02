'use client';

import { SEASONS } from '@/lib/nhl-api';
import { useSeason } from './SeasonContext';

export default function SeasonSelector() {
  const { season, setSeason } = useSeason();
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted">Season</span>
      <select
        value={season}
        onChange={(e) => setSeason(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-white transition-colors focus:border-[#3b82f6]/50 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]/40"
      >
        {SEASONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
