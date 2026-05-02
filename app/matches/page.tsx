'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';

import MatchDetailModal from '@/components/MatchDetailModal';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtTime(utc: string): string {
  return new Date(utc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function StatusChip({ game }: { game: any }) {
  const state = game.gameState;

  if (state === 'FUT' || state === 'PRE') {
    return <span className="text-xs text-muted">{fmtTime(game.startTimeUTC)}</span>;
  }

  if (state === 'LIVE' || state === 'CRIT') {
    const p = game.period ?? 1;
    const t = game.clock?.timeRemaining ?? '';
    const inInt = game.clock?.inIntermission;
    const periodLabel =
      p > 3 ? (game.periodType === 'SO' ? 'SO' : 'OT') : `P${p}`;
    const label = inInt ? `${periodLabel} · INT` : `${periodLabel} ${t}`;
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
        {label}
      </span>
    );
  }

  const suffix =
    game.lastPeriodType === 'OT' ? ' OT' :
    game.lastPeriodType === 'SO' ? ' SO' : '';
  return <span className="text-xs font-semibold text-muted">FINAL{suffix}</span>;
}

function GameCard({ game, onClick }: { game: any; onClick: () => void }) {
  const isLive = game.gameState === 'LIVE' || game.gameState === 'CRIT';
  const hasScore = game.awayTeam.score !== null && game.homeTeam.score !== null;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-3 rounded-xl border bg-surface p-4 text-left transition-all hover:border-accent/60 hover:bg-hover ${
        isLive ? 'border-red-800/60' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Away team */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Image
            src={game.awayTeam.logo}
            alt={game.awayTeam.abbrev}
            width={30}
            height={30}
            unoptimized
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{game.awayTeam.name}</p>
            <p className="text-[11px] text-muted">{game.awayTeam.abbrev}</p>
          </div>
        </div>

        {/* Score / vs */}
        <div className="flex shrink-0 flex-col items-center gap-0.5 px-2">
          {hasScore ? (
            <span className="text-xl font-bold tabular-nums text-white">
              {game.awayTeam.score}–{game.homeTeam.score}
            </span>
          ) : (
            <span className="text-sm text-muted">vs</span>
          )}
          <StatusChip game={game} />
        </div>

        {/* Home team */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold text-white">{game.homeTeam.name}</p>
            <p className="text-[11px] text-muted">{game.homeTeam.abbrev}</p>
          </div>
          <Image
            src={game.homeTeam.logo}
            alt={game.homeTeam.abbrev}
            width={30}
            height={30}
            unoptimized
            className="shrink-0"
          />
        </div>
      </div>

      {/* SOG row — only when playing/finished */}
      {hasScore && (game.awayTeam.sog !== null || game.homeTeam.sog !== null) && (
        <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted">
          <span>{game.awayTeam.sog ?? '—'} SOG</span>
          <span>{game.homeTeam.sog ?? '—'} SOG</span>
        </div>
      )}
    </button>
  );
}

export default function MatchesPage() {
  const [date, setDate]                   = useState(''); // '' = score/now
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  const apiUrl = date ? `/api/matches?date=${date}` : '/api/matches';

  const { data, isLoading, error } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60_000,
  });

  const games: any[]         = data?.games ?? [];
  const currentDate: string  = data?.currentDate ?? date;
  const prevDate: string | undefined = data?.prevDate;
  const nextDate: string | undefined = data?.nextDate;

  const sorted = [...games].sort((a, b) => {
    const rank = (s: string) =>
      s === 'LIVE' || s === 'CRIT' ? 0 : s === 'FUT' || s === 'PRE' ? 1 : 2;
    const dr = rank(a.gameState) - rank(b.gameState);
    if (dr !== 0) return dr;
    return (a.startTimeUTC ?? '').localeCompare(b.startTimeUTC ?? '');
  });

  const isToday = !date || date === currentDate;

  return (
    <>
      {selectedGameId !== null && (
        <MatchDetailModal
          gameId={selectedGameId}
          onClose={() => setSelectedGameId(null)}
        />
      )}

      <div className="flex flex-col gap-5">
        {/* Header + date navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Matches</h1>

          <div className="flex items-center gap-1">
            <button
              onClick={() => prevDate && setDate(prevDate)}
              disabled={!prevDate}
              className="rounded px-2.5 py-1.5 text-muted transition-colors hover:bg-hover hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous day"
            >
              ←
            </button>

            <button
              onClick={() => setDate('')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors hover:bg-hover ${
                isToday ? 'text-white' : 'text-accent hover:text-white'
              }`}
            >
              {currentDate ? fmtDate(currentDate) : '…'}
            </button>

            <button
              onClick={() => nextDate && setDate(nextDate)}
              disabled={!nextDate}
              className="rounded px-2.5 py-1.5 text-muted transition-colors hover:bg-hover hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next day"
            >
              →
            </button>
          </div>
        </div>

        {isLoading && <LoadingSpinner />}
        {error     && <ErrorMsg />}

        {!isLoading && !error && sorted.length === 0 && (
          <div className="rounded-lg border border-border bg-surface p-10 text-center text-muted">
            No games scheduled for this date.
          </div>
        )}

        {!isLoading && !error && sorted.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((g) => (
              <GameCard
                key={g.gameId}
                game={g}
                onClick={() => setSelectedGameId(g.gameId)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent" />
    </div>
  );
}

function ErrorMsg() {
  return (
    <div className="rounded-lg border border-red-800 bg-red-900/20 p-6 text-center text-red-400">
      Failed to load matches.
    </div>
  );
}
