'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import type { ColumnDef } from '@tanstack/react-table';

import StatsTable from '@/components/StatsTable';
import { useSeason } from '@/components/SeasonContext';
import { teamLogoUrl } from '@/lib/nhl-api';
import type { NormalizedGoalie, NormalizedGoaliesResponse } from '@/types/nhl';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Row = NormalizedGoalie & { _rank: number };

export default function GoaliesPage() {
  const { season } = useSeason();

  const { data, error, isLoading } = useSWR<NormalizedGoaliesResponse>(
    `/api/goalies?season=${season}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const goalies = useMemo<Row[]>(
    () => (data?.goalies ?? []).map((g, i) => ({ ...g, _rank: i + 1 })),
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
          const g = row.original;
          const name = `${g.firstName.default} ${g.lastName.default}`;
          return (
            <div className="flex items-center gap-2">
              <Image src={g.headshot} alt={name} width={28} height={28} className="rounded-full object-cover" unoptimized />
              <span className="font-medium text-white">{name}</span>
            </div>
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
            <div className="flex items-center gap-1.5">
              <Image src={teamLogoUrl(g.teamAbbrev)} alt={g.teamAbbrev} width={20} height={20} unoptimized />
              <span className="text-muted">{g.teamAbbrev}</span>
            </div>
          );
        },
      },
      {
        id: 'w',
        header: 'W',
        accessorFn: (r) => r.w,
        cell: (i) => <span className="font-bold text-accent">{i.getValue() as number}</span>,
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
      <h1 className="text-2xl font-bold text-white">Goalie Stats</h1>

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
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent" />
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
