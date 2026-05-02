'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import { useSeason } from './SeasonContext';
import { teamLogoUrl } from '@/lib/nhl-api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</h2>
      <Link
        href={href}
        className="text-xs font-medium text-[#3b82f6] transition-colors hover:text-[#06b6d4]"
      >
        See all →
      </Link>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-3 py-3">
      <div className="h-3.5 w-4 rounded bg-border" />
      <div className="h-8 w-8 shrink-0 rounded-full bg-border" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-3/4 rounded bg-border" />
        <div className="h-2.5 w-2/5 rounded bg-border" />
      </div>
      <div className="h-4 w-16 rounded bg-border" />
    </div>
  );
}

export default function HomeStats() {
  const { season } = useSeason();

  const { data: skatersData, isLoading: loadingS } = useSWR<any>(
    `/api/skaters?season=${season}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const { data: teamsData, isLoading: loadingT } = useSWR<any>(
    '/api/teams',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const topScorers = useMemo<any[]>(
    () => (skatersData?.skaters ?? []).slice(0, 5),
    [skatersData]
  );

  const topTeams = useMemo<any[]>(
    () =>
      [...(teamsData?.standings ?? [])]
        .sort((a: any, b: any) => b.points - a.points)
        .slice(0, 3),
    [teamsData]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">

      {/* ── Top Scorers ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
        <SectionHeader title="Top Scorers" href="/skaters" />

        {loadingS ? (
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {topScorers.map((p: any, i: number) => {
              const name = `${p.firstName.default} ${p.lastName.default}`;
              return (
                <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-muted">{i + 1}</span>
                  <Image
                    src={p.headshot}
                    alt={name}
                    width={34}
                    height={34}
                    className="shrink-0 rounded-full object-cover ring-2 ring-border"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Image
                        src={teamLogoUrl(p.teamAbbrev)}
                        alt={p.teamAbbrev}
                        width={14}
                        height={14}
                        unoptimized
                      />
                      <span className="text-xs text-muted">{p.teamAbbrev} · {p.position}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <div>
                      <p className="text-sm font-bold text-[#3b82f6]">{p.pts}</p>
                      <p className="text-[10px] text-muted">PTS</p>
                    </div>
                    <div className="hidden xs:block">
                      <p className="text-sm font-semibold text-white">{p.g}</p>
                      <p className="text-[10px] text-muted">G</p>
                    </div>
                    <div className="hidden xs:block">
                      <p className="text-sm font-semibold text-white">{p.a}</p>
                      <p className="text-[10px] text-muted">A</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Top Teams ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
        <SectionHeader title="Top Teams by Points" href="/teams" />

        {loadingT ? (
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {topTeams.map((t: any, i: number) => {
              const abbrev = t.teamAbbrev.default;
              return (
                <div key={abbrev} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-muted">{i + 1}</span>
                  <Image
                    src={teamLogoUrl(abbrev)}
                    alt={abbrev}
                    width={38}
                    height={38}
                    className="shrink-0"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{t.teamName.default}</p>
                    <p className="mt-0.5 text-xs text-muted">{t.conferenceName} · {t.divisionName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <div>
                      <p className="text-sm font-bold text-[#3b82f6]">{t.points}</p>
                      <p className="text-[10px] text-muted">PTS</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-400">{t.wins}</p>
                      <p className="text-[10px] text-muted">W</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-400">{t.losses}</p>
                      <p className="text-[10px] text-muted">L</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.gamesPlayed}</p>
                      <p className="text-[10px] text-muted">GP</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
