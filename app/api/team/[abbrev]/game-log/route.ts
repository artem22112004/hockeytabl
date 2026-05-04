import { NextRequest, NextResponse } from 'next/server';

const NHL_BASE = 'https://api-web.nhle.com/v1';

/** Read a numeric stat from right-rail teamGameStats array */
function numStat(tgs: any[], category: string, isHome: boolean): number | null {
  const e = tgs?.find((s: any) => s.category === category);
  if (!e) return null;
  const v = isHome ? e.homeValue : e.awayValue;
  if (typeof v === 'number' && !isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (!isNaN(n)) return n;
  }
  return null;
}

/** Parse "goals/opps" from the right-rail "powerPlay" category, e.g. "1/3" */
function parsePP(tgs: any[], isHome: boolean): { g: number; a: number } | null {
  const e = tgs?.find((s: any) => s.category === 'powerPlay');
  if (!e) return null;
  const raw = isHome ? e.homeValue : e.awayValue;
  const str = typeof raw === 'string' ? raw : null;
  if (!str) return null;
  const [g, a] = str.split('/').map(Number);
  if (Number.isFinite(g) && Number.isFinite(a)) return { g, a };
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

  // right-rail has teamGameStats with sog, hits, pim, faceoffWinningPctg, powerPlay, powerPlayPctg
  const railData = await Promise.all(
    finished.map((g: any) =>
      fetch(`${NHL_BASE}/gamecenter/${g.id}/right-rail`, { next: { revalidate: 3600 } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  const games = finished.map((g: any, i: number) => {
    const isHome     = g.homeTeam.abbrev === abbrev;
    const gf         = isHome ? (g.homeTeam.score ?? 0) : (g.awayTeam.score ?? 0);
    const ga         = isHome ? (g.awayTeam.score ?? 0) : (g.homeTeam.score ?? 0);
    const lastPeriod = g.gameOutcome?.lastPeriodType ?? 'REG';
    const isOT       = lastPeriod === 'OT' || lastPeriod === 'SO';
    const isWin      = gf > ga;
    const oppAbbrev  = isHome ? g.awayTeam.abbrev : g.homeTeam.abbrev;
    const oppLogo    = isHome
      ? (g.awayTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${g.awayTeam.abbrev}_dark.svg`)
      : (g.homeTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${g.homeTeam.abbrev}_dark.svg`);

    const tgs  = railData[i]?.teamGameStats ?? [];
    const myPP = parsePP(tgs, isHome);
    const opPP = parsePP(tgs, !isHome);

    const ppPctg = myPP && myPP.a > 0 ? +((myPP.g / myPP.a) * 100).toFixed(1) : myPP?.a === 0 ? 0 : null;
    const pkPctg = opPP && opPP.a > 0 ? +(((opPP.a - opPP.g) / opPP.a) * 100).toFixed(1) : opPP?.a === 0 ? 100 : null;

    // faceoffWinningPctg in right-rail is a 0–1 decimal; convert to 0–100 for display
    const foRaw      = numStat(tgs, 'faceoffWinningPctg', isHome);
    const faceoffPctg = foRaw != null ? +(foRaw * 100).toFixed(1) : null;

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
      shots:          numStat(tgs, 'sog',  isHome),
      shotsAgainst:   numStat(tgs, 'sog',  !isHome),
      hits:           numStat(tgs, 'hits', isHome),
      hitsAgainst:    numStat(tgs, 'hits', !isHome),
      pim:            numStat(tgs, 'pim',  isHome),
      pimAgainst:     numStat(tgs, 'pim',  !isHome),
      faceoffPctg,
      ppGoals:        myPP?.g ?? null,
      ppOpps:         myPP?.a ?? null,
      ppPctg,
      pkPctg,
    };
  });

  return NextResponse.json({ games });
}
