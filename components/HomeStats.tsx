'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import { useSeason } from './SeasonContext';
import { teamLogoUrl } from '@/lib/nhl-api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-3 py-3">
      <div className="h-3 w-4 rounded bg-[#1e2d45]" />
      <div className="h-9 w-9 shrink-0 rounded-full bg-[#1e2d45]" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/4 rounded bg-[#1e2d45]" />
        <div className="h-2.5 w-2/5 rounded bg-[#1e2d45]" />
      </div>
      <div className="h-4 w-12 rounded bg-[#1e2d45]" />
    </div>
  );
}

function SectionHeader({ title, href, badge }: { title: string; href: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">{title}</h2>
        {badge}
      </div>
      <Link href={href} className="text-xs font-medium text-[#00D1FF] transition-opacity hover:opacity-70">
        See all →
      </Link>
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-end">
      <span className={`font-mono text-sm font-bold tabular-nums ${accent ? 'text-[#00D1FF]' : 'text-white'}`}>
        {value}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-[#94A3B8]/60">{label}</span>
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

  const allSkaters: any[] = skatersData?.skaters ?? [];

  const topScorers = useMemo(() => allSkaters.slice(0, 5), [allSkaters]);

  const topTeams = useMemo(
    () =>
      [...(teamsData?.standings ?? [])]
        .sort((a: any, b: any) => b.points - a.points)
        .slice(0, 3),
    [teamsData]
  );

  // "Who's Hot" = top 3 by points-per-game efficiency (min 10 GP)
  const hotPlayers = useMemo(() => {
    return allSkaters
      .filter((p: any) => (p.gp ?? p.gamesPlayed ?? 0) >= 10)
      .map((p: any) => ({
        ...p,
        ppg: p.pts / Math.max(p.gp ?? p.gamesPlayed ?? 1, 1),
      }))
      .sort((a: any, b: any) => b.ppg - a.ppg)
      .slice(0, 3);
  }, [allSkaters]);

  return (
    <div className="flex flex-col gap-4">

      {/* Top row: scorers + teams */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* ── Top Scorers ── */}
        <div className="flex flex-col gap-4 rounded-xl border border-[#1e2d45] bg-[#111520] p-5 shadow-card">
          <SectionHeader title="Top Scorers" href="/skaters" />

          {loadingS ? (
            <div className="flex flex-col divide-y divide-[#1e2d45]">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#1e2d45]">
              {topScorers.map((p: any, i: number) => {
                const name = `${p.firstName.default} ${p.lastName.default}`;
                return (
                  <Link
                    key={p.id}
                    href={`/player/${p.id}`}
                    className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:text-[#00D1FF]"
                  >
                    <span className="mono w-5 shrink-0 text-center text-xs font-bold text-[#94A3B8]">
                      {i + 1}
                    </span>
                    <Image
                      src={p.headshot}
                      alt={name}
                      width={36}
                      height={36}
                      className="shrink-0 rounded-full object-cover ring-2 ring-[#1e2d45] transition-all group-hover:ring-[#00D1FF]/30"
                      unoptimized
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[#00D1FF]">
                        {name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Image src={teamLogoUrl(p.teamAbbrev)} alt={p.teamAbbrev} width={12} height={12} unoptimized />
                        <span className="text-[11px] text-[#94A3B8]">{p.teamAbbrev} · {p.position}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <StatPill label="PTS" value={p.pts} accent />
                      <StatPill label="G" value={p.g} />
                      <StatPill label="A" value={p.a} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Top Teams ── */}
        <div className="flex flex-col gap-4 rounded-xl border border-[#1e2d45] bg-[#111520] p-5 shadow-card">
          <SectionHeader title="Top Teams" href="/teams" />

          {loadingT ? (
            <div className="flex flex-col divide-y divide-[#1e2d45]">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#1e2d45]">
              {topTeams.map((t: any, i: number) => {
                const abbrev = t.teamAbbrev.default;
                const pct = t.gamesPlayed > 0
                  ? ((t.wins / t.gamesPlayed) * 100).toFixed(0)
                  : '—';
                return (
                  <Link
                    key={abbrev}
                    href={`/team/${abbrev}`}
                    className="group flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <span className="mono w-5 shrink-0 text-center text-xs font-bold text-[#94A3B8]">
                      {i + 1}
                    </span>
                    <Image
                      src={teamLogoUrl(abbrev)}
                      alt={abbrev}
                      width={40}
                      height={40}
                      className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                      unoptimized
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[#00D1FF]">
                        {t.teamName.default}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                        {t.wins}W–{t.losses}L–{t.otLosses}OT · {pct}% W
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <StatPill label="PTS" value={t.points} accent />
                      <StatPill label="GP"  value={t.gamesPlayed} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Who's Hot ── */}
      {!loadingS && hotPlayers.length > 0 && (
        <div className="rounded-xl border border-[#1e2d45] bg-[#111520] p-5 shadow-card">
          <SectionHeader
            title="Who's Hot"
            href="/skaters"
            badge={
              <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                Best P/G
              </span>
            }
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {hotPlayers.map((p: any, i: number) => {
              const name = `${p.firstName.default} ${p.lastName.default}`;
              const rank = [
                { label: '#1', color: '#FFD700', bg: 'rgba(255,215,0,0.08)' },
                { label: '#2', color: '#94A3B8', bg: 'rgba(148,163,184,0.06)' },
                { label: '#3', color: '#CD853F', bg: 'rgba(205,133,63,0.07)' },
              ][i];

              return (
                <Link
                  key={p.id}
                  href={`/player/${p.id}`}
                  className="group flex items-center gap-3 rounded-lg border border-[#1e2d45] p-3 transition-all duration-200 hover:border-[#00D1FF]/20"
                  style={{ background: rank.bg }}
                >
                  <Image
                    src={p.headshot}
                    alt={name}
                    width={44}
                    height={44}
                    className="shrink-0 rounded-full object-cover ring-2 transition-all"
                    style={{ borderColor: rank.color + '60' }}
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{name}</p>
                    <p className="text-[11px] text-[#94A3B8]">{p.teamAbbrev} · {p.position}</p>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="font-mono text-lg font-bold tabular-nums text-[#00D1FF]">
                        {p.ppg.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">P/G</span>
                      <span className="font-mono text-xs text-[#94A3B8]">({p.pts} PTS)</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold" style={{ color: rank.color }}>
                    {rank.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
