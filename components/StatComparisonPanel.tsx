'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import useSWR from 'swr';
import type { TrendPoint } from './TrendChart';

const TrendChart = dynamic(() => import('./TrendChart'), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type StatCat = 'goals' | 'shots' | 'hits' | 'pim' | 'faceoffs' | 'pp' | 'pk';
type Venue   = 'all' | 'H' | 'A';

const CATS: { id: StatCat; label: string }[] = [
  { id: 'goals',    label: 'Goals' },
  { id: 'shots',    label: 'Shots' },
  { id: 'hits',     label: 'Hits' },
  { id: 'pim',      label: 'PIM' },
  { id: 'faceoffs', label: 'Faceoffs' },
  { id: 'pp',       label: 'PP%' },
  { id: 'pk',       label: 'PK%' },
];

const VENUES: { id: Venue; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'A',   label: 'Away' },
  { id: 'H',   label: 'Home' },
];

interface Props {
  awayAbbrev: string;
  awayName:   string;
  awayLogo:   string;
  homeAbbrev: string;
  homeName:   string;
  homeLogo:   string;
  season:     string;
}

function fmtDate(d: string) { return d?.slice(5) ?? d; }

function numAvg(vals: (number | null | undefined)[]) {
  const clean = vals.filter((v): v is number => v != null);
  if (!clean.length) return null;
  return +(clean.reduce((a, b) => a + b, 0) / clean.length).toFixed(2);
}

type ColDef = { key: string; label: string; fmt: (v: any) => any };

function getColumns(c: StatCat): ColDef[] {
  switch (c) {
    case 'goals':
      return [
        { key: 'gf',    label: 'GF',  fmt: (v) => v ?? '—' },
        { key: 'ga',    label: 'GA',  fmt: (v) => v ?? '—' },
        { key: 'total', label: 'Tot', fmt: (v) => v ?? '—' },
      ];
    case 'shots':
      return [
        { key: 'shots',        label: 'SOG', fmt: (v) => v ?? '—' },
        { key: 'shotsAgainst', label: 'SA',  fmt: (v) => v ?? '—' },
      ];
    case 'hits':
      return [
        { key: 'hits',        label: 'Hits', fmt: (v) => v ?? '—' },
        { key: 'hitsAgainst', label: 'HA',   fmt: (v) => v ?? '—' },
      ];
    case 'pim':
      return [
        { key: 'pim',        label: 'PIM',     fmt: (v) => v ?? '—' },
        { key: 'pimAgainst', label: 'Opp PIM', fmt: (v) => v ?? '—' },
      ];
    case 'faceoffs':
      return [
        { key: 'faceoffPctg', label: 'FO%', fmt: (v) => v != null ? `${v.toFixed(1)}%` : '—' },
      ];
    default:
      return [];
  }
}

