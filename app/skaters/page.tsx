'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';

import StatsTable from '@/components/StatsTable';
import SeasonSelector from '@/components/SeasonSelector';
import PlayerSparkline from '@/components/PlayerSparkline';
import { useSeason } from '@/components/SeasonContext';
import { teamLogoUrl } from '@/lib/nhl-api';

const POSITIONS = ['All', 'C', 'L', 'R', 'D'] as const;
const GAME_TYPES = [
  { id: '2', label: 'Regular Season' },
  { id: '3', label: 'Playoffs' },
] as const;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fmtToi(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type Row = any;

function avgClass(value: number | null, avg: number | null): string {
  if (value == null || avg == null || avg === 0) return '';
  if (value > avg * 1.1) return 'cell-above';
  if (value < avg * 0.9) return 'cell-below';
  return '';
}

function MonoNum({ value, className = '' }: { value: string | number | null | undefined; className?: string }) {
  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {value ?? '—'}
    </span>
  );
}

// ─── FO% color ────────────────────────────────────────────────────────────────

function foPctClass(pct: number | null): string {
  if (pct == null) return 'text-[#94A3B8]';
  if (pct >= 55) return 'text-green-400';
  if (pct >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

// ─── Faceoffs table ───────────────────────────────────────────────────────────

function FaceoffsTable({
  players,
  minFO,
  posFilter,
  teamFilter,
}: {
  players: any[];
  minFO: number;
  posFilter: string;
  teamFilter: string;
}) {
  const [sortKey, setSortKey] = useState<'foPct' | 'totalFaceoffs' | 'foWins'>('foPct');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const filtered = useMemo(() => {
    let rows = players.filter((p) => (p.totalFaceoffs ?? 0) >= minFO);
    if (posFilter  !== 'All') rows = rows.filter((p) => p.position   === posFilter);
    if (teamFilter !== 'All') rows = rows.filter((p) => p.teamAbbrev === teamFilter);
    rows = [...rows].sort((a, b) => {
      const va = a[sortKey] ?? -1;
      const vb = b[sortKey] ?? -1;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return rows;
  }, [players, minFO, posFilter, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const thCls = 'whitespace-nowrap border-b border-[#1e2d45] px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]';
  const thSort = (key: typeof sortKey) => (
    <button onClick={() => toggleSort(key)} className="flex items-center gap-1 hover:text-white transition-colors">
      {key === 'foPct' ? 'FO%' : key === 'totalFaceoffs' ? 'FOA' : 'FOW'}
      {sortKey === key && <span className="text-[#00D1FF]">{sortDir === 'desc' ? '↓' : '↑'}</span>}
    </button>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-[#1e2d45]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#111520]">
            <th className={`${thCls} text-left w-8`}>#</th>
            <th className={`${thCls} text-left`}>Player</th>
            <th className={`${thCls} text-left`}>Team</th>
            <th className={`${thCls} text-center`}>Pos</th>
            <th className={`${thCls} text-center`}>GP</th>
            <th className={`${thCls} text-center cursor-pointer`}>{thSort('foWins')}</th>
            <th className={`${thCls} text-center`}>FOL</th>
            <th className={`${thCls} text-center cursor-pointer`}>{thSort('totalFaceoffs')}</th>
            <th className={`${thCls} text-center cursor-pointer`}>{thSort('foPct')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, i) => (
            <tr
              key={p.id}
              className={`border-b border-[#1e2d45] transition-colors hover:bg-[#161c2e] ${i % 2 === 0 ? 'bg-[#0B0E14]' : 'bg-[#111520]/30'}`}
            >
              <td className="px-3 py-2 font-mono text-xs text-[#94A3B8]">{i + 1}</td>
              <td className="px-3 py-2">
                <Link
                  href={`/player/${p.id}`}
                  className="flex items-center gap-2 text-white transition-colors hover:text-[#00D1FF]"
                >
                  <Image
                    src={p.headshot}
                    alt={p.fullName}
                    width={28}
                    height={28}
                    className="shrink-0 rounded-full object-cover ring-1 ring-[#1e2d45]"
                    unoptimized
                  />
                  <Image
                    src={p.teamLogo || teamLogoUrl(p.teamAbbrev)}
                    alt={p.teamAbbrev}
                    width={16}
                    height={16}
                    className="shrink-0 opacity-80"
                    unoptimized
                  />
                  <span className="font-medium">{p.fullName}</span>
                </Link>
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/team/${p.teamAbbrev}`}
                  className="flex items-center gap-1.5 text-[#94A3B8] transition-colors hover:text-[#00D1FF]"
                >
                  <Image src={p.teamLogo || teamLogoUrl(p.teamAbbrev)} alt={p.teamAbbrev} width={18} height={18} unoptimized />
                  <span className="font-mono text-xs">{p.teamAbbrev}</span>
                </Link>
              </td>
              <td className="px-3 py-2 text-center text-xs text-[#94A3B8]">{p.position}</td>
              <td className="px-3 py-2 text-center font-mono text-xs text-[#94A3B8]">{p.gamesPlayed}</td>
              <td className="px-3 py-2 text-center font-mono font-semibold text-white">{p.foWins}</td>
              <td className="px-3 py-2 text-center font-mono text-[#94A3B8]">{p.foLosses}</td>
              <td className="px-3 py-2 text-center font-mono text-[#94A3B8]">{p.totalFaceoffs}</td>
              <td className="px-3 py-2 text-center">
                <span className={`font-mono font-bold ${foPctClass(p.foPct)}`}>
                  {p.foPct != null ? `${p.foPct.toFixed(1)}%` : '—'}
                </span>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} className="py-8 text-center text-sm text-[#94A3B8]">
                No players match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SkatersPage() {
  const { season } = useSeason();
  const [posFilter, setPosFilter]   = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [gameType, setGameType]     = useState<'2' | '3'>('2');
  const [view, setView]             = useState<'points' | 'faceoffs'>('points');

  // Faceoff-specific filters
  const [foPos, setFoPos]               = useState<string>('C');
  const [foTeamFilter, setFoTeamFilter] = useState<string>('All');
  const [minFO, setMinFO]               = useState(100);

  useEffect(() => {
    setMinFO(foTeamFilter === 'All' ? 100 : 50);
  }, [foTeamFilter]);

  const { data, error, isLoading } = useSWR<any>(
    `/api/skaters?season=${season}&gameType=${gameType}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const { data: foData, isLoading: foLoading } = useSWR<any>(
    view === 'faceoffs' ? `/api/skaters/faceoffs?season=${season}&gameType=${gameType}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const foTeams = useMemo(
    () => ['All', ...Array.from(new Set((foData?.players ?? []).map((p: any) => p.teamAbbrev as string))).sort()],
    [foData]
  );

  const players = useMemo<any[]>(
    () => (data?.skaters ?? []).map((p: any, i: number) => ({ ...p, _rank: i + 1 })),
    [data]
  );

  const teams = useMemo(
    () => ['All', ...Array.from(new Set(players.map((p: any) => p.teamAbbrev))).sort()],
    [players]
  );

  const filtered = useMemo(
    () =>
      players.filter(
        (p: any) =>
          (posFilter  === 'All' || p.position   === posFilter) &&
          (teamFilter === 'All' || p.teamAbbrev === teamFilter)
      ),
    [players, posFilter, teamFilter]
  );

  const leagueAvg = useMemo(() => {
    const valid = players.filter((p) => (p.gp ?? p.gamesPlayed ?? 0) > 0);
    if (!valid.length) return { pts: null, g: null, a: null, pim: null, toiSeconds: null };
    const mean = (key: string) => valid.reduce((s: number, p: any) => s + (p[key] ?? 0), 0) / valid.length;
    return {
      pts:        mean('pts'),
      g:          mean('g'),
      a:          mean('a'),
      pim:        mean('pim'),
      toiSeconds: mean('toiSeconds'),
    };
  }, [players]);

  const columns = useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      {
        id: 'rank',
        header: '#',
        accessorFn: (r) => r._rank,
        cell: (i) => <MonoNum value={i.getValue() as number} className="text-muted text-xs" />,
        enableSorting: false,
      },
      {
        id: 'player',
        header: 'Player',
        accessorFn: (r) => `${r.firstName.default} ${r.lastName.default}`,
        cell: ({ row }) => {
          const p    = row.original;
          const name = `${p.firstName.default} ${p.lastName.default}`;
          return (
            <Link
              href={`/player/${p.id}`}
              className="flex items-center gap-2.5 text-white transition-colors hover:text-[#00D1FF]"
            >
              <Image
                src={p.headshot}
                alt={name}
                width={30}
                height={30}
                className="shrink-0 rounded-full object-cover ring-1 ring-[#1e2d45]"
                unoptimized
              />
              <span className="font-medium">{name}</span>
            </Link>
          );
        },
      },
      {
        id: 'team',
        header: 'Team',
        accessorFn: (r) => r.teamAbbrev,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <Link
              href={`/team/${p.teamAbbrev}`}
              className="flex items-center gap-1.5 text-[#94A3B8] transition-colors hover:text-[#00D1FF]"
            >
              <Image src={teamLogoUrl(p.teamAbbrev)} alt={p.teamAbbrev} width={18} height={18} unoptimized />
              <span className="font-mono text-xs">{p.teamAbbrev}</span>
            </Link>
          );
        },
      },
      {
        id: 'pos',
        header: 'Pos',
        accessorFn: (r) => r.position,
        cell: (i) => <span className="text-xs text-[#94A3B8]">{i.getValue() as string}</span>,
      },
      {
        id: 'pts',
        header: 'PTS',
        accessorFn: (r) => r.pts,
        cell: (i) => {
          const v = i.getValue() as number;
          return (
            <span className={`font-mono text-sm font-bold tabular-nums text-[#00D1FF] ${avgClass(v, leagueAvg.pts)}`}>
              {v}
            </span>
          );
        },
      },
      {
        id: 'g',
        header: 'G',
        accessorFn: (r) => r.g,
        cell: (i) => {
          const v = i.getValue() as number;
          return (
            <span className={`font-mono font-semibold tabular-nums text-white ${avgClass(v, leagueAvg.g)}`}>
              {v}
            </span>
          );
        },
      },
      {
        id: 'a',
        header: 'A',
        accessorFn: (r) => r.a,
        cell: (i) => {
          const v = i.getValue() as number;
          return (
            <span className={`font-mono tabular-nums text-white ${avgClass(v, leagueAvg.a)}`}>
              {v}
            </span>
          );
        },
      },
      {
        id: 'plusMinus',
        header: '+/−',
        accessorFn: (r) => r.plusMinus,
        cell: (i) => {
          const v = i.getValue() as number | null;
          if (v === null) return <span className="font-mono text-muted">—</span>;
          return (
            <span className={`font-mono font-semibold tabular-nums ${v > 0 ? 'text-[#22c55e]' : v < 0 ? 'text-[#ef4444]' : 'text-muted'}`}>
              {v > 0 ? `+${v}` : v}
            </span>
          );
        },
      },
      {
        id: 'pim',
        header: 'PIM',
        accessorFn: (r) => r.pim,
        cell: (i) => <MonoNum value={i.getValue() as number} className="text-[#94A3B8]" />,
      },
      {
        id: 'toi',
        header: 'TOI/G',
        accessorFn: (r) => r.toiSeconds,
        cell: (i) => (
          <span className="font-mono text-[#94A3B8]">{fmtToi(i.getValue() as number)}</span>
        ),
      },
      {
        id: 'spark',
        header: 'Last 5',
        accessorFn: (r) => r._rank,
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          if (p._rank > 20) return null;
          return <PlayerSparkline id={p.id} season={season} />;
        },
      },
    ],
    [leagueAvg, season]
  );

  const filterControls = (
    <>
      <select
        value={posFilter}
        onChange={(e) => setPosFilter(e.target.value)}
        className="rounded-lg border border-[#1e2d45] bg-[#111520] px-3 py-1.5 text-sm text-white focus:border-[#00D1FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00D1FF]/20"
        aria-label="Filter by position"
      >
        {POSITIONS.map((p) => (
          <option key={p} value={p}>{p === 'All' ? 'All Positions' : p}</option>
        ))}
      </select>
      <select
        value={teamFilter}
        onChange={(e) => setTeamFilter(e.target.value)}
        className="rounded-lg border border-[#1e2d45] bg-[#111520] px-3 py-1.5 text-sm text-white focus:border-[#00D1FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00D1FF]/20"
        aria-label="Filter by team"
      >
        {teams.map((t) => (
          <option key={t as string} value={t as string}>
            {t === 'All' ? 'All Teams' : t as string}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Skater Stats</h1>
          <p className="mt-0.5 text-xs text-[#94A3B8]">
            {view === 'points'
              ? 'League leaders sorted by points · Sparklines show last 5 games (top 20)'
              : `Faceoff leaders · min ${minFO} FO · sorted by FO%`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[#1e2d45] bg-[#111520] p-1">
            <button
              onClick={() => setView('points')}
              className={`rounded px-3 py-1 text-sm font-medium transition-all duration-150 ${
                view === 'points'
                  ? 'bg-gradient-to-r from-[#00D1FF]/15 to-[#6366f1]/15 text-white'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Points
            </button>
            <button
              onClick={() => setView('faceoffs')}
              className={`rounded px-3 py-1 text-sm font-medium transition-all duration-150 ${
                view === 'faceoffs'
                  ? 'bg-gradient-to-r from-[#00D1FF]/15 to-[#6366f1]/15 text-white'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Faceoffs
            </button>
          </div>

          {/* Game type (points view only) */}
          {view === 'points' && (
            <div className="flex items-center gap-1 rounded-lg border border-[#1e2d45] bg-[#111520] p-1">
              {GAME_TYPES.map((gt) => (
                <button
                  key={gt.id}
                  onClick={() => setGameType(gt.id as '2' | '3')}
                  className={`rounded px-3 py-1 text-sm font-medium transition-all duration-150 ${
                    gameType === gt.id
                      ? 'bg-gradient-to-r from-[#00D1FF]/15 to-[#6366f1]/15 text-white'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {gt.label}
                </button>
              ))}
            </div>
          )}
          <SeasonSelector />
        </div>
      </div>

      {/* ── Points view ── */}
      {view === 'points' && (
        <>
          {isLoading && <LoadingSpinner />}
          {error     && <ErrorMsg />}
          {!isLoading && !error && (
            <StatsTable
              data={filtered}
              columns={columns}
              globalFilterKey="firstName"
              globalFilterPlaceholder="Search player…"
              filterControls={filterControls}
            />
          )}
        </>
      )}

      {/* ── Faceoffs view ── */}
      {view === 'faceoffs' && (
        <div className="flex flex-col gap-4">
          {/* Faceoff filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Position filter */}
            <div className="flex items-center gap-1 rounded-lg border border-[#1e2d45] bg-[#111520] p-1">
              {(['All', 'C', 'L', 'R', 'D'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setFoPos(pos)}
                  className={`rounded px-2.5 py-1 text-sm font-medium transition-all duration-150 ${
                    foPos === pos
                      ? 'bg-gradient-to-r from-[#00D1FF]/15 to-[#6366f1]/15 text-white'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {pos === 'All' ? 'All Pos' : pos}
                </button>
              ))}
            </div>

            {/* Team filter */}
            <select
              value={foTeamFilter}
              onChange={(e) => setFoTeamFilter(e.target.value)}
              className="rounded-lg border border-[#1e2d45] bg-[#111520] px-3 py-1.5 text-sm text-white focus:border-[#00D1FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00D1FF]/20"
              aria-label="Filter by team"
            >
              {(foTeams as string[]).map((t) => (
                <option key={t} value={t}>{t === 'All' ? 'All Teams' : t}</option>
              ))}
            </select>

            {/* Min FO filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8]">Min FO:</span>
              <div className="flex items-center gap-1 rounded-lg border border-[#1e2d45] bg-[#111520] p-1">
                {[50, 100, 200, 500].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMinFO(n)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                      minFO === n
                        ? 'bg-gradient-to-r from-[#00D1FF]/15 to-[#6366f1]/15 text-white'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Color legend */}
            <div className="ml-auto flex items-center gap-3 text-xs">
              <span className="text-green-400">≥55% elite</span>
              <span className="text-yellow-400">50–55% average</span>
              <span className="text-red-400">&lt;50% below avg</span>
            </div>
          </div>

          {foLoading && <LoadingSpinner />}
          {!foLoading && (
            <FaceoffsTable
              players={foData?.players ?? []}
              minFO={minFO}
              posFilter={foPos}
              teamFilter={foTeamFilter}
            />
          )}
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1e2d45] border-t-[#00D1FF]" />
    </div>
  );
}

function ErrorMsg() {
  return (
    <div className="rounded-lg border border-red-800/50 bg-red-900/15 p-6 text-center text-red-400">
      Failed to load skater data.
    </div>
  );
}
