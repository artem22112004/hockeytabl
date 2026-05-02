'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';

import StatsTable from '@/components/StatsTable';
import SeasonSelector from '@/components/SeasonSelector';
import { teamLogoUrl } from '@/lib/nhl-api';
import { useSeason } from '@/components/SeasonContext';

type GroupBy = 'none' | 'conference' | 'division';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TeamsPage() {
  const { season } = useSeason();
  const [groupBy, setGroupBy] = useState<GroupBy>('division');

  const { data, error, isLoading } = useSWR<any>(
    '/api/teams',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const teams: any[] = useMemo(() => data?.standings ?? [], [data]);

  const columns = useMemo<ColumnDef<any, unknown>[]>(
    () => [
      {
        id: 'team',
        header: 'Team',
        accessorFn: (r) => r.teamCommonName.default,
        cell: ({ row }) => {
          const t      = row.original;
          const abbrev = t.teamAbbrev.default;
          return (
            <Link
              href={`/team/${abbrev}`}
              className="flex items-center gap-2 text-left transition-colors hover:text-[#3b82f6]"
            >
              <Image src={teamLogoUrl(abbrev)} alt={abbrev} width={24} height={24} unoptimized />
              <span className="font-medium text-white underline-offset-2 hover:underline">
                {t.teamName.default}
              </span>
              <span className="text-xs text-muted">({abbrev})</span>
            </Link>
          );
        },
      },
      {
        id: 'gp',
        header: 'GP',
        accessorFn: (r) => r.gamesPlayed,
        cell: (i) => i.getValue() as number,
      },
      {
        id: 'w',
        header: 'W',
        accessorFn: (r) => r.wins,
        cell: (i) => <span className="font-semibold text-green-400">{i.getValue() as number}</span>,
      },
      {
        id: 'l',
        header: 'L',
        accessorFn: (r) => r.losses,
        cell: (i) => <span className="text-red-400">{i.getValue() as number}</span>,
      },
      {
        id: 'ot',
        header: 'OT',
        accessorFn: (r) => r.otLosses,
        cell: (i) => i.getValue() as number,
      },
      {
        id: 'pts',
        header: 'PTS',
        accessorFn: (r) => r.points,
        cell: (i) => <span className="font-bold text-[#3b82f6]">{i.getValue() as number}</span>,
      },
      {
        id: 'gf',
        header: 'GF',
        accessorFn: (r) => r.goalFor,
        cell: (i) => i.getValue() as number,
      },
      {
        id: 'ga',
        header: 'GA',
        accessorFn: (r) => r.goalAgainst,
        cell: (i) => i.getValue() as number,
      },
      {
        id: 'diff',
        header: 'DIFF',
        accessorFn: (r) => r.goalDifferential,
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
        id: 'row',
        header: 'ROW',
        accessorFn: (r) => r.regulationPlusOtWins,
        cell: (i) => i.getValue() as number,
      },
    ],
    []
  );

  return (
    <PageShell groupBy={groupBy} setGroupBy={setGroupBy} season={season}>
      {isLoading && <LoadingSpinner />}
      {error     && <ErrorMsg />}

      {!isLoading && !error && groupBy === 'none' && (
        <StatsTable
          data={teams}
          columns={columns}
          globalFilterKey="teamCommonName"
          globalFilterPlaceholder="Search team…"
        />
      )}

      {!isLoading && !error && groupBy !== 'none' &&
        groupTeams(teams, groupBy).map(({ label, rows }) => (
          <section key={label} className="flex flex-col gap-3">
            <h2 className="text-base font-semibold uppercase tracking-widest text-muted">{label}</h2>
            <StatsTable data={rows} columns={columns} />
          </section>
        ))
      }
    </PageShell>
  );
}

function groupTeams(teams: any[], by: 'conference' | 'division') {
  const map = new Map<string, any[]>();
  for (const t of teams) {
    const key = by === 'conference' ? t.conferenceName : t.divisionName;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, rows]) => ({ label, rows: rows.sort((a: any, b: any) => b.points - a.points) }));
}

function PageShell({ groupBy, setGroupBy, season, children }: {
  groupBy: GroupBy;
  setGroupBy: (g: GroupBy) => void;
  season: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Team Standings</h1>
        <div className="flex items-center gap-3">
          <SeasonSelector />
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            {(['none', 'conference', 'division'] as GroupBy[]).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`rounded px-3 py-1 text-sm font-medium transition-all duration-150 ${
                  groupBy === g
                    ? 'bg-gradient-to-r from-[#3b82f6]/20 to-[#06b6d4]/20 text-white'
                    : 'text-muted hover:text-white'
                }`}
              >
                {g === 'none' ? 'League' : g === 'conference' ? 'Conference' : 'Division'}
              </button>
            ))}
          </div>
        </div>
      </div>
      {children}
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
      Failed to load standings.
    </div>
  );
}
