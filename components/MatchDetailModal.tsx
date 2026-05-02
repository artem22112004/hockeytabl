'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import Image from 'next/image';

import Portal from './Portal';
import { teamLogoUrl } from '@/lib/nhl-api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ResultChip({ isWin, isOT }: { isWin: boolean; isOT: boolean }) {
  const label = isWin ? (isOT ? 'W/OT' : 'W') : (isOT ? 'L/OT' : 'L');
  return (
    <span
      className={`inline-flex w-10 items-center justify-center rounded px-1 py-0.5 text-[10px] font-bold ${
        isWin
          ? 'bg-green-900/60 text-green-400'
          : 'bg-red-900/60 text-red-400'
      }`}
    >
      {label}
    </span>
  );
}

function StatBar({
  label,
  awayVal,
  homeVal,
}: {
  label: string;
  awayVal: number | string | null;
  homeVal: number | string | null;
}) {
  const aNum = typeof awayVal === 'number' ? awayVal : null;
  const hNum = typeof homeVal === 'number' ? homeVal : null;
  const total = (aNum ?? 0) + (hNum ?? 0);
  const awayPct = total > 0 && aNum !== null ? (aNum / total) * 100 : 50;

  const fmt = (v: number | string | null) => {
    if (v === null) return '—';
    if (typeof v === 'number')
      return Number.isInteger(v) ? String(v) : v.toFixed(1);
    return v;
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="w-14 font-semibold tabular-nums text-white">{fmt(awayVal)}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted">{label}</span>
        <span className="w-14 text-right font-semibold tabular-nums text-white">{fmt(homeVal)}</span>
      </div>
      {aNum !== null && hNum !== null && total > 0 && (
        <div className="flex h-1 overflow-hidden rounded-full bg-border">
          <div className="bg-blue-500/60 transition-all" style={{ width: `${awayPct}%` }} />
          <div className="bg-accent transition-all" style={{ width: `${100 - awayPct}%` }} />
        </div>
      )}
    </div>
  );
}

function LastFivePanel({ team, games }: { team: any; games: any[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <Image src={team.logo} alt={team.abbrev} width={18} height={18} unoptimized />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {team.abbrev} · Last 5
        </span>
      </div>

      {!games || games.length === 0 ? (
        <p className="text-[11px] text-muted">No data</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {[...games].reverse().map((g: any) => (
            <div key={g.gameId} className="flex items-center gap-2">
              <ResultChip isWin={g.isWin} isOT={g.isOT} />
              <span className="text-[11px] text-muted">
                {g.homeOrAway === 'H' ? 'vs' : '@'}
              </span>
              <Image
                src={teamLogoUrl(g.oppAbbrev)}
                alt={g.oppAbbrev}
                width={14}
                height={14}
                unoptimized
              />
              <span className="flex-1 text-[11px] text-white">{g.oppAbbrev}</span>
              <span className="text-[11px] tabular-nums text-muted">
                {g.gf}–{g.ga}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MatchDetailModal({
  gameId,
  onClose,
}: {
  gameId: number;
  onClose: () => void;
}) {
  const { data, isLoading } = useSWR(`/api/match/${gameId}`, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30_000,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const d = data;
  const isLive  = d?.gameState === 'LIVE' || d?.gameState === 'CRIT';
  const isFinal = d?.gameState === 'OFF'  || d?.gameState === 'FINAL';

  function statusLabel(): string {
    if (!d) return '';
    if (d.gameState === 'FUT' || d.gameState === 'PRE') return 'Scheduled';
    if (isLive) {
      const p = d.period ?? 1;
      const periodLabel = p > 3
        ? (d.periodType === 'SO' ? 'SO' : 'OT')
        : `Period ${p}`;
      const t      = d.clock?.timeRemaining ?? '';
      const inInt  = d.clock?.inIntermission;
      return inInt ? `${periodLabel} · Intermission` : `${periodLabel} · ${t}`;
    }
    if (isFinal) {
      const sfx =
        d.lastPeriodType === 'OT' ? ' (OT)' :
        d.lastPeriodType === 'SO' ? ' (SO)' : '';
      return `Final${sfx}`;
    }
    return '';
  }

  const stats    = d?.teamStats;
  const hasStats = stats?.home?.shots !== null || stats?.away?.shots !== null;

  const statRows = hasStats
    ? [
        { label: 'Shots',     away: stats.away.shots,       home: stats.home.shots       },
        { label: 'Hits',      away: stats.away.hits,        home: stats.home.hits        },
        { label: 'FOW %',     away: stats.away.faceoffPctg, home: stats.home.faceoffPctg },
        { label: 'PP',        away: stats.away.ppConv,      home: stats.home.ppConv      },
        { label: 'Blocked',   away: stats.away.blocked,     home: stats.home.blocked     },
        { label: 'Giveaways', away: stats.away.giveaways,   home: stats.home.giveaways   },
        { label: 'Takeaways', away: stats.away.takeaways,   home: stats.home.takeaways   },
        { label: 'PIM',       away: stats.away.pim,         home: stats.home.pim         },
      ].filter(({ away, home }) => away !== null || home !== null)
    : [];

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="relative my-8 w-full max-w-lg rounded-2xl border border-border bg-base shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-muted hover:bg-hover hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
            </div>
          )}

          {d && (
            <div className="flex flex-col gap-5 p-5 pt-10">

              {/* Match header */}
              <div className="flex items-center justify-between gap-3">
                {/* Away */}
                <div className="flex flex-1 flex-col items-center gap-2">
                  <Image
                    src={d.awayTeam.logo}
                    alt={d.awayTeam.abbrev}
                    width={52}
                    height={52}
                    unoptimized
                  />
                  <span className="text-center text-sm font-semibold text-white leading-tight">
                    {d.awayTeam.name}
                  </span>
                  <span className="text-xs text-muted">{d.awayTeam.abbrev}</span>
                </div>

                {/* Score */}
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  {d.awayTeam.score !== null && d.homeTeam.score !== null ? (
                    <span className="text-4xl font-bold tabular-nums text-white">
                      {d.awayTeam.score}–{d.homeTeam.score}
                    </span>
                  ) : (
                    <span className="text-2xl text-muted">vs</span>
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      isLive ? 'text-red-400' : 'text-muted'
                    }`}
                  >
                    {isLive && (
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-400 align-middle" />
                    )}
                    {statusLabel()}
                  </span>
                </div>

                {/* Home */}
                <div className="flex flex-1 flex-col items-center gap-2">
                  <Image
                    src={d.homeTeam.logo}
                    alt={d.homeTeam.abbrev}
                    width={52}
                    height={52}
                    unoptimized
                  />
                  <span className="text-center text-sm font-semibold text-white leading-tight">
                    {d.homeTeam.name}
                  </span>
                  <span className="text-xs text-muted">{d.homeTeam.abbrev}</span>
                </div>
              </div>

              {/* Team stats */}
              {statRows.length > 0 && (
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="mb-3 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted">
                    <span>{d.awayTeam.abbrev}</span>
                    <span>Stats</span>
                    <span>{d.homeTeam.abbrev}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {statRows.map(({ label, away, home }) => (
                      <StatBar key={label} label={label} awayVal={away} homeVal={home} />
                    ))}
                  </div>
                </div>
              )}

              {/* Last 5 games */}
              <div className="grid grid-cols-2 gap-3">
                <LastFivePanel team={d.awayTeam} games={d.awayLastFive ?? []} />
                <LastFivePanel team={d.homeTeam} games={d.homeLastFive ?? []} />
              </div>

            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
