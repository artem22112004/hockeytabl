'use client';

import { useMemo, useState } from 'react';

function numAvg(games: any[], key: string, predicate?: (g: any) => boolean): number | null {
  const rows = predicate ? games.filter(predicate) : games;
  const vals = rows.map((g) => g[key] as number | null).filter((v): v is number => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';

import { useSeason } from '@/components/SeasonContext';
import { teamLogoUrl } from '@/lib/nhl-api';
import TotalsTable from '@/components/TotalsTable';
import dynamic from 'next/dynamic';
const TrendChart = dynamic(() => import('@/components/TrendChart'), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type RosterTab = 'forwards' | 'defensemen' | 'goalies';

function fmtAge(birthDate: string | null | undefined): string {
  if (!birthDate) return '—';
  return String(
    Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
  );
}

function fmtHeight(inches: number | null | undefined): string {
  if (!inches) return '—';
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

function StatBox({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-base py-3">
      <span className="text-lg font-bold text-white">{value ?? '—'}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</span>
    </div>
  );
}

export default function TeamPage({ params }: { params: { abbrev: string } }) {
  const { season }  = useSeason();
  const abbrev      = params.abbrev.toUpperCase();
  const [tab, setTab]           = useState<RosterTab>('forwards');

  type StatCat = 'goals' | 'shots' | 'hits' | 'pim' | 'faceoffs' | 'pp' | 'pk';
  const [statCat, setStatCat]   = useState<StatCat>('goals');
  const [trendVenue, setTrendVenue] = useState<'all' | 'H' | 'A'>('all');

  const STAT_CATS: { id: StatCat; label: string }[] = [
    { id: 'goals',    label: 'Goals' },
    { id: 'shots',    label: 'Shots' },
    { id: 'hits',     label: 'Hits' },
    { id: 'pim',      label: 'PIM' },
    { id: 'faceoffs', label: 'Faceoffs' },
    { id: 'pp',       label: 'PP%' },
    { id: 'pk',       label: 'PK%' },
  ];

  // Standings — find this team
  const { data: standingsData } = useSWR('/api/teams', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });

  // Roster
  const { data: rosterData, isLoading: rosterLoading } = useSWR(
    `/api/team/${abbrev}/roster`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Last 10 games
  const { data: scheduleData } = useSWR(
    `/api/team/${abbrev}/schedule?season=${season}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // All finished games (for totals table)
  const { data: seasonGamesData } = useSWR(
    `/api/team/${abbrev}/season-games?season=${season}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Last 20 games with full box-score stats
  const { data: gameLogData, isLoading: gameLogLoading } = useSWR(
    `/api/team/${abbrev}/game-log?season=${season}&limit=20`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const standing = useMemo(
    () =>
      (standingsData?.standings ?? []).find(
        (t: any) => t.teamAbbrev?.default === abbrev
      ),
    [standingsData, abbrev]
  );

  const roster = rosterData ?? { forwards: [], defensemen: [], goalies: [] };
  const games: any[] = scheduleData?.games ?? [];
  const seasonGames: any[] = seasonGamesData?.games ?? [];
  const gameLog: any[]     = gameLogData?.games ?? [];

  const gp = standing?.gamesPlayed ?? 0;

  // Venue-filtered game log (drives both trend table and summary cards)
  const filteredLog = useMemo(
    () => trendVenue === 'all' ? gameLog : gameLog.filter((g: any) => g.homeOrAway === trendVenue),
    [gameLog, trendVenue]
  );

  // Summary card values computed from filtered game log
  const cardStats = useMemo(() => ({
    gfPg:   numAvg(filteredLog, 'gf'),
    gaPg:   numAvg(filteredLog, 'ga'),
    sogPg:  numAvg(filteredLog, 'shots'),
    sogaPg: numAvg(filteredLog, 'shotsAgainst'),
    ppPct:  numAvg(filteredLog, 'ppPctg',      (g) => (g.ppOpps ?? 0) > 0),
    pkPct:  numAvg(filteredLog, 'pkPctg'),
    fowPct: numAvg(filteredLog, 'faceoffPctg'),
  }), [filteredLog]);

  function fmtPct(v: number | null | undefined): string {
    if (v == null) return '—';
    return `${(v * 100).toFixed(1)}%`;
  }

  function fmtAvg(v: number | null | undefined, decimals = 1): string {
    if (v == null) return '—';
    return v.toFixed(decimals);
  }

  function fmtPctDirect(v: number | null | undefined): string {
    if (v == null) return '—';
    return `${v.toFixed(1)}%`;
  }

  const players: any[] = roster[tab] ?? [];

  return (
    <div className="flex flex-col gap-6 py-4">

      {/* Back */}
      <Link
        href="/teams"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
      >
        ← Back to Standings
      </Link>

      {/* ── Team header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#3b82f6]/8 via-transparent to-[#06b6d4]/5" />
        <div className="relative flex flex-wrap items-center gap-6 p-6">

          <Image
            src={teamLogoUrl(abbrev)}
            alt={abbrev}
            width={86}
            height={86}
            className="shrink-0 drop-shadow-2xl"
            unoptimized
          />

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">
              {[standing?.divisionName, standing?.conferenceName].filter(Boolean).join(' · ')}
            </p>
            <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-white">
              {standing?.teamName?.default ?? abbrev}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {standing && (
                <>
                  <span className="text-xl font-bold text-white">
                    {standing.wins}–{standing.losses}–{standing.otLosses}
                  </span>
                  <span className="text-lg font-bold text-[#3b82f6]">
                    {standing.points}
                    <span className="ml-1 text-sm font-normal text-muted">pts</span>
                  </span>
                  <span className="text-sm text-muted">{gp} GP</span>
                  <span className="text-sm text-muted">
                    {standing.goalFor} GF · {standing.goalAgainst} GA
                  </span>
                  {standing.streakCode && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        standing.streakCode === 'W'
                          ? 'bg-green-900/50 text-green-400'
                          : standing.streakCode === 'L'
                          ? 'bg-red-900/50 text-red-400'
                          : 'bg-yellow-900/50 text-yellow-400'
                      }`}
                    >
                      {standing.streakCode}{standing.streakCount}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Season stats grid — averages from filtered game log ── */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatBox label="GF/G"   value={fmtAvg(cardStats.gfPg)} />
        <StatBox label="GA/G"   value={fmtAvg(cardStats.gaPg)} />
        <StatBox label="SOG/G"  value={fmtAvg(cardStats.sogPg)} />
        <StatBox label="SOGA/G" value={fmtAvg(cardStats.sogaPg)} />
        <StatBox label="PP%"    value={fmtPctDirect(cardStats.ppPct)} />
        <StatBox label="PK%"    value={fmtPctDirect(cardStats.pkPct)} />
        <StatBox label="FOW%"   value={fmtPctDirect(cardStats.fowPct)} />
      </div>

      {/* ── Stat trend ── */}
      {(() => {
        const venueFiltered = filteredLog;

        type ColDef = { header: string; forKey: string; againstKey: string | null; fmtFor?: (v: any) => string; fmtAgainst?: (v: any) => string };
        const colMap: Record<string, ColDef> = {
          goals:    { header: 'Goals',    forKey: 'gf',          againstKey: 'ga',           fmtFor: (v) => String(v ?? '—'), fmtAgainst: (v) => String(v ?? '—') },
          shots:    { header: 'Shots',    forKey: 'shots',       againstKey: 'shotsAgainst', fmtFor: (v) => String(v ?? '—'), fmtAgainst: (v) => String(v ?? '—') },
          hits:     { header: 'Hits',     forKey: 'hits',        againstKey: 'hitsAgainst',  fmtFor: (v) => String(v ?? '—'), fmtAgainst: (v) => String(v ?? '—') },
          pim:      { header: 'PIM',      forKey: 'pim',         againstKey: 'pimAgainst',   fmtFor: (v) => String(v ?? '—'), fmtAgainst: (v) => String(v ?? '—') },
          faceoffs: { header: 'Faceoffs', forKey: 'faceoffPctg', againstKey: null,            fmtFor: (v) => v != null ? `${v.toFixed(1)}%` : '—' },
        };
        const isChart = statCat === 'pp' || statCat === 'pk';
        const col     = !isChart ? colMap[statCat] : null;

        return (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted shrink-0">
                Stat Trend — Last 20 Games
              </h2>
              <div className="flex flex-wrap gap-1">
                {STAT_CATS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setStatCat(c.id)}
                    className={`rounded-lg px-3 py-1 text-sm font-medium transition-all duration-150 ${
                      statCat === c.id
                        ? 'bg-gradient-to-r from-[#3b82f6]/20 to-[#06b6d4]/20 text-white'
                        : 'text-muted hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-1">
                {(['all', 'H', 'A'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setTrendVenue(v)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      trendVenue === v
                        ? 'bg-[#3b82f6] text-white'
                        : 'border border-border text-muted hover:text-white'
                    }`}
                  >
                    {v === 'all' ? 'All' : v === 'H' ? 'Home' : 'Away'}
                  </button>
                ))}
              </div>
            </div>

            {gameLogLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-border border-t-[#3b82f6]" />
              </div>
            ) : venueFiltered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No game data available.</p>
            ) : isChart ? (
              /* PP% / PK% line chart */
              <TrendChart
                data={venueFiltered
                  .filter((g: any) => (statCat === 'pp' ? g.ppOpps ?? 0 : 1) > 0)
                  .map((g: any, i: number) => ({
                    game:  i + 1,
                    value: statCat === 'pp' ? (g.ppPctg ?? 0) : (g.pkPctg ?? 0),
                    date:  g.gameDate,
                    opp:   g.oppAbbrev,
                  }))}
                label={statCat === 'pp' ? 'PP%' : 'PK%'}
                color={statCat === 'pp' ? '#3b82f6' : '#06b6d4'}
                yDomain={[0, 100]}
                formatter={(v) => `${v.toFixed(1)}%`}
              />
            ) : (
              /* Table for all other stats */
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-base text-xs font-semibold uppercase tracking-wider text-muted">
                      <th className="border-b border-border px-3 py-2 text-left">Date</th>
                      <th className="border-b border-border px-3 py-2 text-left">Opponent</th>
                      <th className="border-b border-border px-3 py-2 text-center">H/A</th>
                      <th className="border-b border-border px-3 py-2 text-center">For</th>
                      {col?.againstKey && (
                        <th className="border-b border-border px-3 py-2 text-center">Against</th>
                      )}
                      {statCat === 'goals' && (
                        <th className="border-b border-border px-3 py-2 text-center">Total</th>
                      )}
                      <th className="border-b border-border px-3 py-2 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venueFiltered.map((g: any, i: number) => {
                      const forVal = col ? g[col.forKey] : null;
                      const agVal  = col?.againstKey ? g[col.againstKey] : null;
                      const resultLabel = g.isWin ? `W${g.isOT ? '/OT' : ''}` : `L${g.isOT ? '/OT' : ''}`;
                      return (
                        <tr
                          key={g.gameId}
                          className={`border-b border-border hover:bg-hover ${i % 2 === 0 ? 'bg-base' : 'bg-surface/30'}`}
                        >
                          <td className="whitespace-nowrap px-3 py-2 text-muted">{g.gameDate}</td>
                          <td className="px-3 py-2 font-medium text-white">{g.oppAbbrev}</td>
                          <td className="px-3 py-2 text-center text-muted">{g.homeOrAway === 'H' ? 'vs' : '@'}</td>
                          <td className="px-3 py-2 text-center font-semibold text-white">
                            {col ? col.fmtFor!(forVal) : '—'}
                          </td>
                          {col?.againstKey && (
                            <td className="px-3 py-2 text-center text-muted">
                              {col.fmtAgainst!(agVal)}
                            </td>
                          )}
                          {statCat === 'goals' && (
                            <td className="px-3 py-2 text-center text-white">{g.total}</td>
                          )}
                          <td className={`px-3 py-2 text-center text-xs font-bold ${g.isWin ? 'text-green-400' : 'text-red-400'}`}>
                            {resultLabel}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

        {/* ── Roster ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1">
            {(['forwards', 'defensemen', 'goalies'] as RosterTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                  tab === t
                    ? 'bg-gradient-to-r from-[#3b82f6]/20 to-[#06b6d4]/20 text-white'
                    : 'text-muted hover:bg-hover hover:text-white'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="ml-1.5 text-[10px] text-muted">
                  ({roster[t]?.length ?? 0})
                </span>
              </button>
            ))}
          </div>

          {rosterLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-[#3b82f6]" />
            </div>
          ) : players.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No roster data available.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-surface">
                    {['#', 'Player', 'Pos', 'Age', 'Height', 'Weight'].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((p: any, i: number) => (
                    <tr
                      key={p.id}
                      className={`border-b border-border transition-colors duration-150 hover:bg-hover ${
                        i % 2 === 0 ? 'bg-base' : 'bg-surface/30'
                      }`}
                    >
                      <td className="px-3 py-2 tabular-nums text-muted">
                        {p.sweaterNumber ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/player/${p.id}`}
                          className="flex items-center gap-2 transition-colors hover:text-[#3b82f6]"
                        >
                          {p.headshot ? (
                            <Image
                              src={p.headshot}
                              alt={`${p.firstName} ${p.lastName}`}
                              width={28}
                              height={28}
                              className="shrink-0 rounded-full object-cover ring-1 ring-border"
                              unoptimized
                            />
                          ) : (
                            <div className="h-7 w-7 shrink-0 rounded-full bg-surface ring-1 ring-border" />
                          )}
                          <span className="font-medium text-white">
                            {p.firstName} {p.lastName}
                          </span>
                          {p.birthCountry && (
                            <span className="text-xs text-muted">{p.birthCountry}</span>
                          )}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted">{p.position || '—'}</td>
                      <td className="px-3 py-2 tabular-nums text-muted">{fmtAge(p.birthDate)}</td>
                      <td className="px-3 py-2 text-muted">{fmtHeight(p.heightInInches)}</td>
                      <td className="px-3 py-2 tabular-nums text-muted">
                        {p.weightInPounds ? `${p.weightInPounds}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Last 10 games ── */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Last 10 Games
          </h2>

          {games.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No games found.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {games.map((g: any) => {
                const isWin = g.result?.startsWith('W');
                return (
                  <div
                    key={g.gameId}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5"
                  >
                    <span className="w-20 shrink-0 text-xs text-muted">{g.gameDate}</span>
                    <span className="text-xs text-muted">
                      {g.homeOrAway === 'H' ? 'vs' : '@'}
                    </span>
                    <Image
                      src={g.oppLogo || teamLogoUrl(g.oppAbbrev)}
                      alt={g.oppAbbrev}
                      width={22}
                      height={22}
                      className="shrink-0"
                      unoptimized
                    />
                    <span className="flex-1 text-sm font-medium text-white">
                      {g.oppAbbrev}
                    </span>
                    <span className="tabular-nums text-sm font-bold text-white">
                      {g.gf}–{g.ga}
                    </span>
                    <span
                      className={`w-12 text-right text-xs font-bold ${
                        isWin ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {g.result}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Totals analysis ── */}
      {seasonGames.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Totals Analysis
            <span className="ml-2 font-normal normal-case text-muted">(Last 20 games)</span>
          </h2>
          <TotalsTable games={seasonGames} />
        </div>
      )}

    </div>
  );
}
