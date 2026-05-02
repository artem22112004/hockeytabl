'use client';

import { createContext, useContext, useState } from 'react';

type Season = string;

interface SeasonContextValue {
  season: Season;
  setSeason: (s: Season) => void;
}

const SeasonContext = createContext<SeasonContextValue>({
  season: '20252026',
  setSeason: () => {},
});

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [season, setSeason] = useState<Season>('20252026');
  return (
    <SeasonContext.Provider value={{ season, setSeason }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  return useContext(SeasonContext);
}
