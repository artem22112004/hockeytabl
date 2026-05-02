'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import type { ColumnDef } from '@tanstack/react-table';

import StatsTable from '@/components/StatsTable';
import PlayerModal from '@/components/PlayerModal';
import SeasonSelector from '@/components/SeasonSelector';
import { useSeason } from '@/components/SeasonContext';
import { teamLogoUrl } from '@/lib/nhl-api';

const POSITIONS = ['All', 'C', 'L', 'R', 'D'] as const;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fmtToi(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface SelectedPlayer {
  id: number;
  name: string;
  headshot: string;
  teamAbbrev: string;
}

type Row = any;

export default function SkatersPage() {
  const { season } = useSeason();
  const [posFilter, setPosFilter]   = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [selected, setSelected]     = useState<SelectedPlayer | null>(null);

  const { data, error, isLoading } = useSWR<any>(
    `/api/skaters?season=${season}`,
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
          const p = row.original;
          const name = `${p.firstName.default} ${p.lastName.default}`;
          return (
            <button
              onClick={() => setSelected({ id: p.id, name, headshot: p.headshot, teamAbbrev: p.teamAbbrev })}
              className="flex items-center gap-2 text-white hover:text-accent"
            >
              <Image
                src={p.headshot}
                alt={name}
                width={28}
                height={28}
                className="rounded-full object-cover"
                unoptimized
              />
              <span className="font-medium underline-offset-2 hover:underline">{name}</span>
            </button>
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
            <div className="flex items-center gap-1.5">
              <Image src={teamLogoUrl(p.teamAbbrev)} alt={p.teamAbbrev} width={20} height={20} unoptimized />
              <span className="text-muted">{p.teamAbbrev}</span>
            </div>
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
        cell: (i) => <span className="font-bold text-accent">{i.getValue() as number}</span>,
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
          const v = i.getValue() as number;
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
          <option key={t as string} value={t as string}>{t === 'All' ? 'All Teams' : t as string}</option>
        ))}
      </select>
    </>
  );

  return (
    <>
      {selected && (
        <PlayerModal
          playerId={selected.id}
          playerName={selected.name}
          headshot={selected.headshot}
          teamAbbrev={selected.teamAbbrev}
          season={season}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">Skater Stats</h1>
          <SeasonSelector />
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
    </>
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
      Failed to load skater data.
    </div>
  );
}
