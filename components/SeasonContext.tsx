'use client';

import { createContext, useContext, useState } from 'react';
import type { Season } from '@/types/nhl';

interface SeasonContextValue {
  season: Season;
  setSeason: (s: Season) => void;
}

const SeasonContext = createContext<SeasonContextValue>({
  season: '20242025',
  setSeason: () => {},
});

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [season, setSeason] = useState<Season>('20242025');
  return (
    <SeasonContext.Provider value={{ season, setSeason }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  return useContext(SeasonContext);
}
