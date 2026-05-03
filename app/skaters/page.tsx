'use client';

import { useMemo, useState } from 'react';
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

// Returns Tailwind class for above/below average tint
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

export default function SkatersPage() {
  const { season } = useSeason();
  const [posFilter, setPosFilter]   = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [gameType, setGameType]     = useState<'2' | '3'>('2');

  const { data, error, isLoading } = useSWR<any>(
    `/api/skaters?season=${season}&gameType=${gameType}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
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

  // League averages for color coding (from all loaded players)
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
            League leaders sorted by points · Sparklines show last 5 games (top 20)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          <SeasonSelector />
        </div>
      </div>

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
