import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { abbrev: string } }
) {
  const { abbrev } = params;
  const season = req.nextUrl.searchParams.get('season') ?? '20242025';

  const res = await fetch(
    `https://api-web.nhle.com/v1/club-schedule-season/${abbrev}/${season}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return NextResponse.json({ games: [] });
  const data = await res.json();

  const games = (data.games ?? [])
    .filter((g: any) => g.gameState === 'OFF' || g.gameState === 'FINAL')
    .map((g: any) => {
      const isHome      = g.homeTeam.abbrev === abbrev;
      const gf          = isHome ? (g.homeTeam.score ?? 0) : (g.awayTeam.score ?? 0);
      const ga          = isHome ? (g.awayTeam.score ?? 0) : (g.homeTeam.score ?? 0);
      const lastPeriod  = g.gameOutcome?.lastPeriodType ?? 'REG';
      const isOT        = lastPeriod === 'OT' || lastPeriod === 'SO';
      const isWin       = gf > ga;

      // Extract period-1 leader from goals array when available
      const goals: any[] = g.goals ?? [];
      let p1Result: 'W' | 'L' | 'T' | null = null;
      if (goals.length > 0) {
        const p1Gf = goals.filter((gl: any) => gl.period === 1 && gl.teamAbbrev === abbrev).length;
        const p1Ga = goals.filter((gl: any) => gl.period === 1 && gl.teamAbbrev !== abbrev).length;
        p1Result = p1Gf > p1Ga ? 'W' : p1Gf < p1Ga ? 'L' : 'T';
      }

      return {
        gameId:     g.id,
        gameDate:   g.gameDate,
        homeOrAway: isHome ? 'H' : 'A',
        oppAbbrev:  isHome ? g.awayTeam.abbrev : g.homeTeam.abbrev,
        oppLogo:    isHome
          ? (g.awayTeam.logo  ?? `https://assets.nhle.com/logos/nhl/svg/${g.awayTeam.abbrev}_dark.svg`)
          : (g.homeTeam.logo  ?? `https://assets.nhle.com/logos/nhl/svg/${g.homeTeam.abbrev}_dark.svg`),
        gf,
        ga,
        total:          gf + ga,
        lastPeriodType: lastPeriod,
        isWin,
        isOT,
        p1Result,
      };
    });

  return NextResponse.json({ games });
}
