'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Types ────────────────────────────────────────────────────────────────────

type StatTab = 'goals' | 'shots' | 'hits' | 'pp' | 'penalty' | 'faceoffs';
type Location = 'all' | 'home' | 'away' | 'h2h';

const LOCATION_LABELS: Record<Location, string> = {
  all: 'All', home: 'Home', away: 'Away', h2h: 'H2H',
};

const STAT_TABS: { id: StatTab; label: string }[] = [
  { id: 'goals',    label: 'Goals'      },
  { id: 'shots',    label: 'Shots'      },
  { id: 'hits',     label: 'Hits'       },
  { id: 'pp',       label: 'Power Play' },
  { id: 'penalty',  label: 'Penalty'    },
  { id: 'faceoffs', label: 'Faceoffs'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(s: string) {
  const d = new Date(s + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtPct(v: number | null) {
  if (v == null) return '—';
  return `${v.toFixed(1)}%`;
}

function avg(arr: number[]): string {
  if (!arr.length) return '—';
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}

function seasonShort(dateStr: string): string {
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(5, 7), 10);
  const startYear = month >= 9 ? year : year - 1;
  return `${String(startYear).slice(2)}/${String(startYear + 1).slice(2)}`;
}

// stat accessors per tab
function getFor(g: any, tab: StatTab): number | null {
  switch (tab) {
    case 'goals':    return g.gf ?? null;
    case 'shots':    return g.shots ?? null;
    case 'hits':     return g.hits ?? null;
    case 'pp':       return g.ppGoals ?? null;
    case 'penalty':  return g.pim ?? null;
    case 'faceoffs': return g.faceoffPctg ?? null;
  }
}
function getAgainst(g: any, tab: StatTab): number | null {
  switch (tab) {
    case 'goals':    return g.ga ?? null;
    case 'shots':    return g.shotsAgainst ?? null;
    case 'hits':     return g.hitsAgainst ?? null;
    case 'pp':       return g.ppOpps ?? null;
    case 'penalty':  return g.pimAgainst ?? null;
    case 'faceoffs': return null;
  }
}
function getTotal(g: any, tab: StatTab): number | null {
  const f = getFor(g, tab);
  const a = getAgainst(g, tab);
  if (tab === 'faceoffs' || tab === 'pp') return f;
  if (f == null || a == null) return null;
  return f + a;
}

function colLabels(tab: StatTab): { forLabel: string; agnLabel: string; totLabel: string } {
  switch (tab) {
    case 'goals':    return { forLabel: 'GF',   agnLabel: 'GA',   totLabel: 'Total' };
    case 'shots':    return { forLabel: 'SOG',  agnLabel: 'SA',   totLabel: 'Total' };
    case 'hits':     return { forLabel: 'Hits', agnLabel: 'HA',   totLabel: 'Total' };
    case 'pp':       return { forLabel: 'PPG',  agnLabel: 'Opps', totLabel: 'PP%'   };
    case 'penalty':  return { forLabel: 'PIM',  agnLabel: 'OPIM', totLabel: 'Total' };
    case 'faceoffs': return { forLabel: 'FO%',  agnLabel: '',     totLabel: ''      };
  }
}

// ─── Totals table ─────────────────────────────────────────────────────────────

const THRESHOLDS = [2.5, 3.5, 4.5, 5.5, 6.5];

function pctColor(pct: number) {
  if (pct >= 65) return 'text-green-400';
  if (pct >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function OverRow({ label, games, getValue }: {
  label: string;
  games: any[];
  getValue: (g: any) => number;
}) {
  const total = games.length;
  if (total === 0) {
    return (
      <tr className="border-b border-[#1e2d45]">
        <td className="px-3 py-2 text-xs font-semibold text-white">{label}</td>
        <td className="px-2 py-2 text-center text-xs text-[#94A3B8]" colSpan={3}>—</td>
      </tr>
    );
  }
  const over  = games.filter((g) => getValue(g) > parseFloat(label.replace('O ', ''))).length;
  const under = total - over;
  const pct   = Math.round((over / total) * 100);
  return (
    <tr className="border-b border-[#1e2d45] hover:bg-[#161c2e]">
      <td className="px-3 py-2 text-xs font-semibold text-white">{label}</td>
      <td className="px-2 py-2 text-center font-mono text-xs text-white">{over}</td>
      <td className="px-2 py-2 text-center font-mono text-xs text-[#94A3B8]">{under}</td>
      <td className={`px-2 py-2 text-center font-mono text-xs font-bold ${pctColor(pct)}`}>{pct}%</td>
    </tr>
  );
}

function BttsRow({ games }: { games: any[] }) {
  const total = games.length;
  if (total === 0) return (
    <tr>
      <td className="px-3 py-2 text-xs font-semibold text-white">BTTS</td>
      <td className="px-2 py-2 text-center text-xs text-[#94A3B8]" colSpan={3}>—</td>
    </tr>
  );
  const btts  = games.filter((g) => (g.gf ?? 0) > 0 && (g.ga ?? 0) > 0).length;
  const pct   = Math.round((btts / total) * 100);
  return (
    <tr className="hover:bg-[#161c2e]">
      <td className="px-3 py-2 text-xs font-semibold text-white">BTTS</td>
      <td className="px-2 py-2 text-center font-mono text-xs text-white">{btts}</td>
      <td className="px-2 py-2 text-center font-mono text-xs text-[#94A3B8]">{total - btts}</td>
      <td className={`px-2 py-2 text-center font-mono text-xs font-bold ${pctColor(pct)}`}>{pct}%</td>
    </tr>
  );
}

function TotalsBlock({ games }: { games: any[] }) {
  const totalGoals = (g: any) => (g.gf ?? 0) + (g.ga ?? 0);
  return (
    <div className="overflow-x-auto rounded-xl border border-[#1e2d45]">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#111520]">
            <th className="border-b border-[#1e2d45] px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Total</th>
            <th className="border-b border-[#1e2d45] px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Over</th>
            <th className="border-b border-[#1e2d45] px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Under</th>
            <th className="border-b border-[#1e2d45] px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">%</th>
          </tr>
        </thead>
        <tbody className="bg-[#0B0E14]">
          {THRESHOLDS.map((t) => (
            <OverRow key={t} label={`O ${t}`} games={games} getValue={totalGoals} />
          ))}
          <BttsRow games={games} />
        </tbody>
      </table>
    </div>
  );
}

// ─── Summary row ──────────────────────────────────────────────────────────────

function SummaryRow({ games, tab }: { games: any[]; tab: StatTab }) {
  const wins   = games.filter((g) => g.isWin).length;
  const losses = games.length - wins;
  const { forLabel, agnLabel, totLabel } = colLabels(tab);

  const forVals = games.map((g) => getFor(g, tab)).filter((v): v is number => v != null);
  const agnVals = games.map((g) => getAgainst(g, tab)).filter((v): v is number => v != null);
  const totVals = games.map((g) => getTotal(g, tab)).filter((v): v is number => v != null);

  const isPct = tab === 'faceoffs' || tab === 'pp';

  return (
    <div className="flex items-center justify-between rounded-lg bg-[#111520] px-3 py-2 text-xs">
      <span className="font-mono font-bold text-white">
        {wins}W–{losses}L
      </span>
      <div className="flex gap-4">
        {forLabel && (
          <span className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] uppercase text-[#94A3B8]">{forLabel}</span>
            <span className="font-mono font-bold text-[#00D1FF]">
              {isPct && tab === 'faceoffs' ? fmtPct(forVals.length ? forVals.reduce((a,b)=>a+b,0)/forVals.length : null) : avg(forVals)}
            </span>
          </span>
        )}
        {agnLabel && (
          <span className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] uppercase text-[#94A3B8]">{agnLabel}</span>
            <span className="font-mono font-bold text-white">{avg(agnVals)}</span>
          </span>
        )}
        {totLabel && totLabel !== '' && (
          <span className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] uppercase text-[#94A3B8]">{totLabel}</span>
            <span className="font-mono font-bold text-[#94A3B8]">
              {tab === 'pp'
                ? fmtPct(forVals.length && agnVals.length ? (forVals.reduce((a,b)=>a+b,0) / Math.max(agnVals.reduce((a,b)=>a+b,0), 1)) * 100 : null)
                : avg(totVals)}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Games table ──────────────────────────────────────────────────────────────

function GamesTable({
  games,
  tab,
  checked,
  onToggle,
}: {
  games: any[];
  tab: StatTab;
  checked: Set<number>;
  onToggle: (id: number) => void;
}) {
  const { forLabel, agnLabel } = colLabels(tab);
  const showAgn = !!agnLabel;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-[#1e2d45] bg-[#111520]">
            <th className="w-6 px-2 py-2 text-center text-[10px] text-[#94A3B8]">✓</th>
            <th className="px-2 py-2 text-left text-[10px] uppercase tracking-wider text-[#94A3B8]">Date</th>
            <th className="px-2 py-2 text-center text-[10px] uppercase tracking-wider text-[#94A3B8]">H/A</th>
            <th className="px-2 py-2 text-left text-[10px] uppercase tracking-wider text-[#94A3B8]">Opp</th>
            <th className="px-2 py-2 text-center text-[10px] uppercase tracking-wider text-[#94A3B8]">{forLabel}</th>
            {showAgn && <th className="px-2 py-2 text-center text-[10px] uppercase tracking-wider text-[#94A3B8]">{agnLabel}</th>}
            <th className="px-2 py-2 text-center text-[10px] uppercase tracking-wider text-[#94A3B8]">Result</th>
          </tr>
        </thead>
        <tbody>
          {[...games].reverse().map((g) => {
            const isChecked = checked.has(g.gameId);
            const fVal = getFor(g, tab);
            const aVal = getAgainst(g, tab);
            const win  = g.isWin;
            const ot   = g.isOT;
            return (
              <tr
                key={g.gameId}
                className={`border-b border-[#1e2d45] cursor-pointer transition-colors hover:bg-[#161c2e] ${!isChecked ? 'opacity-40' : ''}`}
                onClick={() => onToggle(g.gameId)}
              >
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggle(g.gameId)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3 w-3 cursor-pointer accent-[#00D1FF]"
                  />
                </td>
                <td className="px-2 py-1.5 text-[#94A3B8]">{fmtDate(g.gameDate)}</td>
                <td className="px-2 py-1.5 text-center font-mono font-semibold text-[#94A3B8]">{g.homeOrAway}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    {g.oppLogo && <Image src={g.oppLogo} alt={g.oppAbbrev} width={14} height={14} unoptimized />}
                    <span className="font-mono text-[#94A3B8]">{g.oppAbbrev}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-center font-mono font-semibold text-white">
                  {tab === 'faceoffs' ? fmtPct(fVal) : (fVal ?? '—')}
                </td>
                {showAgn && (
                  <td className="px-2 py-1.5 text-center font-mono text-[#94A3B8]">{aVal ?? '—'}</td>
                )}
                <td className="px-2 py-1.5 text-center font-mono font-semibold">
                  <span className={win ? 'text-green-400' : 'text-red-400'}>
                    {win ? 'W' : 'L'}{ot ? `/${g.lastPeriodType}` : ''}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Team column ──────────────────────────────────────────────────────────────

function TeamColumn({
  abbrev,
  name,
  logo,
  allGames,
  tab,
  location,
}: {
  abbrev: string;
  name: string;
  logo: string;
  allGames: any[];
  tab: StatTab;
  location: Location;
}) {
  const filtered = useMemo(() => {
    let g = allGames.slice(-20);
    if (location === 'home') g = g.filter((x) => x.homeOrAway === 'H');
    if (location === 'away') g = g.filter((x) => x.homeOrAway === 'A');
    return g;
  }, [allGames, location]);

  const filteredKey = filtered.map((g) => g.gameId).join(',');
  const [checked, setChecked] = useState<Set<number>>(() => new Set(filtered.map((g) => g.gameId)));

  useEffect(() => {
    setChecked(new Set(filtered.map((g) => g.gameId)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredKey]);

  const checkedGames = useMemo(
    () => filtered.filter((g) => checked.has(g.gameId)),
    [filtered, checked]
  );

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {/* Team header */}
      <div className="flex items-center gap-2">
        <Image src={logo} alt={abbrev} width={28} height={28} unoptimized />
        <span className="font-semibold text-white">{name}</span>
        <span className="font-mono text-xs text-[#94A3B8]">{abbrev}</span>
      </div>

      {/* Summary */}
      <SummaryRow games={checkedGames} tab={tab} />

      {/* Table */}
      <div className="rounded-xl border border-[#1e2d45] bg-[#0B0E14]">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#94A3B8]">No games</p>
        ) : (
          <GamesTable games={filtered} tab={tab} checked={checked} onToggle={toggle} />
        )}
      </div>

      {/* Totals */}
      <TotalsBlock games={checkedGames} />
    </div>
  );
}

// ─── H2H section ──────────────────────────────────────────────────────────────

function H2HTable({
  games,
  checked,
  onToggle,
  team1,
  team2,
}: {
  games: any[];
  checked: Set<number>;
  onToggle: (id: number) => void;
  team1: string;
  team2: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#1e2d45]">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-[#1e2d45] bg-[#111520]">
            <th className="w-6 px-2 py-2 text-center text-[10px] text-[#94A3B8]">✓</th>
            <th className="px-2 py-2 text-left text-[10px] uppercase tracking-wider text-[#94A3B8]">Date</th>
            <th className="px-2 py-2 text-center text-[10px] uppercase tracking-wider text-[#94A3B8]">{team1}</th>
            <th className="px-2 py-2 text-center text-[10px] uppercase tracking-wider text-[#94A3B8]">{team2}</th>
            <th className="px-2 py-2 text-center text-[10px] uppercase tracking-wider text-[#94A3B8]">Total</th>
            <th className="px-2 py-2 text-center text-[10px] uppercase tracking-wider text-[#94A3B8]">Winner</th>
            <th className="px-2 py-2 text-center text-[10px] uppercase tracking-wider text-[#94A3B8]">OT/SO</th>
          </tr>
        </thead>
        <tbody className="bg-[#0B0E14]">
          {games.map((g) => {
            const isChecked = checked.has(g.gameId);
            const t1Score = g.homeAbbrev === team1 ? g.homeScore : g.awayScore;
            const t2Score = g.homeAbbrev === team2 ? g.homeScore : g.awayScore;
            const ot = g.lastPeriodType !== 'REG';
            return (
              <tr
                key={g.gameId}
                className={`border-b border-[#1e2d45] cursor-pointer transition-colors hover:bg-[#161c2e] ${!isChecked ? 'opacity-40' : ''}`}
                onClick={() => onToggle(g.gameId)}
              >
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggle(g.gameId)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3 w-3 cursor-pointer accent-[#00D1FF]"
                  />
                </td>
                <td className="px-2 py-1.5 text-[#94A3B8]">{fmtDate(g.gameDate)}</td>
                <td className={`px-2 py-1.5 text-center font-mono font-bold ${g.winner === team1 ? 'text-green-400' : 'text-white'}`}>{t1Score}</td>
                <td className={`px-2 py-1.5 text-center font-mono font-bold ${g.winner === team2 ? 'text-green-400' : 'text-white'}`}>{t2Score}</td>
                <td className="px-2 py-1.5 text-center font-mono text-[#94A3B8]">{g.total}</td>
                <td className="px-2 py-1.5 text-center font-mono font-semibold text-[#00D1FF]">{g.winner}</td>
                <td className="px-2 py-1.5 text-center font-mono text-[#94A3B8]">{ot ? g.lastPeriodType : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function H2HSection({ team1, team2, season }: { team1: string; team2: string; season: string }) {
  const { data, isLoading } = useSWR(
    `/api/h2h?team1=${team1}&team2=${team2}&season=${season}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const games: any[] = data?.games ?? [];
  const [checked, setChecked] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (games.length) setChecked(new Set(games.map((g: any) => g.gameId)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games.length]);

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const checkedGames = games.filter((g) => checked.has(g.gameId));

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">
        Head to Head · {team1} vs {team2}
      </h2>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1e2d45] border-t-[#00D1FF]" />
        </div>
      )}

      {!isLoading && games.length === 0 && (
        <p className="text-center text-xs text-[#94A3B8]">No recent head-to-head games found.</p>
      )}

      {!isLoading && games.length > 0 && (
        <>
          <H2HTable games={games} checked={checked} onToggle={toggle} team1={team1} team2={team2} />
          <TotalsBlock games={checkedGames.map((g) => ({
            gf: g.homeAbbrev === team1 ? g.homeScore : g.awayScore,
            ga: g.homeAbbrev === team2 ? g.homeScore : g.awayScore,
            homeOrAway: 'H' as const,
          }))} />
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MatchPage({ params }: { params: { gameId: string } }) {
  const { gameId } = params;
  const [tab, setTab]           = useState<StatTab>('goals');
  const [location, setLocation] = useState<Location>('all');

  const { data: game, isLoading: gameLoading } = useSWR(
    `/api/game/${gameId}`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60_000 }
  );

  const season = game?.season ?? '20252026';
  const awayAbbrev = game?.awayTeam?.abbrev;
  const homeAbbrev = game?.homeTeam?.abbrev;

  const { data: awayLog } = useSWR(
    awayAbbrev ? `/api/team/${awayAbbrev}/game-log?season=${season}&limit=30` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  const { data: homeLog } = useSWR(
    homeAbbrev ? `/api/team/${homeAbbrev}/game-log?season=${season}&limit=30` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  if (gameLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1e2d45] border-t-[#00D1FF]" />
      </div>
    );
  }

  if (!game || game.error) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/" className="text-sm text-[#94A3B8] hover:text-[#00D1FF]">← Games</Link>
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-8 text-center text-red-400">
          Game not found.
        </div>
      </div>
    );
  }

  const isFinal  = game.gameState === 'OFF'  || game.gameState === 'FINAL';
  const isLive   = game.gameState === 'LIVE' || game.gameState === 'CRIT';
  const hasScore = (isFinal || isLive) && game.awayTeam.score !== null;
  const suffix   = game.lastPeriodType && game.lastPeriodType !== 'REG' ? ` ${game.lastPeriodType}` : '';

  const awayGames: any[] = awayLog?.games ?? [];
  const homeGames: any[] = homeLog?.games ?? [];

  return (
    <div className="flex flex-col gap-6">

      {/* Back */}
      <Link href="/" className="w-fit text-sm text-[#94A3B8] transition-colors hover:text-[#00D1FF]">
        ← Games
      </Link>

      {/* Match header */}
      <div className="rounded-xl border border-[#1e2d45] bg-[#111520] p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            <Image src={game.awayTeam.logo} alt={game.awayTeam.abbrev} width={72} height={72} unoptimized />
            <p className="text-lg font-bold text-white">{game.awayTeam.name}</p>
            <p className="text-sm text-[#94A3B8]">{game.awayTeam.abbrev}</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            {hasScore ? (
              <p className="font-mono text-5xl font-bold tabular-nums text-white">
                {game.awayTeam.score}:{game.homeTeam.score}
              </p>
            ) : (
              <p className="text-3xl font-medium text-[#94A3B8]">vs</p>
            )}
            <p className="text-xs text-[#94A3B8]">{game.gameDate}</p>
            {isFinal && (
              <span className="rounded bg-[#0B0E14] px-2 py-0.5 text-xs font-semibold text-[#94A3B8]">
                Final{suffix}
              </span>
            )}
            {isLive && (
              <span className="flex items-center gap-1.5 rounded bg-red-900/30 px-2 py-0.5 text-xs font-bold text-red-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                LIVE · P{game.period}
              </span>
            )}
            {!isFinal && !isLive && (
              <span className="rounded bg-[#0B0E14] px-2 py-0.5 text-xs text-[#94A3B8]">Upcoming</span>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <Image src={game.homeTeam.logo} alt={game.homeTeam.abbrev} width={72} height={72} unoptimized />
            <p className="text-lg font-bold text-white">{game.homeTeam.name}</p>
            <p className="text-sm text-[#94A3B8]">{game.homeTeam.abbrev}</p>
          </div>
        </div>
      </div>

      {/* Stat tabs */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-[#1e2d45] bg-[#111520] p-1">
          {STAT_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                tab === t.id
                  ? 'bg-gradient-to-r from-[#00D1FF]/15 to-[#6366f1]/15 text-white'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Location / H2H filter */}
        <div className="flex items-center gap-1 rounded-lg border border-[#1e2d45] bg-[#111520] p-1">
          {(['all', 'home', 'away', 'h2h'] as const).map((loc) => (
            <button
              key={loc}
              onClick={() => setLocation(loc)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                location === loc
                  ? 'bg-gradient-to-r from-[#00D1FF]/15 to-[#6366f1]/15 text-white'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {LOCATION_LABELS[loc]}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column stat tables */}
      {location !== 'h2h' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TeamColumn
            abbrev={game.awayTeam.abbrev}
            name={game.awayTeam.name}
            logo={game.awayTeam.logo}
            allGames={awayGames}
            tab={tab}
            location={location}
          />
          <TeamColumn
            abbrev={game.homeTeam.abbrev}
            name={game.homeTeam.name}
            logo={game.homeTeam.logo}
            allGames={homeGames}
            tab={tab}
            location={location}
          />
        </div>
      )}

      {/* H2H tab */}
      {location === 'h2h' && (
        <div className="mx-auto w-full max-w-2xl rounded-xl border border-[#1e2d45] bg-[#0B0E14] p-5">
          <H2HSection team1={game.awayTeam.abbrev} team2={game.homeTeam.abbrev} season={season} />
        </div>
      )}
    </div>
  );
}
