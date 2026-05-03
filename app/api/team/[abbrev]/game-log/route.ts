import { NextRequest, NextResponse } from 'next/server';

const NHL_BASE = 'https://api-web.nhle.com/v1';

/** Accept both number and string values from the API */
function numStat(tgs: any[], cats: string | string[], isHome: boolean): number | null {
  const catList = Array.isArray(cats) ? cats : [cats];
  for (const cat of catList) {
    const e = tgs?.find((s: any) => s.category === cat);
    if (!e) continue;
    const v = isHome ? e.homeValue : e.awayValue;
    if (typeof v === 'number' && !isNaN(v)) return v;
    if (typeof v === 'string') {
      const n = parseFloat(v);
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

/** Parse "1/3" PP string — try both singular/plural category names */
function parsePP(tgs: any[], isHome: boolean): { g: number; a: number } | null {
  const cats = ['powerPlayConversions', 'powerPlayConversion'];
  for (const cat of cats) {
    const e = tgs?.find((s: any) => s.category === cat);
    if (!e) continue;
    const raw = isHome ? e.homeValue : e.awayValue;
    const str = typeof raw === 'string' ? raw : typeof raw === 'number' ? String(raw) : null;
    if (!str) continue;
    const [g, a] = str.split('/').map(Number);
    if (Number.isFinite(g) && Number.isFinite(a)) return { g, a };
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { abbrev: string } }
) {
  const abbrev = params.abbrev.toUpperCase();
  const season = req.nextUrl.searchParams.get('season') ?? '20252026';
  const limit  = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10), 30);

  const schedRes = await fetch(
    `${NHL_BASE}/club-schedule-season/${abbrev}/${season}`,
    { next: { revalidate: 300 } }
  );
  if (!schedRes.ok) return NextResponse.json({ games: [] });
  const schedData = await schedRes.json();

  const finished = ((schedData.games ?? []) as any[])
    .filter((g) =>
      (g.gameState === 'OFF' || g.gameState === 'FINAL') &&
      g.gameType === 2 &&
      g.homeTeam?.score != null
    )
    .slice(-limit);

  if (!finished.length) return NextResponse.json({ games: [] });

  // Fetch boxscores in parallel
  const boxscores = await Promise.all(
    finished.map((g: any) =>
      fetch(`${NHL_BASE}/gamecenter/${g.id}/boxscore`, { next: { revalidate: 3600 } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  // Log categories from first successful boxscore so field names are visible in server logs
  const firstBs = boxscores.find((b) => b?.teamGameStats?.length);
  if (firstBs) {
    console.log('[game-log] teamGameStats categories:', firstBs.teamGameStats.map((s: any) => s.category));
  }

  const games = finished.map((g: any, i: number) => {
    const isHome    = g.homeTeam.abbrev === abbrev;
    const gf        = isHome ? (g.homeTeam.score ?? 0) : (g.awayTeam.score ?? 0);
    const ga        = isHome ? (g.awayTeam.score ?? 0) : (g.homeTeam.score ?? 0);
    const lastPeriod = g.gameOutcome?.lastPeriodType ?? 'REG';
    const isOT      = lastPeriod === 'OT' || lastPeriod === 'SO';
    const isWin     = gf > ga;
    const oppAbbrev = isHome ? g.awayTeam.abbrev : g.homeTeam.abbrev;
    const oppLogo   = isHome
      ? (g.awayTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${g.awayTeam.abbrev}_dark.svg`)
      : (g.homeTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${g.homeTeam.abbrev}_dark.svg`);

    const tgs  = boxscores[i]?.teamGameStats ?? [];
    const myPP = parsePP(tgs, isHome);
    const opPP = parsePP(tgs, !isHome);

    // Shots: use sog directly from schedule if available, fall back to boxscore
    const schedShotsFor     = isHome ? (g.homeTeam.sog ?? null) : (g.awayTeam.sog ?? null);
    const schedShotsAgainst = isHome ? (g.awayTeam.sog ?? null) : (g.homeTeam.sog ?? null);

    const ppPctg = myPP && myPP.a > 0 ? +((myPP.g / myPP.a) * 100).toFixed(1) : myPP?.a === 0 ? 0 : null;
    const pkPctg = opPP && opPP.a > 0 ? +(((opPP.a - opPP.g) / opPP.a) * 100).toFixed(1) : opPP?.a === 0 ? 100 : null;

    return {
      gameId:         g.id,
      gameDate:       g.gameDate,
      homeOrAway:     isHome ? 'H' : 'A',
      oppAbbrev,
      oppLogo,
      gf,
      ga,
      total:          gf + ga,
      isWin,
      isOT,
      lastPeriodType: lastPeriod,
      // Shots: schedule sog is reliable; boxscore is fallback
      shots:          schedShotsFor     ?? numStat(tgs, 'sog', isHome),
      shotsAgainst:   schedShotsAgainst ?? numStat(tgs, 'sog', !isHome),
      // Hits, PIM, faceoffs from boxscore — try multiple known category name variants
      hits:           numStat(tgs, ['hits', 'hitsFor'],       isHome),
      hitsAgainst:    numStat(tgs, ['hits', 'hitsFor'],       !isHome),
      pim:            numStat(tgs, ['pim', 'pimFor'],         isHome),
      pimAgainst:     numStat(tgs, ['pim', 'pimFor'],         !isHome),
      faceoffPctg:    numStat(tgs, ['faceoffWinningPctg', 'faceoffWinPctg'], isHome),
      ppGoals:        myPP?.g   ?? null,
      ppOpps:         myPP?.a   ?? null,
      ppPctg,
      pkPctg,
    };
  });

  return NextResponse.json({ games });
}
