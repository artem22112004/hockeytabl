'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type StatCat = 'goals' | 'shots' | 'pp' | 'pk' | 'faceoffs';

const CATS: { id: StatCat; label: string }[] = [
  { id: 'goals',    label: 'Goals' },
  { id: 'shots',    label: 'Shots' },
  { id: 'pp',       label: 'PP%' },
  { id: 'pk',       label: 'PK%' },
  { id: 'faceoffs', label: 'Faceoffs' },
];

interface TeamStat {
  forVal:     number | null;
  againstVal: number | null;
  label:      string;
  unit:       string;
}

function getTeamStat(ts: any, gfPg: number | null, gaPg: number | null, cat: StatCat): TeamStat {
  switch (cat) {
    case 'goals':
      return { forVal: gfPg, againstVal: gaPg, label: 'Goals', unit: '/G' };
    case 'shots':
      return {
        forVal:     ts?.shotsForPerGame     ?? null,
        againstVal: ts?.shotsAgainstPerGame ?? null,
        label: 'Shots', unit: '/G',
      };
    case 'pp':
      return {
        forVal:     ts?.powerPlayPctg != null ? +(ts.powerPlayPctg * 100).toFixed(1) : null,
        againstVal: null,
        label: 'PP%', unit: '%',
      };
    case 'pk':
      return {
        forVal:     ts?.penaltyKillPctg != null ? +(ts.penaltyKillPctg * 100).toFixed(1) : null,
        againstVal: null,
        label: 'PK%', unit: '%',
      };
    case 'faceoffs':
      return {
        forVal:     ts?.faceoffWinPctg != null ? +(ts.faceoffWinPctg * 100).toFixed(1) : null,
        againstVal: null,
        label: 'Faceoffs', unit: '%',
      };
  }
}

function StatBar({
  awayVal, homeVal, unit, label, higherIsBetter = true,
}: {
  awayVal: number | null;
  homeVal: number | null;
  unit: string;
  label: string;
  higherIsBetter?: boolean;
}) {
  if (awayVal === null && homeVal === null) return null;
  const max = Math.max(awayVal ?? 0, homeVal ?? 0, 0.01);
  const awayPct = awayVal !== null ? (awayVal / max) * 100 : 0;
  const homePct = homeVal !== null ? (homeVal / max) * 100 : 0;
  const awayBetter =
    awayVal !== null && homeVal !== null &&
    (higherIsBetter ? awayVal >= homeVal : awayVal <= homeVal);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}{unit}
      </span>
      <div className="flex items-center gap-3">
        {/* Away bar (right-aligned) */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <span className={`tabular-nums text-sm font-bold ${awayBetter ? 'text-[#3b82f6]' : 'text-white'}`}>
            {awayVal !== null ? awayVal : '—'}
          </span>
          <div className="h-3 w-28 overflow-hidden rounded-full bg-base">
            <div
              className="h-full rounded-full bg-gradient-to-l from-[#3b82f6] to-[#06b6d4] transition-all duration-500"
              style={{ width: `${awayPct}%`, marginLeft: `${100 - awayPct}%` }}
            />
          </div>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Home bar (left-aligned) */}
        <div className="flex flex-1 items-center gap-2">
          <div className="h-3 w-28 overflow-hidden rounded-full bg-base">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] transition-all duration-500"
              style={{ width: `${homePct}%` }}
            />
          </div>
          <span className={`tabular-nums text-sm font-bold ${!awayBetter ? 'text-[#3b82f6]' : 'text-white'}`}>
            {homeVal !== null ? homeVal : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  awayAbbrev: string;
  awayName:   string;
  awayLogo:   string;
  homeAbbrev: string;
  homeName:   string;
  homeLogo:   string;
  season:     string;
}

