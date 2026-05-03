'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';

import StatsTable from '@/components/StatsTable';
import SeasonSelector from '@/components/SeasonSelector';
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

  const columns = useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      {
        id: 'rank',
        header: '#',
        accessorFn: (r) => r._rank,
        cell: (i) => <span className="text-muted">{i.getValue() as number}</span>,
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
              className="flex items-center gap-2 text-white transition-colors hover:text-[#3b82f6]"
            >
              <Image
                src={p.headshot}
                alt={name}
                width={28}
                height={28}
                className="shrink-0 rounded-full object-cover ring-1 ring-border"
                unoptimized
              />
              <span className="font-medium underline-offset-2 hover:underline">{name}</span>
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
              className="flex items-center gap-1.5 transition-colors hover:text-[#3b82f6]"
            >
              <Image src={teamLogoUrl(p.teamAbbrev)} alt={p.teamAbbrev} width={20} height={20} unoptimized />
              <span className="text-muted">{p.teamAbbrev}</span>
            </Link>
          );
        },
      },
      {
        id: 'pos',
        header: 'Pos',
        accessorFn: (r) => r.position,
        cell: (i) => <span className="text-muted">{i.getValue() as string}</span>,
      },
      {
        id: 'pts',
        header: 'PTS',
        accessorFn: (r) => r.pts,
        cell: (i) => <span className="font-bold text-[#3b82f6]">{i.getValue() as number}</span>,
      },
      {
        id: 'g',
        header: 'G',
        accessorFn: (r) => r.g,
        cell: (i) => <span className="font-semibold">{i.getValue() as number}</span>,
      },
      {
        id: 'a',
        header: 'A',
        accessorFn: (r) => r.a,
        cell: (i) => i.getValue() as number,
      },
      {
        id: 'plusMinus',
        header: '+/−',
        accessorFn: (r) => r.plusMinus,
        cell: (i) => {
          const v = i.getValue() as number | null;
          if (v === null) return <span className="text-muted">—</span>;
          return (
            <span className={v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-muted'}>
              {v > 0 ? `+${v}` : v}
            </span>
          );
        },
      },
      {
        id: 'pim',
        header: 'PIM',
        accessorFn: (r) => r.pim,
        cell: (i) => i.getValue() as number,
      },
      {
        id: 'toi',
        header: 'TOI/G',
        accessorFn: (r) => r.toiSeconds,
        cell: (i) => <span className="text-muted">{fmtToi(i.getValue() as number)}</span>,
      },
    ],
    []
  );

  const filterControls = (
    <>
      <select
        value={posFilter}
        onChange={(e) => setPosFilter(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-white transition-colors focus:border-[#3b82f6]/50 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]/40"
        aria-label="Filter by position"
      >
        {POSITIONS.map((p) => (
          <option key={p} value={p}>{p === 'All' ? 'All Positions' : p}</option>
        ))}
      </select>
      <select
        value={teamFilter}
        onChange={(e) => setTeamFilter(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-white transition-colors focus:border-[#3b82f6]/50 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]/40"
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
        <h1 className="text-2xl font-bold text-white">Skater Stats</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            {GAME_TYPES.map((gt) => (
              <button
                key={gt.id}
                onClick={() => setGameType(gt.id as '2' | '3')}
                className={`rounded px-3 py-1 text-sm font-medium transition-all duration-150 ${
                  gameType === gt.id
                    ? 'bg-gradient-to-r from-[#3b82f6]/20 to-[#06b6d4]/20 text-white'
                    : 'text-muted hover:text-white'
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
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-[#3b82f6]" />
    </div>
  );
}

function ErrorMsg() {
  return (
    <div className="rounded-lg border border-red-800 bg-red-900/20 p-6 text-center text-red-400">
      Failed to load skater data.
    </div>
  );
}
