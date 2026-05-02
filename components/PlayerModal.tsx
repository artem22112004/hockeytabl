'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import Image from 'next/image';

interface Props {
  playerId: number;
  playerName: string;
  headshot: string;
  teamAbbrev: string;
  season: string;
  onClose: () => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function pmClass(v: number) {
  if (v > 0) return 'text-green-400';
  if (v < 0) return 'text-red-400';
  return 'text-muted';
}

function pmLabel(v: number) {
  return v > 0 ? `+${v}` : String(v);
}

export default function PlayerModal({
  playerId,
  playerName,
  headshot,
  teamAbbrev,
  season,
  onClose,
}: Props) {
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
    `/api/player/${playerId}/game-log?season=${season}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const games: any[] = (data?.gameLog ?? []).slice(0, 10);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-surface shadow-2xl">

        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Image
            src={headshot}
            alt={playerName}
            width={44}
            height={44}
            className="rounded-full object-cover"
            unoptimized
          />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{playerName}</h2>
            <p className="text-sm text-muted">{teamAbbrev} · Last 10 games</p>
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
            <p className="py-8 text-center text-sm text-red-400">
              Failed to load game log.
            </p>
          )}

          {!isLoading && !error && games.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">No games found.</p>
          )}

          {!isLoading && !error && games.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-surface/80">
                    {['Date', 'Opp', 'G', 'A', 'PTS', '+/−', 'SOG', 'TOI'].map((h) => (
                      <th
                        key={h}
                        className="border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {games.map((g: any, i: number) => (
                    <tr
                      key={g.gameId}
                      className={`border-b border-border transition-colors hover:bg-hover ${
                        i % 2 === 0 ? 'bg-base' : 'bg-surface/40'
                      }`}
                    >
                      <td className="px-3 py-2 text-muted">{g.gameDate}</td>
                      <td className="px-3 py-2">
                        <span className="text-muted">{g.homeRoadFlag === 'H' ? 'vs' : '@'}</span>{' '}
                        <span className="font-medium text-white">{g.opponentAbbrev}</span>
                      </td>
                      <td className="px-3 py-2 font-semibold">{g.goals}</td>
                      <td className="px-3 py-2">{g.assists}</td>
                      <td className="px-3 py-2 font-bold text-accent">{g.points}</td>
                      <td className={`px-3 py-2 ${pmClass(g.plusMinus)}`}>
                        {pmLabel(g.plusMinus)}
                      </td>
                      <td className="px-3 py-2">{g.shots}</td>
                      <td className="px-3 py-2 text-muted">{g.toi}</td>
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
