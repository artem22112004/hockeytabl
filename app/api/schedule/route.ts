import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch('https://api-web.nhle.com/v1/schedule/now', {
    next: { revalidate: 60 },
  });
  if (!res.ok) return NextResponse.json({ games: [] });
  const data = await res.json();

  const games: any[] = [];
  for (const day of data.gameWeek ?? []) {
    for (const g of day.games ?? []) {
      if (g.gameType !== 2 && g.gameType !== 3) continue;
      games.push({
        gameId:       g.id,
        gameDate:     day.date,
        startTimeUTC: g.startTimeUTC,
        gameState:    g.gameState,
        homeTeam: {
          abbrev: g.homeTeam.abbrev,
          name:   g.homeTeam.commonName?.default ?? g.homeTeam.abbrev,
          logo:   g.homeTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${g.homeTeam.abbrev}_dark.svg`,
          score:  g.homeTeam.score ?? null,
        },
        awayTeam: {
          abbrev: g.awayTeam.abbrev,
          name:   g.awayTeam.commonName?.default ?? g.awayTeam.abbrev,
          logo:   g.awayTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${g.awayTeam.abbrev}_dark.svg`,
          score:  g.awayTeam.score ?? null,
        },
        lastPeriodType: g.gameOutcome?.lastPeriodType ?? null,
        period:         g.periodDescriptor?.number ?? null,
      });
    }
  }

  // live first, then future, then finished
  games.sort((a, b) => {
    const rank = (s: string) =>
      s === 'LIVE' || s === 'CRIT' ? 0 : s === 'FUT' || s === 'PRE' ? 1 : 2;
    return rank(a.gameState) - rank(b.gameState);
  });

  return NextResponse.json({ games });
}
