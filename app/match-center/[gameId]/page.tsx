'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import TeamStatsPanel from '@/components/TeamStatsPanel';
import BettingStats from '@/components/BettingStats';
import HeadToHead from '@/components/HeadToHead';
import StatComparisonPanel from '@/components/StatComparisonPanel';
import GameSummary from '@/components/GameSummary';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = 'summary' | 'stats' | 'betting' | 'h2h';

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Game Summary' },
  { id: 'stats',   label: 'Match Stats' },
  { id: 'betting', label: 'Betting Stats' },
  { id: 'h2h',     label: 'Head to Head' },
];

export default function MatchCenterGamePage({ params }: { params: { gameId: string } }) {
  const { gameId } = params;
  const [tab, setTab] = useState<Tab>('summary');

  const { data: game, isLoading: gameLoading } = useSWR<any>(
    `/api/game/${gameId}`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 30_000 }
  );

  const { data: standings } = useSWR<any>(
    '/api/teams',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const rankByAbbrev: Record<string, number> = {};
  if (standings?.standings) {
    (standings.standings as any[]).forEach((t, i) => {
      rankByAbbrev[t.teamAbbrev.default] = i + 1;
    });
  }

  if (gameLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-[#3b82f6]" />
      </div>
    );
  }

  if (!game || game.error) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/match-center" className="text-sm text-muted hover:text-[#3b82f6]">← Back</Link>
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-8 text-center text-red-400">
          Game not found.
        </div>
      </div>
    );
  }

  const isFinal  = game.gameState === 'OFF' || game.gameState === 'FINAL';
  const isLive   = game.gameState === 'LIVE' || game.gameState === 'CRIT';
  const hasScore = (isFinal || isLive) && game.awayTeam.score !== null;
  const suffix   = game.lastPeriodType && game.lastPeriodType !== 'REG' ? `/${game.lastPeriodType}` : '';

  return (
    <div className="flex flex-col gap-5">

      {/* Back */}
      <Link href="/match-center" className="w-fit text-sm text-muted transition-colors hover:text-[#3b82f6]">
        ← Match Center
      </Link>

      {/* Match header */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between gap-4">

          {/* Away team */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <Image src={game.awayTeam.logo} alt={game.awayTeam.abbrev} width={80} height={80} unoptimized />
            <p className="text-xl font-bold text-white">{game.awayTeam.name}</p>
            <p className="text-sm text-muted">{game.awayTeam.abbrev}</p>
            {rankByAbbrev[game.awayTeam.abbrev] && (
              <span className="rounded bg-base px-2 py-0.5 text-xs text-muted">
                #{rankByAbbrev[game.awayTeam.abbrev]} overall
              </span>
            )}
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-2">
            {hasScore ? (
              <p className="text-5xl font-bold tabular-nums text-white">
                {game.awayTeam.score} : {game.homeTeam.score}
              </p>
            ) : (
              <p className="text-3xl font-medium text-muted">vs</p>
            )}
            <p className="text-sm text-muted">{game.gameDate}</p>
            {isFinal && (
              <span className="rounded bg-base px-2 py-0.5 text-xs text-muted">
                Final{suffix}
              </span>
            )}
            {isLive && (
              <span className="animate-pulse rounded bg-green-900/40 px-2 py-0.5 text-xs font-bold text-green-400">
                LIVE · P{game.period}
              </span>
            )}
            {!isFinal && !isLive && (
              <span className="rounded bg-base px-2 py-0.5 text-xs text-muted">Upcoming</span>
            )}
          </div>

          {/* Home team */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <Image src={game.homeTeam.logo} alt={game.homeTeam.abbrev} width={80} height={80} unoptimized />
            <p className="text-xl font-bold text-white">{game.homeTeam.name}</p>
            <p className="text-sm text-muted">{game.homeTeam.abbrev}</p>
            {rankByAbbrev[game.homeTeam.abbrev] && (
              <span className="rounded bg-base px-2 py-0.5 text-xs text-muted">
                #{rankByAbbrev[game.homeTeam.abbrev]} overall
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 self-start">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
              tab === t.id
                ? 'bg-gradient-to-r from-[#3b82f6]/20 to-[#06b6d4]/20 text-white'
                : 'text-muted hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'summary' && (
        <GameSummary
          gameId={gameId}
          awayAbbrev={game.awayTeam.abbrev}
          awayLogo={game.awayTeam.logo}
          homeAbbrev={game.homeTeam.abbrev}
          homeLogo={game.homeTeam.logo}
        />
      )}

      {tab === 'stats' && (
        <div className="flex flex-col gap-4">
          <StatComparisonPanel
            awayAbbrev={game.awayTeam.abbrev}
            awayName={game.awayTeam.name}
            awayLogo={game.awayTeam.logo}
            homeAbbrev={game.homeTeam.abbrev}
            homeName={game.homeTeam.name}
            homeLogo={game.homeTeam.logo}
            season={game.season}
          />
          <div className="grid gap-4 xl:grid-cols-2">
            <TeamStatsPanel
              abbrev={game.awayTeam.abbrev}
              name={game.awayTeam.name}
              logo={game.awayTeam.logo}
              rankByAbbrev={rankByAbbrev}
            />
            <TeamStatsPanel
              abbrev={game.homeTeam.abbrev}
              name={game.homeTeam.name}
              logo={game.homeTeam.logo}
              rankByAbbrev={rankByAbbrev}
            />
          </div>
        </div>
      )}

      {tab === 'betting' && (
        <div className="grid gap-4 xl:grid-cols-2">
          <BettingStats
            abbrev={game.awayTeam.abbrev}
            name={game.awayTeam.name}
            logo={game.awayTeam.logo}
            season={game.season}
          />
          <BettingStats
            abbrev={game.homeTeam.abbrev}
            name={game.homeTeam.name}
            logo={game.homeTeam.logo}
            season={game.season}
          />
        </div>
      )}

      {tab === 'h2h' && (
        <HeadToHead
          team1Abbrev={game.awayTeam.abbrev}
          team2Abbrev={game.homeTeam.abbrev}
          season={game.season}
        />
      )}

    </div>
  );
}
