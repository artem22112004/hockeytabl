'use client';

import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function stateChip(state: string, period: number | null, lastPeriodType: string | null) {
  if (state === 'LIVE' || state === 'CRIT')
    return <span className="rounded bg-green-900/40 px-2 py-0.5 text-xs font-bold text-green-400 animate-pulse">LIVE · P{period}</span>;
  if (state === 'FUT' || state === 'PRE')
    return <span className="text-xs text-muted">Upcoming</span>;
  const suffix = lastPeriodType && lastPeriodType !== 'REG' ? `/${lastPeriodType}` : '';
  return <span className="text-xs text-muted">Final{suffix}</span>;
}

export default function MatchCenterPage() {
  const { data, isLoading } = useSWR<any>('/api/schedule', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60_000,
  });

  const games: any[] = data?.games ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Match Center</h1>
        <p className="text-sm text-muted">Click a game to see team stats</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent" />
        </div>
      )}

      {!isLoading && games.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-muted">
          No games scheduled right now.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {games.map((g: any) => {
          const isFinal = g.gameState === 'OFF' || g.gameState === 'FINAL';
          const isLive  = g.gameState === 'LIVE' || g.gameState === 'CRIT';
          const hasScore = (isFinal || isLive) && g.awayTeam.score !== null;

          return (
            <Link
              key={g.gameId}
              href={`/match-center/${g.gameId}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:border-accent hover:bg-hover"
            >
              {/* Away */}
              <div className="flex flex-1 items-center gap-3">
                <Image src={g.awayTeam.logo} alt={g.awayTeam.abbrev} width={36} height={36} unoptimized />
                <div>
                  <p className="font-semibold text-white">{g.awayTeam.name}</p>
                  <p className="text-xs text-muted">{g.awayTeam.abbrev}</p>
                </div>
              </div>

              {/* Score / status */}
              <div className="flex min-w-[120px] flex-col items-center gap-1">
                {hasScore ? (
                  <p className="text-2xl font-bold tabular-nums text-white">
                    {g.awayTeam.score} — {g.homeTeam.score}
                  </p>
                ) : (
                  <p className="text-base font-medium text-muted">vs</p>
                )}
                {stateChip(g.gameState, g.period, g.lastPeriodType)}
              </div>

              {/* Home */}
              <div className="flex flex-1 items-center justify-end gap-3">
                <div className="text-right">
                  <p className="font-semibold text-white">{g.homeTeam.name}</p>
                  <p className="text-xs text-muted">{g.homeTeam.abbrev}</p>
                </div>
                <Image src={g.homeTeam.logo} alt={g.homeTeam.abbrev} width={36} height={36} unoptimized />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
