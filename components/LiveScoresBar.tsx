'use client';

import useSWR from 'swr';
import Link from 'next/link';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function periodLabel(g: any): string {
  const p = g.period;
  if (!p) return '';
  if (g.periodType === 'OT') return 'OT';
  if (g.periodType === 'SO') return 'SO';
  if (p === 1) return '1st';
  if (p === 2) return '2nd';
  if (p === 3) return '3rd';
  return `P${p}`;
}

function fmtTime(utc: string): string {
  if (!utc) return '';
  try {
    return new Date(utc).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    });
  } catch { return ''; }
}

function GameChip({ g }: { g: any }) {
  const isLive  = g.gameState === 'LIVE' || g.gameState === 'CRIT';
  const isFinal = g.gameState === 'OFF'  || g.gameState === 'FINAL';
  const hasScore = g.homeTeam.score !== null;

  return (
    <Link
      href={`/match-center/${g.gameId}`}
      className="flex shrink-0 items-center gap-2 px-4 transition-colors hover:bg-[#1e2d45]/50"
    >
      <Image src={g.awayTeam.logo} alt={g.awayTeam.abbrev} width={14} height={14} unoptimized />
      <span className="font-mono text-[11px] font-semibold text-white">{g.awayTeam.abbrev}</span>

      {hasScore ? (
        <span className="font-mono text-[11px] font-bold text-white tabular-nums">
          {g.awayTeam.score}–{g.homeTeam.score}
        </span>
      ) : (
        <span className="px-1 text-[10px] text-muted">vs</span>
      )}

      <span className="font-mono text-[11px] font-semibold text-white">{g.homeTeam.abbrev}</span>
      <Image src={g.homeTeam.logo} alt={g.homeTeam.abbrev} width={14} height={14} unoptimized />

      {isLive ? (
        <span className="flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          {periodLabel(g)}
          {g.clock && !g.clock.inIntermission && g.clock.timeRemaining}
          {g.clock?.inIntermission && 'INT'}
        </span>
      ) : isFinal ? (
        <span className="rounded bg-[#1e2d45] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted">
          FINAL{g.lastPeriodType === 'OT' ? '/OT' : g.lastPeriodType === 'SO' ? '/SO' : ''}
        </span>
      ) : (
        <span className="text-[10px] text-muted">{fmtTime(g.startTimeUTC)}</span>
      )}

      <span className="ml-2 text-[#1e2d45]">|</span>
    </Link>
  );
}

export default function LiveScoresBar() {
  const { data } = useSWR('/api/matches', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30_000,
    dedupingInterval: 15_000,
  });

  const games: any[] = data?.games ?? [];
  if (!games.length) return null;

  const liveCount = games.filter(
    (g) => g.gameState === 'LIVE' || g.gameState === 'CRIT'
  ).length;

  return (
    <div className="relative flex h-9 items-center overflow-hidden border-b border-[#1e2d45] bg-[#0d1117]">
      {/* Fixed label */}
      <div className="relative z-10 flex shrink-0 items-center gap-2 border-r border-[#1e2d45] bg-[#0d1117] px-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted">NHL</span>
        {liveCount > 0 && (
          <span className="flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            {liveCount} LIVE
          </span>
        )}
      </div>

      {/* Ticker */}
      <div className="flex flex-1 overflow-hidden">
        <div className="ticker-animate flex items-center whitespace-nowrap">
          {games.map((g) => <GameChip key={`a-${g.gameId}`} g={g} />)}
          {games.map((g) => <GameChip key={`b-${g.gameId}`} g={g} />)}
        </div>
      </div>
    </div>
  );
}