export default function StatComparisonPanel({
  awayAbbrev, awayName, awayLogo,
  homeAbbrev, homeName, homeLogo,
  season,
}: Props) {
  const [cat,   setCat]   = useState<StatCat>('goals');
  const [venue, setVenue] = useState<Venue>('all');

  const swrOpts = { revalidateOnFocus: false, dedupingInterval: 300_000 };

  const { data: awayLogData, isLoading: awayLoading } = useSWR(
    `/api/team/${awayAbbrev}/game-log?season=${season}&limit=20`, fetcher, swrOpts
  );
  const { data: homeLogData, isLoading: homeLoading } = useSWR(
    `/api/team/${homeAbbrev}/game-log?season=${season}&limit=20`, fetcher, swrOpts
  );
  const { data: awayStatsData } = useSWR(
    `/api/team/${awayAbbrev}/season-stats?season=${season}`, fetcher, swrOpts
  );
  const { data: homeStatsData } = useSWR(
    `/api/team/${homeAbbrev}/season-stats?season=${season}`, fetcher, swrOpts
  );
  const { data: standData } = useSWR('/api/teams', fetcher, swrOpts);

  const awayLog: any[] = awayLogData?.games ?? [];
  const homeLog: any[] = homeLogData?.games ?? [];
  const awayTs = awayStatsData?.teamStats ?? null;
  const homeTs = homeStatsData?.teamStats ?? null;

  const standings: any[] = standData?.standings ?? [];
  function getGPG(abbrev: string) {
    const t = standings.find((s: any) => s.teamAbbrev?.default === abbrev);
    if (!t?.gamesPlayed) return { gf: null as number | null, ga: null as number | null };
    return {
      gf: +(t.goalFor  / t.gamesPlayed).toFixed(2) as number,
      ga: +(t.goalAgainst / t.gamesPlayed).toFixed(2) as number,
    };
  }

  const awayGPG = getGPG(awayAbbrev);
  const homeGPG = getGPG(homeAbbrev);

  function getAvg(ts: any, gpg: { gf: number | null; ga: number | null }, log: any[]) {
    switch (cat) {
      case 'goals':    return { for: gpg.gf,   against: gpg.ga };
      case 'shots':    return { for: ts?.shotsForPerGame ?? null, against: ts?.shotsAgainstPerGame ?? null };
      case 'hits':     return { for: numAvg(log.map((g) => g.hits)),    against: null };
      case 'pim':      return { for: numAvg(log.map((g) => g.pim)),     against: null };
      case 'faceoffs': return { for: ts?.faceoffWinPctg != null ? +(ts.faceoffWinPctg * 100).toFixed(1) : null, against: null };
      case 'pp':       return { for: ts?.powerPlayPctg  != null ? +(ts.powerPlayPctg  * 100).toFixed(1) : null, against: null };
      case 'pk':       return { for: ts?.penaltyKillPctg!= null ? +(ts.penaltyKillPctg* 100).toFixed(1) : null, against: null };
    }
  }

  const awayAvg = getAvg(awayTs, awayGPG, awayLog);
  const homeAvg = getAvg(homeTs, homeGPG, homeLog);

  const isPct = cat === 'pp' || cat === 'pk';

  function filteredLast10(log: any[]) {
    const filtered = venue === 'all' ? log : log.filter((g) => g.homeOrAway === venue);
    return filtered.slice(-10).reverse();
  }

  const awayGames = filteredLast10(awayLog);
  const homeGames = filteredLast10(homeLog);
  const cols      = getColumns(cat);

  function buildTrend(log: any[]): TrendPoint[] {
    const key = cat === 'pp' ? 'ppPctg' : 'pkPctg';
    return log
      .filter((g) => (g.ppOpps ?? 0) > 0 && g[key] != null)
      .map((g, i) => ({ game: i + 1, value: g[key] as number, date: fmtDate(g.gameDate), opp: g.oppAbbrev }));
  }

  const isLoading = awayLoading || homeLoading;

  const fmtAvg = (v: number | null) =>
    v == null ? '—' : (cat === 'faceoffs' || cat === 'pp' || cat === 'pk' ? `${v}%` : String(v));

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">

      {/* Team headers */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src={awayLogo} alt={awayAbbrev} width={28} height={28} unoptimized />
          <span className="font-semibold text-white">{awayName}</span>
          <span className="text-xs text-muted">AWAY</span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">vs</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">HOME</span>
          <span className="font-semibold text-white">{homeName}</span>
          <Image src={homeLogo} alt={homeAbbrev} width={28} height={28} unoptimized />
        </div>
      </div>

      {/* Category buttons */}
      <div className="flex flex-wrap justify-center gap-1">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-all duration-150 ${
              cat === c.id
                ? 'bg-gradient-to-r from-[#3b82f6]/20 to-[#06b6d4]/20 text-white ring-1 ring-[#3b82f6]/40'
                : 'text-muted hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Venue filter (hidden for PP/PK charts) */}
      {!isPct && (
        <div className="flex justify-center gap-1">
          {VENUES.map((v) => (
            <button
              key={v.id}
              onClick={() => setVenue(v.id)}
              className={`rounded-md px-2.5 py-0.5 text-xs font-medium transition-all ${
                venue === v.id ? 'bg-[#1e2a3e] text-white' : 'text-muted hover:text-white'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {/* Season averages */}
      <div className="grid grid-cols-2 divide-x divide-border rounded-lg bg-base">
        <div className="flex flex-col items-start gap-0.5 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{awayAbbrev} Season Avg</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tabular-nums text-white">{fmtAvg(awayAvg.for)}</span>
            {awayAvg.against != null && (
              <span className="text-sm text-muted">/ {awayAvg.against} GA</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{homeAbbrev} Season Avg</span>
          <div className="flex items-baseline gap-2">
            {homeAvg.against != null && (
              <span className="text-sm text-muted">GA {homeAvg.against} /</span>
            )}
            <span className="text-xl font-bold tabular-nums text-white">{fmtAvg(homeAvg.for)}</span>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3b82f6] border-t-transparent" />
        </div>
      )}

      {/* PP%/PK% trend charts */}
      {!isLoading && isPct && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { abbrev: awayAbbrev, logo: awayLogo, log: awayLog },
            { abbrev: homeAbbrev, logo: homeLogo, log: homeLog },
          ].map(({ abbrev, logo, log }) => {
            const td = buildTrend(log);
            return (
              <div key={abbrev} className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Image src={logo} alt={abbrev} width={14} height={14} unoptimized />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {abbrev} — Last {td.length} w/ PP opp
                  </span>
                </div>
                {td.length > 1 ? (
                  <TrendChart
                    data={td}
                    label={cat === 'pp' ? 'PP%' : 'PK%'}
                    yDomain={[0, 100]}
                    formatter={(v) => `${v.toFixed(1)}%`}
                    color={cat === 'pp' ? '#3b82f6' : '#06b6d4'}
                  />
                ) : (
                  <p className="py-4 text-center text-xs text-muted">Not enough data</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Per-game tables */}
      {!isLoading && !isPct && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { abbrev: awayAbbrev, logo: awayLogo, games: awayGames },
            { abbrev: homeAbbrev, logo: homeLogo, games: homeGames },
          ].map(({ abbrev, logo, games }) => (
            <div key={abbrev} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Image src={logo} alt={abbrev} width={14} height={14} unoptimized />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {abbrev} — Last {games.length}
                </span>
              </div>
              {games.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-base">
                        <th className="px-2 py-1.5 text-left font-medium text-muted">Date</th>
                        <th className="px-2 py-1.5 text-left font-medium text-muted">Opp</th>
                        {cols.map((c) => (
                          <th key={c.key} className="px-2 py-1.5 text-right font-medium text-muted">{c.label}</th>
                        ))}
                        <th className="px-2 py-1.5 text-center font-medium text-muted">Res</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {games.map((g: any) => (
                        <tr key={g.gameId} className="hover:bg-hover">
                          <td className="px-2 py-1.5 text-muted">{fmtDate(g.gameDate)}</td>
                          <td className="px-2 py-1.5 text-white">
                            <span className="mr-0.5 text-muted">{g.homeOrAway === 'H' ? 'vs' : '@'}</span>
                            {g.oppAbbrev}
                          </td>
                          {cols.map((c) => (
                            <td key={c.key} className="px-2 py-1.5 text-right font-medium tabular-nums text-white">
                              {c.fmt(g[c.key])}
                            </td>
                          ))}
                          <td className="px-2 py-1.5 text-center">
                            <span className={`font-bold ${g.isWin ? 'text-green-400' : 'text-red-400'}`}>
                              {g.isWin ? 'W' : 'L'}{g.isOT ? '/OT' : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-4 text-center text-xs text-muted">No games found</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
