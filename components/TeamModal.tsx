'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import Image from 'next/image';

interface Props {
  abbrev: string;
  teamName: string;
  teamLogo: string;
  season: string;
  onClose: () => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function resultStyle(r: string) {
  if (r.startsWith('W')) return 'text-green-400 font-bold';
  if (r === 'L')         return 'text-red-400 font-semibold';
  return 'text-yellow-400 font-semibold';
}

export default function TeamModal({ abbrev, teamName, teamLogo, season, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const { data, error, isLoading } = useSWR<any>(
    `/api/team/${abbrev}/schedule?season=${season}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const games: any[] = data?.games ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-surface shadow-2xl">

        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Image src={teamLogo} alt={abbrev} width={44} height={44} unoptimized />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{teamName}</h2>
            <p className="text-sm text-muted">{abbrev} · Last 10 games</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
            </div>
          )}

          {error && (
            <p className="py-8 text-center text-sm text-red-400">Failed to load schedule.</p>
          )}

          {!isLoading && !error && games.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">No completed games found.</p>
          )}

          {!isLoading && !error && games.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-surface/80">
                    {['Date', 'Opponent', 'GF', 'GA', 'Result'].map((h) => (
                      <th key={h} className="border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {games.map((g: any, i: number) => (
                    <tr key={g.gameId}
                      className={`border-b border-border transition-colors hover:bg-hover ${i % 2 === 0 ? 'bg-base' : 'bg-surface/40'}`}
                    >
                      <td className="px-3 py-2 text-muted">{g.gameDate}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted text-xs">{g.homeOrAway === 'H' ? 'vs' : '@'}</span>
                          <Image src={g.oppLogo} alt={g.oppAbbrev} width={20} height={20} unoptimized />
                          <span className="font-medium text-white">{g.oppAbbrev}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-semibold">{g.gf}</td>
                      <td className="px-3 py-2 text-muted">{g.ga}</td>
                      <td className={`px-3 py-2 ${resultStyle(g.result)}`}>{g.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
