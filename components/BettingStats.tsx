'use client';

import useSWR from 'swr';
import Image from 'next/image';
import TotalsTable from './TotalsTable';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Props {
  abbrev: string;
  name:   string;
  logo:   string;
  season: string;
}

export default function BettingStats({ abbrev, name, logo, season }: Props) {
  const { data, isLoading } = useSWR<any>(
    `/api/team/${abbrev}/season-games?season=${season}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const games: any[] = data?.games ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <Image src={logo} alt={abbrev} width={24} height={24} unoptimized />
        <h3 className="text-sm font-semibold text-white">{name}</h3>
        <span className="ml-auto text-xs text-muted">Last 20 games</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-border border-t-[#3b82f6]" />
        </div>
      ) : games.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No data available.</p>
      ) : (
        <TotalsTable games={games} />
      )}
    </div>
  );
}
