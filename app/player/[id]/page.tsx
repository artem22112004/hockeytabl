'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { useSeason } from '@/components/SeasonContext';
import type { ChartPoint } from '@/components/PointsChart';
import type { GoalieChartPoint } from '@/components/GoalieChart';

const PointsChart  = dynamic(() => import('@/components/PointsChart'),  { ssr: false });
const GoalieChart  = dynamic(() => import('@/components/GoalieChart'),  { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fmtHeight(inches: number | null): string {
  if (!inches) return '—';
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

function fmtAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function fmtSeason(s: number | string | undefined): string {
  if (!s) return '';
  const str = String(s);
  return `${str.slice(0, 4)}–${str.slice(6)}`;
}

function pmClass(v: number) {
  if (v > 0) return 'text-green-400';
  if (v < 0) return 'text-red-400';
  return 'text-muted';
}
function pmLabel(v: number) {
  return v > 0 ? `+${v}` : String(v);
}

function decisionClass(d: string | null | undefined) {
  if (d === 'W') return 'text-green-400 font-bold';
  if (d === 'L') return 'text-red-400 font-bold';
  if (d === 'OT') return 'text-yellow-400 font-bold';
  return 'text-muted';
}

function StatBox({
  label, value, accent,
}: {
  label: string;
  value: string | number | null | undefined;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-base py-3">
      <span className={`text-xl font-bold ${accent ? 'text-[#3b82f6]' : 'text-white'}`}>
        {value ?? '—'}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</span>
    </div>
  );
}

function SkaterSeasonBlock({ s, label }: { s: any; label: string }) {
  if (!s) return null;
  const abbrev = typeof s.teamAbbrev === 'object' ? s.teamAbbrev?.default : s.teamAbbrev;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</h3>
        {abbrev && <span className="text-xs text-muted">{abbrev}</span>}
      </div>
      <div className="grid grid-cols-5 gap-2">
        <StatBox label="GP"  value={s.gamesPlayed} />
        <StatBox label="G"   value={s.goals} />
        <StatBox label="A"   value={s.assists} />
        <StatBox label="PTS" value={s.points} accent />
        <StatBox label="+/−" value={s.plusMinus != null ? pmLabel(s.plusMinus) : null} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <StatBox label="PPG" value={s.powerPlayGoals} />
        <StatBox label="PPP" value={s.powerPlayPoints} />
        <StatBox label="SOG" value={s.shots} />
        <StatBox
          label="S%"
          value={s.shootingPctg != null ? `${(s.shootingPctg * 100).toFixed(1)}%` : null}
        />
      </div>
    </div>
  );
}

function GoalieSeasonBlock({ s, label }: { s: any; label: string }) {
  if (!s) return null;
  const abbrev = typeof s.teamAbbrev === 'object' ? s.teamAbbrev?.default : s.teamAbbrev;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</h3>
        {abbrev && <span className="text-xs text-muted">{abbrev}</span>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <StatBox label="GP"  value={s.gamesPlayed} />
        <StatBox label="W"   value={s.wins} />
        <StatBox label="L"   value={s.losses} />
        <StatBox label="OT"  value={s.otLosses} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <StatBox label="GAA" value={s.gaa != null ? s.gaa.toFixed(2) : null} />
        <StatBox label="SV%" value={s.savePctg != null ? s.savePctg.toFixed(3) : null} accent />
        <StatBox label="SO"  value={s.shutouts} />
        <StatBox label="GA"  value={s.goalsAgainst} />
      </div>
    </div>
  );
}

export default function PlayerPage({ params }: { params: { id: string } }) {
  const { season } = useSeason();
  const { id }     = params;

  const { data: bio, isLoading: bioLoading } = useSWR(
    `/api/player/${id}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: logData, isLoading: logLoading } = useSWR(
    `/api/player/${id}/game-log?season=${season}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const isGoalie = bio?.position === 'G';

  // Sort game log oldest → newest for chart
  const gameLog: any[] = useMemo(
    () =>
      [...(logData?.gameLog ?? [])].sort((a: any, b: any) =>
        a.gameDate.localeCompare(b.gameDate)
      ),
    [logData]
  );

  // ── Skater chart data ──────────────────────────────────────────────────────
  const chartData = useMemo<ChartPoint[]>(() => {
    if (isGoalie) return [];
    let cum = 0;
    return gameLog.map((g, i) => {
      cum += g.points ?? 0;
      return {
        game:    i + 1,
        pts:     g.points  ?? 0,
        cumPts:  cum,
        date:    g.gameDate,
        opp:     g.opponentAbbrev ?? '',
        goals:   g.goals   ?? 0,
        assists: g.assists  ?? 0,
      };
    });
  }, [gameLog, isGoalie]);

  // ── Goalie chart data ──────────────────────────────────────────────────────
  const goalieChartData = useMemo<GoalieChartPoint[]>(() => {
    if (!isGoalie) return [];
    return gameLog
      .filter((g) => g.decision)   // only decisive games
      .map((g, i) => ({
        game:         i + 1,
        date:         g.gameDate,
        opp:          g.opponentAbbrev ?? '',
        decision:     g.decision ?? 'ND',
        svPctg:       g.savePercentage != null
                        ? +(g.savePercentage * 100).toFixed(1)
                        : g.saveShotsAgainst
                          ? (() => {
                              const [sv, sa] = g.saveShotsAgainst.split('/').map(Number);
                              return sa > 0 ? +((sv / sa) * 100).toFixed(1) : 0;
                            })()
                          : 0,
        goalsAgainst: g.goalsAgainst ?? 0,
      }));
  }, [gameLog, isGoalie]);

  // Last 20 games newest-first
  const last20 = useMemo(() => [...gameLog].reverse().slice(0, 20), [gameLog]);

  if (bioLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-[#3b82f6]" />
      </div>
    );
  }

  if (!bio || bio.error) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">Player not found.</p>
        <Link href="/skaters" className="mt-4 inline-block text-sm text-[#3b82f6] hover:underline">
          ← Back to Skaters
        </Link>
      </div>
    );
  }

  const age = fmtAge(bio.birthDate);

  return (
    <div className="flex flex-col gap-6 py-4">

      {/* Back */}
      <Link
        href={isGoalie ? '/goalies' : '/skaters'}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
      >
        ← Back to {isGoalie ? 'Goalies' : 'Skaters'}
      </Link>

      {/* ── Player header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#3b82f6]/8 via-transparent to-[#06b6d4]/5" />
        <div className="relative flex flex-wrap items-start gap-6 p-6">

          <Image
            src={bio.headshot || 'https://assets.nhle.com/mugs/nhl/60x60/default-skater.png'}
            alt={bio.fullName}
            width={100}
            height={100}
            className="shrink-0 rounded-2xl object-cover ring-2 ring-border shadow-xl"
            unoptimized
          />

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#3b82f6]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-[#3b82f6]">
                {bio.position}
              </span>
              {bio.sweaterNumber && (
                <span className="text-sm text-muted">#{bio.sweaterNumber}</span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">{bio.fullName}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {bio.teamAbbrev && (
                <Link
                  href={`/team/${bio.teamAbbrev}`}
                  className="flex items-center gap-1.5 transition-colors hover:text-white"
                >
                  <Image src={bio.teamLogo} alt={bio.teamAbbrev} width={20} height={20} unoptimized />
                  <span>{bio.teamName || bio.teamAbbrev}</span>
                </Link>
              )}
              {age                && <span>{age} yrs</span>}
              {bio.heightInInches && <span>{fmtHeight(bio.heightInInches)}</span>}
              {bio.weightInPounds && <span>{bio.weightInPounds} lbs</span>}
              {bio.shootsCatches  && <span>{isGoalie ? 'Catches' : 'Shoots'} {bio.shootsCatches}</span>}
              {(bio.birthCity || bio.birthCountry) && (
                <span>{[bio.birthCity, bio.birthCountry].filter(Boolean).join(', ')}</span>
              )}
            </div>

            {bio.draftDetails && (
              <p className="mt-1.5 text-xs text-muted">
                {bio.draftDetails.year} Draft · Round {bio.draftDetails.round} ·{' '}
                #{bio.draftDetails.overallPick} overall
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Season stats ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isGoalie ? (
          <>
            <GoalieSeasonBlock
              s={bio.currentSeason}
              label={bio.currentSeason ? `${fmtSeason(bio.currentSeason.season)} Season` : 'Current Season'}
            />
            <GoalieSeasonBlock
              s={bio.prevSeason}
              label={bio.prevSeason ? `${fmtSeason(bio.prevSeason.season)} Season` : 'Previous Season'}
            />
          </>
        ) : (
          <>
            <SkaterSeasonBlock
              s={bio.currentSeason}
              label={bio.currentSeason ? `${fmtSeason(bio.currentSeason.season)} Season` : 'Current Season'}
            />
            <SkaterSeasonBlock
              s={bio.prevSeason}
              label={bio.prevSeason ? `${fmtSeason(bio.prevSeason.season)} Season` : 'Previous Season'}
            />
          </>
        )}
      </div>

      {/* ── Trend chart ── */}
      {isGoalie ? (
        goalieChartData.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
              GAA &amp; SV% Trend — {fmtSeason(season)} Season
              <span className="ml-2 font-normal normal-case text-muted">
                ({goalieChartData.length} decisive games)
              </span>
            </h2>
            <GoalieChart data={goalieChartData} />
          </div>
        )
      ) : (
        chartData.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
              Cumulative Points — {fmtSeason(season)} Season
              <span className="ml-2 font-normal normal-case text-muted">
                ({chartData.length} games · {chartData.at(-1)?.cumPts} pts)
              </span>
            </h2>
            <PointsChart data={chartData} />
          </div>
        )
      )}

      {/* ── Game log ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Last 20 Games</h2>

        {logLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-[#3b82f6]" />
          </div>
        ) : last20.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No games found for this season.</p>
        ) : isGoalie ? (
          /* ── Goalie game log ── */
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-surface">
                  {['Date', 'Opponent', 'Dec', 'SA', 'Saves', 'SV%', 'GA', 'TOI'].map((h) => (
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
                {last20.map((g: any, i: number) => {
                  let saves: number | null = null;
                  let sa: number | null    = null;
                  if (g.saveShotsAgainst) {
                    const parts = g.saveShotsAgainst.split('/').map(Number);
                    if (parts.length === 2) { saves = parts[0]; sa = parts[1]; }
                  }
                  const svPctg = g.savePercentage != null
                    ? g.savePercentage.toFixed(3)
                    : (saves != null && sa != null && sa > 0)
                      ? (saves / sa).toFixed(3)
                      : '—';

                  return (
                    <tr
                      key={g.gameId ?? i}
                      className={`border-b border-border transition-colors duration-150 hover:bg-hover ${
                        i % 2 === 0 ? 'bg-base' : 'bg-surface/30'
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-muted">{g.gameDate}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className="text-xs text-muted">
                          {g.homeRoadFlag === 'H' ? 'vs' : '@'}
                        </span>{' '}
                        <span className="font-medium text-white">{g.opponentAbbrev}</span>
                      </td>
                      <td className={`px-3 py-2 ${decisionClass(g.decision)}`}>
                        {g.decision ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-muted">{sa ?? '—'}</td>
                      <td className="px-3 py-2 text-white">{saves ?? '—'}</td>
                      <td className="px-3 py-2 font-semibold text-[#3b82f6]">{svPctg}</td>
                      <td className="px-3 py-2 text-red-400">{g.goalsAgainst ?? '—'}</td>
                      <td className="px-3 py-2 text-muted">{g.toi ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Skater game log ── */
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-surface">
                  {['Date', 'Opponent', 'G', 'A', 'PTS', '+/−', 'SOG', 'TOI'].map((h) => (
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
                {last20.map((g: any, i: number) => (
                  <tr
                    key={g.gameId ?? i}
                    className={`border-b border-border transition-colors duration-150 hover:bg-hover ${
                      i % 2 === 0 ? 'bg-base' : 'bg-surface/30'
                    }`}
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-muted">{g.gameDate}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className="text-xs text-muted">
                        {g.homeRoadFlag === 'H' ? 'vs' : '@'}
                      </span>{' '}
                      <span className="font-medium text-white">{g.opponentAbbrev}</span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-white">{g.goals}</td>
                    <td className="px-3 py-2 text-white">{g.assists}</td>
                    <td className="px-3 py-2 font-bold text-[#3b82f6]">{g.points}</td>
                    <td className={`px-3 py-2 font-medium ${pmClass(g.plusMinus ?? 0)}`}>
                      {pmLabel(g.plusMinus ?? 0)}
                    </td>
                    <td className="px-3 py-2 text-muted">{g.shots ?? g.shotsOnGoal ?? '—'}</td>
                    <td className="px-3 py-2 text-muted">{g.toi ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
