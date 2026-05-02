'use client';

import Navbar from './Navbar';
import { useSeason } from './SeasonContext';

export default function NavbarWrapper() {
  const { season, setSeason } = useSeason();
  return <Navbar season={season} onSeasonChange={setSeason} />;
}
