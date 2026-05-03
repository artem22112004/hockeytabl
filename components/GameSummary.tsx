'use client';

import useSWR from 'swr';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function periodLabel(period: number, type: string): string {
  if (type === 'OT') return 'OT';
  if (type === 'SO') return 'SO';
  if (period === 1) return '1st';
  if (period === 2) return '2nd';
  if (period === 3) return '3rd';
  return `P${period}`;
}

function fmtPenalty(key: string): string {
  if (!key) return 'Penalty';
  return key.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

interface TeamSide {
  abbrev: string;
  logo:   string;
}

function GoalRow({
  goal, away, home,
}: {
  goal: any;
  away: TeamSide;
  home: TeamSide;
}) {
  const isHome = goal.scorerTeam === home.abbrev;
  const period = periodLabel(goal.period, goal.periodType);

  const assists = [goal.assist1Name, goal.assist2Name].filter(Boolean);
  const assistStr = assists.length > 0 ? `${assists.join(', ')}` : 'Unassisted';

  const score = (
    <span className="font-mono text-sm font-bold tabular-nums text-white">
      {goal.awayScore ?? '?'}–{goal.homeScore ?? '?'}
    </span>
  );

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 border-b border-[#1e2d45] py-2.5 last:border-0">
      {/* Away side */}
      <div className={`flex flex-col gap-0.5 ${isHome ? 'opacity-0 pointer-events-none' : ''}`}>
        {!isHome && (
          <>
            <div className="flex items-center gap-1.5">
              <Image src={away.logo} alt={away.abbrev} width={14} height={14} unoptimized />
              <span className="text-sm font-bold text-white">{goal.scorerName}</span>
              {goal.isEmptyNet && <span className="rounded bg-[#ef4444]/15 px-1 text-[9px] font-bold text-[#ef4444]">EN</span>}
            </div>
            <span className="text-[11px] text-[#94A3B8]">{assistStr}</span>
          </>
        )}
      </div>

      {/* Center: time + score */}
      <div className="flex min-w-[90px] flex-col items-center gap-0.5">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">
          {period} · {goal.time}
        </span>
        {score}
      </div>

      {/* Home side */}
      <div className={`flex flex-col items-end gap-0.5 ${!isHome ? 'opacity-0 pointer-events-none' : ''}`}>
        {isHome && (
          <>
            <div className="flex items-center gap-1.5">
              {goal.isEmptyNet && <span className="rounded bg-[#ef4444]/15 px-1 text-[9px] font-bold text-[#ef4444]">EN</span>}
              <span className="text-sm font-bold text-white">{goal.scorerName}</span>
              <Image src={home.logo} alt={home.abbrev} width={14} height={14} unoptimized />
            </div>
            <span className="text-right text-[11px] text-[#94A3B8]">{assistStr}</span>
          </>
        )}
      </div>
    </div>
  );
}

function PenaltyRow({
  penalty, away, home,
}: {
  penalty: any;
  away: TeamSide;
  home: TeamSide;
}) {
  const isHome = penalty.teamAbbrev === home.abbrev;
  const period = periodLabel(penalty.period, penalty.periodType);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 border-b border-[#1e2d45] py-2 last:border-0">
      {/* Away side */}
      <div className={`flex flex-col gap-0.5 ${isHome ? 'opacity-0 pointer-events-none' : ''}`}>
        {!isHome && (
          <>
            <div className="flex items-center gap-1.5">
              <Image src={away.logo} alt={away.abbrev} width={12} height={12} unoptimized />
              <span className="text-xs font-semibold text-white">{penalty.playerName}</span>
            </div>
            <span className="text-[11px] text-[#94A3B8]">{fmtPenalty(penalty.penaltyType)} · {penalty.duration} min</span>
          </>
        )}
      </div>

      {/* Center */}
      <div className="flex min-w-[90px] flex-col items-center">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">
          {period} · {penalty.time}
        </span>
      </div>

      {/* Home side */}
      <div className={`flex flex-col items-end gap-0.5 ${!isHome ? 'opacity-0 pointer-events-none' : ''}`}>
        {isHome && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white">{penalty.playerName}</span>
              <Image src={home.logo} alt={home.abbrev} width={12} height={12} unoptimized />
            </div>
            <span className="text-right text-[11px] text-[#94A3B8]">{fmtPenalty(penalty.penaltyType)} · {penalty.duration} min</span>
          </>
        )}
      </div>
    </div>
  );
}

interface Props {
  gameId: string;
  awayAbbrev: string;
  awayLogo:   string;
  homeAbbrev: string;
  homeLogo:   string;
}

export default function GameSummary({ gameId, awayAbbrev, awayLogo, homeAbbrev, homeLogo }: Props) {
  const { data, isLoading } = useSWR(
    `/api/game/${gameId}/play-by-play`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 30_000 }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1e2d45] border-t-[#00D1FF]" />
      </div>
    );
  }

  if (!data || data.error || (data.goals?.length === 0 && data.penalties?.length === 0)) {
    return (
      <div className="rounded-xl border border-[#1e2d45] bg-[#111520] p-8 text-center text-[#94A3B8]">
        No play-by-play data available for this game.
      </div>
    );
  }

  const away: TeamSide = { abbrev: awayAbbrev, logo: awayLogo };
  const home: TeamSide = { abbrev: homeAbbrev, logo: homeLogo };

  const goals: any[]     = data.goals     ?? [];
  const penalties: any[] = data.penalties ?? [];

  // Column headers
  const columnHeader = (
    <div className="grid grid-cols-[1fr_auto_1fr] border-b border-[#1e2d45] pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
      <div className="flex items-center gap-1.5">
        <Image src={awayLogo} alt={awayAbbrev} width={14} height={14} unoptimized />
        {awayAbbrev}
        <span className="ml-1 font-mono text-sm font-bold text-white">{data.awayScore ?? ''}</span>
      </div>
      <div className="min-w-[90px] text-center">Time</div>
      <div className="flex items-center justify-end gap-1.5">
        <span className="font-mono text-sm font-bold text-white">{data.homeScore ?? ''}</span>
        {homeAbbrev}
        <Image src={homeLogo} alt={homeAbbrev} width={14} height={14} unoptimized />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Goals */}
      <div className="rounded-xl border border-[#1e2d45] bg-[#111520] p-4 shadow-card">
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">
          Goals · {goals.length}
        </h3>
        {columnHeader}
        {goals.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#94A3B8]">No goals yet</p>
        ) : (
          goals.map((g, i) => (
            <GoalRow key={i} goal={g} away={away} home={home} />
          ))
        )}
      </div>

      {/* Penalties */}
      <div className="rounded-xl border border-[#1e2d45] bg-[#111520] p-4 shadow-card">
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">
          Penalties · {penalties.length}
        </h3>
        {columnHeader}
        {penalties.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#94A3B8]">No penalties</p>
        ) : (
          penalties.map((p, i) => (
            <PenaltyRow key={i} penalty={p} away={away} home={home} />
          ))
        )}
      </div>
    </div>
  );
}
