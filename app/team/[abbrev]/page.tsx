'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';

import { useSeason } from '@/components/SeasonContext';
import { teamLogoUrl } from '@/lib/nhl-api';
import TotalsTable from '@/components/TotalsTable';

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
  const [tab, setTab]         = useState<RosterTab>('forwards');
  const [statCat, setStatCat] = useState<'goals' | 'shots' | 'pp' | 'pk' | 'faceoffs'>('goals');

  type StatCat = 'goals' | 'shots' | 'pp' | 'pk' | 'faceoffs';
  const STAT_CATS: { id: StatCat; label: string }[] = [
    { id: 'goals',    label: 'Goals' },
    { id: 'shots',    label: 'Shots' },
    { id: 'pp',       label: 'PP%' },
    { id: 'pk',       label: 'PK%' },
    { id: 'faceoffs', label: 'Faceoffs' },
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

  // Season stats (PP%, PK%, shots)
  const { data: statsData } = useSWR(
    `/api/team/${abbrev}/season-stats?season=${season}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // All finished games (for totals table)
  const { data: seasonGamesData } = useSWR(
    `/api/team/${abbrev}/season-games?season=${season}`,
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
  const ts = statsData?.teamStats ?? null;
  const seasonGames: any[] = seasonGamesData?.games ?? [];

  const gp = standing?.gamesPlayed ?? 0;
  const gfPg = gp > 0 ? ((standing?.goalFor ?? 0) / gp).toFixed(2) : null;
  const gaPg = gp > 0 ? ((standing?.goalAgainst ?? 0) / gp).toFixed(2) : null;

  function fmtPct(v: number | null | undefined): string {
    if (v == null) return '—';
    return `${(v * 100).toFixed(1)}%`;
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

      {/* ── Season stats grid ── */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatBox label="GF/G"   value={gfPg} />
        <StatBox label="GA/G"   value={gaPg} />
        <StatBox label="SOG/G"  value={ts?.shotsForPerGame?.toFixed(1)} />
        <StatBox label="SOGA/G" value={ts?.shotsAgainstPerGame?.toFixed(1)} />
        <StatBox label="PP%"    value={fmtPct(ts?.powerPlayPctg)} />
        <StatBox label="PK%"    value={fmtPct(ts?.penaltyKillPctg)} />
        <StatBox label="FOW%"   value={fmtPct(ts?.faceoffWinPctg)} />
      </div>

      {/* ── Stat trend ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
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
        </div>

        {statCat === 'goals' ? (
          seasonGames.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No game data available.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {(() => {
                const last20 = seasonGames.slice(-20);
                const maxGF  = Math.max(...last20.map((g: any) => g.gf), 1);
                const maxGA  = Math.max(...last20.map((g: any) => g.ga), 1);
                const maxVal = Math.max(maxGF, maxGA);
                return last20.map((g: any) => (
                  <div key={g.gameId} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-[11px] text-muted">{g.gameDate}</span>
                    <span className="w-5 shrink-0 text-[11px] text-muted text-center">
                      {g.homeOrAway === 'H' ? 'vs' : '@'}
                    </span>
                    <span className="w-8 shrink-0 text-[11px] text-white">{g.oppAbbrev}</span>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2 rounded-sm bg-[#3b82f6] transition-all duration-300"
                          style={{ width: `${(g.gf / maxVal) * 100}%` }}
                        />
                        <span className="text-[11px] font-semibold text-white">{g.gf}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2 rounded-sm bg-red-500/60 transition-all duration-300"
                          style={{ width: `${(g.ga / maxVal) * 100}%` }}
                        />
                        <span className="text-[11px] text-muted">{g.ga}</span>
                      </div>
                    </div>
                    <span className={`w-12 text-right text-xs font-bold ${g.isWin ? 'text-green-400' : 'text-red-400'}`}>
                      {g.isWin ? 'W' : 'L'}{g.isOT ? '/OT' : ''}
                    </span>
                  </div>
                ));
              })()}
              <div className="mt-1 flex items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-6 rounded-sm bg-[#3b82f6]" />
                  <span className="text-[11px] text-muted">GF</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-6 rounded-sm bg-red-500/60" />
                  <span className="text-[11px] text-muted">GA</span>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-wrap gap-4 py-2">
            {statCat === 'shots' && (
              <>
                <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-base px-6 py-3">
                  <span className="text-2xl font-bold text-[#3b82f6]">
                    {ts?.shotsForPerGame?.toFixed(1) ?? '—'}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted">SOG For / G</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-base px-6 py-3">
                  <span className="text-2xl font-bold text-white">
                    {ts?.shotsAgainstPerGame?.toFixed(1) ?? '—'}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted">SOG Against / G</span>
                </div>
              </>
            )}
            {statCat === 'pp' && (
              <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-base px-6 py-3">
                <span className="text-2xl font-bold text-[#3b82f6]">
                  {fmtPct(ts?.powerPlayPctg)}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted">Power Play %</span>
              </div>
            )}
            {statCat === 'pk' && (
              <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-base px-6 py-3">
                <span className="text-2xl font-bold text-[#3b82f6]">
                  {fmtPct(ts?.penaltyKillPctg)}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted">Penalty Kill %</span>
              </div>
            )}
            {statCat === 'faceoffs' && (
              <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-base px-6 py-3">
                <span className="text-2xl font-bold text-[#3b82f6]">
                  {fmtPct(ts?.faceoffWinPctg)}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted">Faceoff Win %</span>
              </div>
            )}
            <p className="self-center text-xs text-muted">
              Per-game trend data available for Goals only.
            </p>
          </div>
        )}
      </div>

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
