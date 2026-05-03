'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtTime(utc: string): string {
  try { return new Date(utc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
}

function StatusBadge({ game }: { game: any }) {
  const s = game.gameState;
  if (s === 'LIVE' || s === 'CRIT') {
    const p = game.period ?? 1;
    const t = game.clock?.timeRemaining ?? '';
    const inInt = game.clock?.inIntermission;
    const pLabel = p > 3 ? (game.periodType === 'SO' ? 'SO' : 'OT') : `P${p}`;
    const label = inInt ? `${pLabel} INT` : `${pLabel} ${t}`;
    return (
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
        <span className="text-xs font-bold text-red-400">{label}</span>
      </div>
    );
  }
  if (s === 'OFF' || s === 'FINAL') {
    const suffix = game.lastPeriodType === 'OT' ? '/OT' : game.lastPeriodType === 'SO' ? '/SO' : '';
    return <span className="text-[11px] font-semibold text-[#94A3B8]">FINAL{suffix}</span>;
  }
  return <span className="text-[11px] text-[#94A3B8]">{fmtTime(game.startTimeUTC)}</span>;
}

function GameCard({ game }: { game: any }) {
  const isLive  = game.gameState === 'LIVE' || game.gameState === 'CRIT';
  const isFinal = game.gameState === 'OFF'  || game.gameState === 'FINAL';
  const hasScore = (isLive || isFinal) && game.awayTeam.score !== null;

  return (
    <Link
      href={`/match/${game.gameId}`}
      className={`group flex flex-col gap-3 rounded-xl border bg-[#111520] p-4 transition-all hover:border-[#00D1FF]/40 hover:bg-[#161c2e] hover:shadow-[0_4px_20px_rgba(0,209,255,0.08)] ${
        isLive ? 'border-red-700/50' : 'border-[#1e2d45]'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Away */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Image src={game.awayTeam.logo} alt={game.awayTeam.abbrev} width={32} height={32} unoptimized className="shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{game.awayTeam.name}</p>
            <p className="font-mono text-[11px] text-[#94A3B8]">{game.awayTeam.abbrev}</p>
          </div>
        </div>

        {/* Score/status */}
        <div className="flex shrink-0 flex-col items-center gap-1 px-1">
          {hasScore ? (
            <span className="font-mono text-xl font-bold tabular-nums text-white">
              {game.awayTeam.score}–{game.homeTeam.score}
            </span>
          ) : (
            <span className="text-sm text-[#94A3B8]">vs</span>
          )}
          <StatusBadge game={game} />
        </div>

        {/* Home */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold text-white">{game.homeTeam.name}</p>
            <p className="font-mono text-[11px] text-[#94A3B8]">{game.homeTeam.abbrev}</p>
          </div>
          <Image src={game.homeTeam.logo} alt={game.homeTeam.abbrev} width={32} height={32} unoptimized className="shrink-0" />
        </div>
      </div>

      {/* SOG */}
      {(game.awayTeam.sog !== null || game.homeTeam.sog !== null) && (
        <div className="flex items-center justify-between border-t border-[#1e2d45] pt-2 text-[11px] text-[#94A3B8]">
          <span className="font-mono">{game.awayTeam.sog ?? '—'} SOG</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1e2d45]">SOG</span>
          <span className="font-mono">{game.homeTeam.sog ?? '—'} SOG</span>
        </div>
      )}
    </Link>
  );
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">{label}</span>
      <span className="font-mono text-[11px] text-[#1e2d45]">·</span>
      <span className="font-mono text-[11px] text-[#94A3B8]">{count}</span>
      <div className="h-px flex-1 bg-[#1e2d45]" />
    </div>
  );
}

export default function HomePage() {
  const [date, setDate] = useState('');

  const apiUrl = date ? `/api/matches?date=${date}` : '/api/matches';
  const { data, isLoading } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30_000,
  });

  const games: any[]                 = data?.games ?? [];
  const currentDate: string          = data?.currentDate ?? date;
  const prevDate: string | undefined = data?.prevDate;
  const nextDate: string | undefined = data?.nextDate;

  const playoffs = games.filter((g) => g.gameType === 3);
  const regular  = games.filter((g) => g.gameType !== 3);

  const isToday = !date || date === currentDate;

  return (
    <div className="flex flex-col gap-5">

      {/* Date nav */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Games</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => prevDate && setDate(prevDate)}
            disabled={!prevDate}
            className="rounded px-2.5 py-1.5 text-[#94A3B8] transition-colors hover:bg-[#161c2e] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >←</button>
          <button
            onClick={() => setDate('')}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#161c2e] ${
              isToday ? 'text-white' : 'text-[#00D1FF] hover:text-white'
            }`}
          >
            {currentDate ? fmtDate(currentDate) : '…'}
          </button>
          <button
            onClick={() => nextDate && setDate(nextDate)}
            disabled={!nextDate}
            className="rounded px-2.5 py-1.5 text-[#94A3B8] transition-colors hover:bg-[#161c2e] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >→</button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1e2d45] border-t-[#00D1FF]" />
        </div>
      )}

      {!isLoading && games.length === 0 && (
        <div className="rounded-xl border border-[#1e2d45] bg-[#111520] p-12 text-center text-[#94A3B8]">
          No games scheduled for this date.
        </div>
      )}

      {!isLoading && playoffs.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionLabel label="Playoffs" count={playoffs.length} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {playoffs.map((g) => <GameCard key={g.gameId} game={g} />)}
          </div>
        </div>
      )}

      {!isLoading && regular.length > 0 && (
        <div className="flex flex-col gap-3">
          {playoffs.length > 0 && <SectionLabel label="Regular Season" count={regular.length} />}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {regular.map((g) => <GameCard key={g.gameId} game={g} />)}
          </div>
        </div>
      )}
    </div>
  );
}
