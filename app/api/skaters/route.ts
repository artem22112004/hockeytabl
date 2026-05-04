import { NextRequest, NextResponse } from 'next/server';

const STATS_BASE = 'https://api.nhle.com/stats/rest/en';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const season   = searchParams.get('season')   ?? '20252026';
  const gameType = searchParams.get('gameType') ?? '2';

  const sort    = encodeURIComponent(JSON.stringify([{ property: 'points', direction: 'DESC' }]));
  const cayenne = encodeURIComponent(`seasonId=${season} and gameTypeId=${gameType} and gamesPlayed>=5`);
  const url = `${STATS_BASE}/skater/summary?isAggregate=false&isGame=false&sort=${sort}&start=0&limit=700&cayenneExp=${cayenne}`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return NextResponse.json({ skaters: [] });
  const data = await res.json();

  const skaters = ((data.data ?? []) as any[]).map((p) => {
    const teamAbbrev = ((p.teamAbbrevs ?? '') as string).split(',')[0].trim();
    return {
      id:          p.playerId,
      fullName:    p.skaterFullName ?? '',
      headshot:    `https://assets.nhle.com/mugs/nhl/60x60/${p.playerId}.png`,
      teamAbbrev,
      teamName:    '',
      teamLogo:    teamAbbrev ? `https://assets.nhle.com/logos/nhl/svg/${teamAbbrev}_dark.svg` : '',
      position:    p.positionCode     ?? '',
      pts:         p.points           ?? 0,
      g:           p.goals            ?? 0,
      a:           p.assists          ?? 0,
      plusMinus:   p.plusMinus        ?? null,
      pim:         p.penaltyMinutes   ?? 0,
      toiSeconds:  p.timeOnIcePerGame != null ? Math.round(p.timeOnIcePerGame) : 0,
      gamesPlayed: p.gamesPlayed      ?? 0,
    };
  });

  return NextResponse.json({ skaters });
}