export default function StatComparisonPanel({
  awayAbbrev, awayName, awayLogo,
  homeAbbrev, homeName, homeLogo,
  season,
}: Props) {
  const [cat, setCat] = useState<StatCat>('goals');

  const { data: awayStatsData } = useSWR<any>(
    `/api/team/${awayAbbrev}/season-stats?season=${season}`,
    fetcher, { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  const { data: homeStatsData } = useSWR<any>(
    `/api/team/${homeAbbrev}/season-stats?season=${season}`,
    fetcher, { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  const { data: awayStandData } = useSWR<any>('/api/teams', fetcher, {
    revalidateOnFocus: false, dedupingInterval: 300_000,
  });

  // Goals per game from standings
  const standings: any[] = awayStandData?.standings ?? [];
  function getGPG(abbrev: string) {
    const t = standings.find((s: any) => s.teamAbbrev?.default === abbrev);
    if (!t || !t.gamesPlayed) return null;
    return { gf: +(t.goalFor / t.gamesPlayed).toFixed(2), ga: +(t.goalAgainst / t.gamesPlayed).toFixed(2) };
  }

  const awayGPG  = getGPG(awayAbbrev);
  const homeGPG  = getGPG(homeAbbrev);
  const awayTs   = awayStatsData?.teamStats ?? null;
  const homeTs   = homeStatsData?.teamStats ?? null;

  const awayStat = getTeamStat(awayTs, awayGPG?.gf ?? null, awayGPG?.ga ?? null, cat);
  const homeStat = getTeamStat(homeTs, homeGPG?.gf ?? null, homeGPG?.ga ?? null, cat);

  // Last 10 goals for each team (only used when cat === 'goals')
  const { data: awayGamesData } = useSWR<any>(
    cat === 'goals' ? `/api/team/${awayAbbrev}/season-games?season=${season}` : null,
    fetcher, { revalidateOnFocus: false }
  );
  const { data: homeGamesData } = useSWR<any>(
    cat === 'goals' ? `/api/team/${homeAbbrev}/season-games?season=${season}` : null,
    fetcher, { revalidateOnFocus: false }
  );

  const awayLast10 = (awayGamesData?.games ?? []).slice(-10).reverse();
  const homeLast10 = (homeGamesData?.games ?? []).slice(-10).reverse();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">

      {/* Team headers */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src={awayLogo} alt={awayAbbrev} width={28} height={28} unoptimized />
          <span className="font-semibold text-white">{awayName}</span>
          <span className="text-xs text-muted">AWAY</span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">Season Avg</span>
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
                ? 'bg-gradient-to-r from-[#3b82f6]/20 to-[#06b6d4]/20 text-white'
                : 'text-muted hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Comparison bars */}
      <div className="flex flex-col gap-3 px-2">
        <StatBar
          awayVal={awayStat.forVal}
          homeVal={homeStat.forVal}
          unit={awayStat.unit}
          label={cat === 'goals' ? 'GF' : cat === 'shots' ? 'SOG For' : awayStat.label}
          higherIsBetter={cat !== 'pk'}
        />
        {cat === 'goals' && (
          <StatBar
            awayVal={awayStat.againstVal}
            homeVal={homeStat.againstVal}
            unit="/G"
            label="GA"
            higherIsBetter={false}
          />
        )}
        {cat === 'shots' && (
          <StatBar
            awayVal={awayStat.againstVal}
            homeVal={homeStat.againstVal}
            unit="/G"
            label="SOG Against"
            higherIsBetter={false}
          />
        )}
      </div>

      {/* Last 10 games goals mini-table — only for Goals cat */}
      {cat === 'goals' && (awayLast10.length > 0 || homeLast10.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { abbrev: awayAbbrev, logo: awayLogo, games: awayLast10 },
            { abbrev: homeAbbrev, logo: homeLogo, games: homeLast10 },
          ].map(({ abbrev, logo, games }) => (
            <div key={abbrev} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Image src={logo} alt={abbrev} width={16} height={16} unoptimized />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {abbrev} — Last 10
                </span>
              </div>
              <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
                {games.map((g: any) => (
                  <div key={g.gameId} className="flex items-center gap-2 px-3 py-1.5 hover:bg-hover">
                    <span className="w-20 shrink-0 text-xs text-muted">{g.gameDate}</span>
                    <span className="text-xs text-muted">{g.homeOrAway === 'H' ? 'vs' : '@'}</span>
                    <span className="flex-1 text-xs text-white">{g.oppAbbrev}</span>
                    <span className="tabular-nums text-xs font-bold text-white">{g.gf}–{g.ga}</span>
                    <span className={`text-xs font-bold ${g.isWin ? 'text-green-400' : 'text-red-400'}`}>
                      {g.isWin ? 'W' : 'L'}{g.isOT ? '/OT' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
