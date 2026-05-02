import { NextRequest, NextResponse } from 'next/server';

const NHL_BASE = 'https://api-web.nhle.com/v1';

interface RawGame {
  id: number;
  gameDate: string;
  gameType: number;
  gameState: string;
  homeTeam: { abbrev: string; score?: number; darkLogo: string };
  awayTeam: { abbrev: string; score?: number; darkLogo: string };
  gameOutcome?: { lastPeriodType: string };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { abbrev: string } }
) {
  const { searchParams } = req.nextUrl;
  const season = searchParams.get('season') ?? '20242025';
  const abbrev = params.abbrev.toUpperCase();

  const res = await fetch(
    `${NHL_BASE}/club-schedule-season/${abbrev}/${season}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) {
    return NextResponse.json({ error: `NHL API error ${res.status}` }, { status: res.status });
  }

  const data = await res.json();
  const allGames: RawGame[] = data.games ?? [];

  // Keep only finished games and take the last 10 (chronological, so slice from end)
  const finished = allGames.filter(
    (g) => g.gameState === 'OFF' && g.homeTeam.score != null && g.awayTeam.score != null
  );

  const last10 = finished.slice(-10).reverse(); // newest first

  const games = last10.map((g) => {
    const isHome = g.homeTeam.abbrev === abbrev;
    const gf = isHome ? (g.homeTeam.score ?? 0) : (g.awayTeam.score ?? 0);
    const ga = isHome ? (g.awayTeam.score ?? 0) : (g.homeTeam.score ?? 0);
    const oppAbbrev = isHome ? g.awayTeam.abbrev : g.homeTeam.abbrev;
    const oppLogo   = isHome ? g.awayTeam.darkLogo : g.homeTeam.darkLogo;
    const period    = g.gameOutcome?.lastPeriodType ?? 'REG';

    let result: string;
    if (gf > ga) {
      result = period !== 'REG' ? `W/${period}` : 'W';
    } else if (period === 'SO') {
      result = 'SO';
    } else if (period === 'OT') {
      result = 'OT';
    } else {
      result = 'L';
    }

    return {
      gameId:      g.id,
      gameDate:    g.gameDate,
      homeOrAway:  isHome ? 'H' : 'A',
      oppAbbrev,
      oppLogo,
      gf,
      ga,
      result,
    };
  });

  return NextResponse.json({ games });
}
