import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  const url = `https://api-web.nhle.com/v1/score/${date ?? 'now'}`;

  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) return NextResponse.json({ games: [], currentDate: date ?? '' });

  const data = await res.json();

  const games = (data.games ?? []).map((g: any) => ({
    gameId:       g.id,
    gameDate:     g.gameDate,
    startTimeUTC: g.startTimeUTC,
    gameState:    g.gameState,
    period:       g.periodDescriptor?.number ?? null,
    periodType:   g.periodDescriptor?.periodType ?? null,
    clock: g.clock
      ? { timeRemaining: g.clock.timeRemaining, inIntermission: g.clock.inIntermission }
      : null,
    awayTeam: {
      abbrev: g.awayTeam.abbrev,
      name:   g.awayTeam.commonName?.default ?? g.awayTeam.abbrev,
      logo:   g.awayTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${g.awayTeam.abbrev}_dark.svg`,
      score:  g.awayTeam.score ?? null,
      sog:    g.awayTeam.sog ?? null,
    },
    homeTeam: {
      abbrev: g.homeTeam.abbrev,
      name:   g.homeTeam.commonName?.default ?? g.homeTeam.abbrev,
      logo:   g.homeTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${g.homeTeam.abbrev}_dark.svg`,
      score:  g.homeTeam.score ?? null,
      sog:    g.homeTeam.sog ?? null,
    },
    lastPeriodType: g.gameOutcome?.lastPeriodType ?? null,
  }));

  return NextResponse.json({
    currentDate: data.currentDate,
    prevDate:    data.prevDate,
    nextDate:    data.nextDate,
    games,
  });
}
