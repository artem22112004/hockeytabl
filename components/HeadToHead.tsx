'use client';

import useSWR from 'swr';
import Image from 'next/image';
import { teamLogoUrl } from '@/lib/nhl-api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const THRESHOLDS = [2.5, 3.5, 4.5, 5.5];

function pctColor(pct: number) {
  if (pct >= 65) return 'text-green-400';
  if (pct >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

interface Props {
  team1Abbrev: string;
  team2Abbrev: string;
  season:      string;
}

export default function HeadToHead({ team1Abbrev, team2Abbrev, season }: Props) {
  const { data, isLoading } = useSWR<any>(
    `/api/h2h?team1=${team1Abbrev}&team2=${team2Abbrev}&season=${season}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const games: any[] = data?.games ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-border border-t-[#3b82f6]" />
      </div>
    );
  }

  if (!isLoading && games.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No recent meetings found.</p>;
  }

  const team1Wins = games.filter((g) => g.winner === team1Abbrev).length;
  const team2Wins = games.filter((g) => g.winner === team2Abbrev).length;
  const avgTotal  = (games.reduce((s, g) => s + g.total, 0) / games.length).toFixed(1);

  const overCounts = THRESHOLDS.map((t) => ({
    threshold: t,
    count:     games.filter((g) => g.total > t).length,
  }));

  return (
    <div className="flex flex-col gap-4">

      {/* Win summary */}
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <Image src={teamLogoUrl(team1Abbrev)} alt={team1Abbrev} width={36} height={36} unoptimized />
          <span className="text-3xl font-bold text-white">{team1Wins}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg text-muted">—</span>
          <span className="text-xs text-muted">{games.length} meetings</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-white">{team2Wins}</span>
          <Image src={teamLogoUrl(team2Abbrev)} alt={team2Abbrev} width={36} height={36} unoptimized />
        </div>
      </div>

      {/* Totals chips */}
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          Avg total: <span className="font-bold text-white">{avgTotal}</span>
        </span>
        {overCounts.map(({ threshold, count }) => {
          const pct = Math.round((count / games.length) * 100);
          return (
            <span
              key={threshold}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted"
            >
              O {threshold}:{' '}
              <span className={`font-bold ${pctColor(pct)}`}>
                {count}/{games.length}
              </span>
            </span>
          );
        })}
      </div>

      {/* Games table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface text-xs font-semibold uppercase tracking-wider text-muted">
              <th className="border-b border-border px-3 py-2.5 text-left">Date</th>
              <th className="border-b border-border px-3 py-2.5 text-left">Away</th>
              <th className="border-b border-border px-3 py-2.5 text-center">Score</th>
              <th className="border-b border-border px-3 py-2.5 text-left">Home</th>
              <th className="border-b border-border px-3 py-2.5 text-center">Total</th>
              {THRESHOLDS.map((t) => (
                <th key={t} className="border-b border-border px-2 py-2.5 text-center">
                  O {t}
                </th>
              ))}
              <th className="border-b border-border px-3 py-2.5 text-left">Winner</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g: any, i: number) => (
              <tr
                key={g.gameId}
                className={`border-b border-border ${i % 2 === 0 ? 'bg-base' : 'bg-surface/30'}`}
              >
                <td className="whitespace-nowrap px-3 py-2 text-muted">{g.gameDate}</td>
                <td className="px-3 py-2 font-medium text-white">{g.awayAbbrev}</td>
                <td className="px-3 py-2 text-center font-bold tabular-nums text-white">
                  {g.awayScore}–{g.homeScore}
                  {g.lastPeriodType !== 'REG' && (
                    <span className="ml-1 text-[10px] text-muted">{g.lastPeriodType}</span>
                  )}
                </td>
                <td className="px-3 py-2 font-medium text-white">{g.homeAbbrev}</td>
                <td className="px-3 py-2 text-center tabular-nums font-semibold text-white">{g.total}</td>
                {THRESHOLDS.map((t) => (
                  <td
                    key={t}
                    className={`px-2 py-2 text-center font-bold ${g.total > t ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {g.total > t ? 'O' : 'U'}
                  </td>
                ))}
                <td className="px-3 py-2 font-medium text-white">{g.winner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
