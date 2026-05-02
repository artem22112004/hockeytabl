import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const res = await fetch(
    `https://api-web.nhle.com/v1/gamecenter/${params.gameId}/boxscore`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const d = await res.json();

  return NextResponse.json({
    gameId:   d.id,
    gameDate: d.gameDate,
    gameState: d.gameState,
    season:   String(d.season),
    homeTeam: {
      abbrev: d.homeTeam.abbrev,
      name:   d.homeTeam.commonName?.default ?? d.homeTeam.abbrev,
      logo:   d.homeTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${d.homeTeam.abbrev}_dark.svg`,
      score:  d.homeTeam.score ?? null,
    },
    awayTeam: {
      abbrev: d.awayTeam.abbrev,
      name:   d.awayTeam.commonName?.default ?? d.awayTeam.abbrev,
      logo:   d.awayTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${d.awayTeam.abbrev}_dark.svg`,
      score:  d.awayTeam.score ?? null,
    },
    lastPeriodType: d.gameOutcome?.lastPeriodType ?? null,
    period:         d.periodDescriptor?.number ?? null,
  });
}
