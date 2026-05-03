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

const GAME_TYPES = [
  { id: '2', label: 'Regular Season' },
  { id: '3', label: 'Playoffs' },
] as const;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Row = any;

export default function GoaliesPage() {
  const { season } = useSeason();
  const [gameType, setGameType] = useState<'2' | '3'>('2');

  const { data, error, isLoading } = useSWR<any>(
    `/api/goalies?season=${season}&gameType=${gameType}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const goalies = useMemo<any[]>(
    () => (data?.goalies ?? []).map((g: any, i: number) => ({ ...g, _rank: i + 1 })),
    [data]
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
        header: 'Goalie',
        accessorFn: (r) => `${r.firstName.default} ${r.lastName.default}`,
        cell: ({ row }) => {
          const g    = row.original;
          const name = `${g.firstName.default} ${g.lastName.default}`;
          return (
            <Link
              href={`/player/${g.id}`}
              className="flex items-center gap-2 text-white transition-colors hover:text-[#3b82f6]"
            >
              <Image
                src={g.headshot}
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
          const g = row.original;
          return (
            <Link
              href={`/team/${g.teamAbbrev}`}
              className="flex items-center gap-1.5 transition-colors hover:text-[#3b82f6]"
            >
              <Image src={teamLogoUrl(g.teamAbbrev)} alt={g.teamAbbrev} width={20} height={20} unoptimized />
              <span className="text-muted">{g.teamAbbrev}</span>
            </Link>
          );
        },
      },
      {
        id: 'w',
        header: 'W',
        accessorFn: (r) => r.w,
        cell: (i) => <span className="font-bold text-[#3b82f6]">{i.getValue() as number}</span>,
      },
      {
        id: 'gaa',
        header: 'GAA',
        accessorFn: (r) => r.gaa,
        cell: (i) => <span className="font-semibold">{(i.getValue() as number).toFixed(2)}</span>,
      },
      {
        id: 'savePctg',
        header: 'SV%',
        accessorFn: (r) => r.savePctg,
        cell: (i) => <span className="font-semibold text-green-400">{(i.getValue() as number).toFixed(3)}</span>,
      },
      {
        id: 'shutouts',
        header: 'SO',
        accessorFn: (r) => r.shutouts,
        cell: (i) => i.getValue() as number,
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Goalie Stats</h1>
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
          data={goalies}
          columns={columns}
          globalFilterKey="firstName"
          globalFilterPlaceholder="Search goalie…"
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
      Failed to load goalie data.
    </div>
  );
}
