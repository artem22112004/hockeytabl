'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { useSeason } from './SeasonContext';
import PlayerModal from './PlayerModal';
import TeamModal from './TeamModal';
import Portal from './Portal';

interface Props {
  variant?: 'navbar' | 'hero';
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function GlobalSearch({ variant = 'navbar' }: Props) {
  const { season } = useSeason();
  const [query,       setQuery]       = useState('');
  const [open,        setOpen]        = useState(false);
  const [playerModal, setPlayerModal] = useState<any>(null);
  const [teamModal,   setTeamModal]   = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const { data: skatersData } = useSWR<any>(
    query.length > 0 ? `/api/skaters?season=${season}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  const { data: teamsData } = useSWR<any>(
    query.length > 0 ? '/api/teams' : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const playerResults = useMemo<any[]>(() => {
    if (!query || !skatersData?.skaters) return [];
    const q = query.toLowerCase();
    return skatersData.skaters
      .filter((p: any) => {
        const name = `${p.firstName.default} ${p.lastName.default}`.toLowerCase();
        return name.includes(q) || p.teamAbbrev.toLowerCase().includes(q);
      })
      .slice(0, 5)
      .map((p: any) => ({
        type:       'player',
        id:         p.id,
        name:       `${p.firstName.default} ${p.lastName.default}`,
        teamAbbrev: p.teamAbbrev,
        headshot:   p.headshot,
        pts:        p.pts,
      }));
  }, [query, skatersData]);

  const teamResults = useMemo<any[]>(() => {
    if (!query || !teamsData?.standings) return [];
    const q = query.toLowerCase();
    return teamsData.standings
      .filter((t: any) => {
        const name   = t.teamName.default.toLowerCase();
        const abbrev = t.teamAbbrev.default.toLowerCase();
        const city   = t.placeName?.default?.toLowerCase() ?? '';
        return name.includes(q) || abbrev.includes(q) || city.includes(q);
      })
      .slice(0, 5)
      .map((t: any) => ({
        type:   'team',
        abbrev: t.teamAbbrev.default,
        name:   t.teamName.default,
        logo:   t.teamLogo,
        pts:    t.points,
      }));
  }, [query, teamsData]);

  const hasResults = playerResults.length > 0 || teamResults.length > 0;

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const isHero = variant === 'hero';

  function selectPlayer(p: any) {
    setPlayerModal(p);
    setOpen(false);
    setQuery('');
  }

  function selectTeam(t: any) {
    setTeamModal(t);
    setOpen(false);
    setQuery('');
  }

  return (
    <>
      <div ref={containerRef} className={`relative ${isHero ? 'w-full max-w-lg' : 'flex-1 max-w-xs'}`}>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            width="14" height="14" viewBox="0 0 16 16" fill="none"
          >
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>

          <input
            type="search"
            value={query}
            placeholder="Search player or team…"
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { if (query) setOpen(true); }}
            className={`w-full rounded-lg border border-border bg-base pl-9 pr-3 text-white placeholder:text-muted transition-colors focus:border-[#3b82f6]/50 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]/40 ${
              isHero ? 'py-3 text-base' : 'py-1.5 text-sm'
            }`}
          />
        </div>

        {open && query && hasResults && (
          <div className="absolute left-0 right-0 top-full mt-1.5 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/40"
               style={{ zIndex: 9999 }}>

            {playerResults.length > 0 && (
              <section>
                <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Players
                </p>
                {playerResults.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => selectPlayer(p)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-hover"
                  >
                    <Image src={p.headshot} alt={p.name} width={28} height={28}
                      className="rounded-full object-cover flex-shrink-0" unoptimized />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-muted">{p.teamAbbrev}</p>
                    </div>
                    <span className="text-xs font-bold text-[#3b82f6]">{p.pts} PTS</span>
                  </button>
                ))}
              </section>
            )}

            {teamResults.length > 0 && (
              <section className={playerResults.length > 0 ? 'border-t border-border' : ''}>
                <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Teams
                </p>
                {teamResults.map((t: any) => (
                  <button
                    key={t.abbrev}
                    onClick={() => selectTeam(t)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-hover"
                  >
                    <Image src={t.logo} alt={t.abbrev} width={28} height={28}
                      className="object-contain flex-shrink-0" unoptimized />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white">{t.name}</p>
                      <p className="text-xs text-muted">{t.abbrev}</p>
                    </div>
                    <span className="text-xs font-bold text-[#3b82f6]">{t.pts} PTS</span>
                  </button>
                ))}
              </section>
            )}

            <div className="border-t border-border px-3 py-2">
              <p className="text-[10px] text-muted">
                {playerResults.length + teamResults.length} result{playerResults.length + teamResults.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {open && query.length > 1 && !hasResults && (
          <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted shadow-2xl"
               style={{ zIndex: 9999 }}>
            No players or teams found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>

      {playerModal && (
        <Portal>
          <PlayerModal
            playerId={playerModal.id}
            playerName={playerModal.name}
            headshot={playerModal.headshot}
            teamAbbrev={playerModal.teamAbbrev}
            season={season}
            onClose={() => setPlayerModal(null)}
          />
        </Portal>
      )}

      {teamModal && (
        <Portal>
          <TeamModal
            abbrev={teamModal.abbrev}
            teamName={teamModal.name}
            teamLogo={teamModal.logo}
            season={season}
            onClose={() => setTeamModal(null)}
          />
        </Portal>
      )}
    </>
  );
}
