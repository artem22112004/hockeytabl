import { NextRequest, NextResponse } from 'next/server';

const STATS_BASE = 'https://api.nhle.com/stats/rest/en';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const season   = searchParams.get('season')   ?? '20252026';
  const gameType = searchParams.get('gameType') ?? '2';
  const minFO    = parseInt(searchParams.get('minFO') ?? '100', 10);

  const sort    = encodeURIComponent(JSON.stringify([{ property: 'totalFaceoffs', direction: 'DESC' }]));
  const cayenne = encodeURIComponent(`seasonId=${season} and gameTypeId=${gameType}`);
  const url = `${STATS_BASE}/skater/faceoffpercentages?isAggregate=false&isGame=false&sort=${sort}&start=0&limit=600&cayenneExp=${cayenne}`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return NextResponse.json({ players: [] });
  const data = await res.json();

  const players = ((data.data ?? []) as any[])
    .filter((p) => (p.totalFaceoffs ?? 0) >= minFO)
    .map((p) => {
      const foWins   = Math.round((p.totalFaceoffs ?? 0) * (p.faceoffWinPct ?? 0));
      const foLosses = (p.totalFaceoffs ?? 0) - foWins;
      const teamAbbrev = ((p.teamAbbrevs ?? '') as string).split(',')[0].trim();
      return {
        id:            p.playerId,
        fullName:      p.skaterFullName,
        position:      p.positionCode,
        teamAbbrev,
        gamesPlayed:   p.gamesPlayed   ?? 0,
        totalFaceoffs: p.totalFaceoffs ?? 0,
        foWins,
        foLosses,
        foPct: p.faceoffWinPct != null ? +(p.faceoffWinPct * 100).toFixed(2) : null,
        headshot: `https://assets.nhle.com/mugs/nhl/60x60/${p.playerId}.png`,
        teamLogo: teamAbbrev ? `https://assets.nhle.com/logos/nhl/svg/${teamAbbrev}_dark.svg` : '',
      };
    });

  return NextResponse.json({ players });
}
