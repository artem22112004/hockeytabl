'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';

interface Props {
  abbrev: string;
  name:   string;
  logo:   string;
  rankByAbbrev: Record<string, number>;
}

const SEASONS = [
  { label: '25-26', value: '20252026' },
  { label: '24-25', value: '20242025' },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

type Venue    = 'all' | 'home' | 'away';
type P1Filter = 'all' | 'win' | 'loss' | 'tie';
type GameType = 'all' | 'reg' | 'ot';

export default function TeamStatsPanel({ abbrev, name, logo, rankByAbbrev }: Props) {
  const [season,   setSeason]   = useState('20252026');
  const [venue,    setVenue]    = useState<Venue>('all');
  const [topN,     setTopN]     = useState(0);
  const [lastN,    setLastN]    = useState(0);
  const [p1Filter, setP1Filter] = useState<P1Filter>('all');
  const [gameType, setGameType] = useState<GameType>('all');

  const { data, isLoading } = useSWR<any>(
    `/api/team/${abbrev}/season-games?season=${season}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const allGames: any[] = data?.games ?? [];

  const filtered = useMemo(() => {
    let g = allGames;

    if (venue === 'home') g = g.filter((x: any) => x.homeOrAway === 'H');
    else if (venue === 'away') g = g.filter((x: any) => x.homeOrAway === 'A');

    if (topN > 0)
      g = g.filter((x: any) => (rankByAbbrev[x.oppAbbrev] ?? 999) <= topN);

    if (p1Filter !== 'all') {
      const map: Record<P1Filter, 'W' | 'L' | 'T'> = { all: 'W', win: 'W', loss: 'L', tie: 'T' };
      g = g.filter((x: any) => x.p1Result === null || x.p1Result === map[p1Filter]);
    }

    if (gameType === 'reg') g = g.filter((x: any) => !x.isOT);
    else if (gameType === 'ot') g = g.filter((x: any) => x.isOT);

    if (lastN > 0) g = g.slice(-lastN);

    return g;
  }, [allGames, venue, topN, p1Filter, gameType, lastN, rankByAbbrev]);

  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const gfs    = filtered.map((g: any) => g.gf);
    const gas    = filtered.map((g: any) => g.ga);
    const totals = filtered.map((g: any) => g.total);
    return {
      gp:       filtered.length,
      w:        filtered.filter((g: any) => g.isWin && !g.isOT).length,
      wot:      filtered.filter((g: any) => g.isWin && g.isOT).length,
      l:        filtered.filter((g: any) => !g.isWin && !g.isOT).length,
      lot:      filtered.filter((g: any) => !g.isWin && g.isOT).length,
      avgGF:    avg(gfs),
      avgGA:    avg(gas),
      avgDiff:  avg(filtered.map((g: any) => g.gf - g.ga)),
      avgTotal: avg(totals),
      maxGF:    Math.max(...gfs),
      minGF:    Math.min(...gfs),
      maxTotal: Math.max(...totals),
      minTotal: Math.min(...totals),
    };
  }, [filtered]);

  const hasPeriodData = allGames.some((g: any) => g.p1Result !== null);
  const recentGames   = [...filtered].reverse().slice(0, 6);

  function Btn({
    active, onClick, children,
  }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
      <button
        onClick={onClick}
        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
          active
            ? 'bg-accent text-white'
            : 'border border-border text-muted hover:border-accent hover:text-white'
        }`}
      >
        {children}
      </button>
    );
  }

  function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-16 shrink-0 text-[11px] text-muted">{label}</span>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Image src={logo} alt={abbrev} width={40} height={40} unoptimized />
        <div>
          <p className="font-bold text-white">{name}</p>
          <p className="text-xs text-muted">{abbrev}</p>
        </div>
        {stats && (
          <span className="ml-auto text-xs text-muted">
            {stats.gp}/{allGames.length} games
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2.5">

        <FilterRow label="Season">
          {SEASONS.map((s) => (
            <Btn key={s.value} active={season === s.value} onClick={() => setSeason(s.value)}>
              {s.label}
            </Btn>
          ))}
        </FilterRow>

        <FilterRow label="Venue">
          {(['all', 'home', 'away'] as Venue[]).map((v) => (
            <Btn key={v} active={venue === v} onClick={() => setVenue(v)}>
              {v === 'all' ? 'All' : v === 'home' ? 'Home' : 'Away'}
            </Btn>
          ))}
        </FilterRow>

        <FilterRow label="vs TOP">
          {[5, 10, 15, 20].map((n) => (
            <Btn key={n} active={topN === n} onClick={() => setTopN(topN === n ? 0 : n)}>
              {n}
            </Btn>
          ))}
          <Btn active={topN === 0} onClick={() => setTopN(0)}>All</Btn>
        </FilterRow>

        <FilterRow label="Last">
          {[5, 10, 15, 20].map((n) => (
            <Btn key={n} active={lastN === n} onClick={() => setLastN(lastN === n ? 0 : n)}>
              {n}
            </Btn>
          ))}
          <Btn active={lastN === 0} onClick={() => setLastN(0)}>All</Btn>
        </FilterRow>

        <FilterRow label="After P1">
          {([
            ['all',  'All'],
            ['win',  'Leading'],
            ['loss', 'Trailing'],
            ['tie',  'Tied'],
          ] as [P1Filter, string][]).map(([v, lbl]) => (
            <Btn key={v} active={p1Filter === v} onClick={() => setP1Filter(v)}>{lbl}</Btn>
          ))}
          {!hasPeriodData && p1Filter !== 'all' && (
            <span className="text-[10px] text-yellow-500">no period data</span>
          )}
        </FilterRow>

        <FilterRow label="Type">
          {([['all', 'All'], ['reg', 'Regulation'], ['ot', 'OT / SO']] as [GameType, string][]).map(
            ([v, lbl]) => (
              <Btn key={v} active={gameType === v} onClick={() => setGameType(v)}>{lbl}</Btn>
            )
          )}
        </FilterRow>

      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-border border-t-accent" />
        </div>
      ) : !stats ? (
        <p className="py-4 text-center text-sm text-muted">No games match the selected filters.</p>
      ) : (
        <>
          {/* Record row */}
          <div className="grid grid-cols-5 gap-1.5">
            {([
              ['GP',   stats.gp,   'text-white'],
              ['W',    stats.w,    'text-green-400 font-bold'],
              ['W/OT', stats.wot,  'text-green-400/70'],
              ['L',    stats.l,    'text-red-400 font-bold'],
              ['L/OT', stats.lot,  'text-red-400/70'],
            ] as [string, number, string][]).map(([lbl, val, cls]) => (
              <div key={lbl} className="flex flex-col items-center rounded-lg border border-border bg-base py-2">
                <span className="text-[9px] uppercase tracking-widest text-muted">{lbl}</span>
                <span className={`text-xl font-bold ${cls}`}>{val}</span>
              </div>
            ))}
          </div>

          {/* Goals row */}
          <div className="grid grid-cols-4 gap-1.5">
            {([
              ['GF avg',   stats.avgGF.toFixed(2),   'text-accent font-bold'],
              ['GA avg',   stats.avgGA.toFixed(2),   'text-muted'],
              ['Diff',
                `${stats.avgDiff >= 0 ? '+' : ''}${stats.avgDiff.toFixed(2)}`,
                stats.avgDiff >= 0 ? 'text-green-400' : 'text-red-400',
              ],
              ['Total avg', stats.avgTotal.toFixed(2), 'text-white'],
            ] as [string, string, string][]).map(([lbl, val, cls]) => (
              <div key={lbl} className="flex flex-col items-center rounded-lg border border-border bg-base py-2">
                <span className="text-[9px] uppercase tracking-widest text-muted">{lbl}</span>
                <span className={`text-lg font-bold ${cls}`}>{val}</span>
              </div>
            ))}
          </div>

          {/* Extremes row */}
          <div className="grid grid-cols-4 gap-1.5">
            {([
              ['Max GF',    stats.maxGF],
              ['Min GF',    stats.minGF],
              ['Max Total', stats.maxTotal],
              ['Min Total', stats.minTotal],
            ] as [string, number][]).map(([lbl, val]) => (
              <div key={lbl} className="flex flex-col items-center rounded-lg border border-border bg-base py-2">
                <span className="text-[9px] uppercase tracking-widest text-muted">{lbl}</span>
                <span className="text-lg font-bold text-white">{val}</span>
              </div>
            ))}
          </div>

          {/* Recent filtered games */}
          {recentGames.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <p className="bg-base px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                Recent results
              </p>
              <div className="divide-y divide-border">
                {recentGames.map((g: any) => {
                  const isW = g.isWin;
                  const resultLabel = isW
                    ? g.isOT ? 'W/OT' : 'W'
                    : g.isOT ? 'L/OT' : 'L';
                  const resultCls = isW ? 'text-green-400' : 'text-red-400';
                  return (
                    <div key={g.gameId} className="flex items-center gap-3 px-3 py-1.5 hover:bg-hover">
                      <span className="w-20 shrink-0 text-xs text-muted">{g.gameDate}</span>
                      <span className="text-xs text-muted">{g.homeOrAway === 'H' ? 'vs' : '@'}</span>
                      <Image src={g.oppLogo} alt={g.oppAbbrev} width={18} height={18} unoptimized className="shrink-0" />
                      <span className="flex-1 text-xs text-white">{g.oppAbbrev}</span>
                      <span className="text-xs text-white tabular-nums">{g.gf}–{g.ga}</span>
                      <span className={`w-10 text-right text-xs font-bold ${resultCls}`}>{resultLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
