import { NextRequest, NextResponse } from 'next/server';

const STATS_BASE = 'https://api.nhle.com/stats/rest/en';

async function fetchAllPages(baseUrl: string): Promise<any[]> {
  const all: any[] = [];
  let start = 0;
  const PAGE = 100;
  while (true) {
    const res = await fetch(`${baseUrl}&start=${start}&limit=${PAGE}`, { next: { revalidate: 300 } });
    if (!res.ok) break;
    const data = await res.json();
    const rows: any[] = data.data ?? [];
    all.push(...rows);
    if (rows.length < PAGE || all.length >= (data.total ?? 0)) break;
    start += PAGE;
  }
  return all;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const season   = searchParams.get('season')   ?? '20252026';
  const gameType = searchParams.get('gameType') ?? '2';

  const summarySort    = encodeURIComponent(JSON.stringify([{ property: 'points', direction: 'DESC' }]));
  const summaryCayenne = encodeURIComponent(`seasonId=${season} and gameTypeId=${gameType} and gamesPlayed>=5`);
  const summaryBaseUrl = `${STATS_BASE}/skater/summary?isAggregate=false&isGame=false&sort=${summarySort}&cayenneExp=${summaryCayenne}`;

  const foSort    = encodeURIComponent(JSON.stringify([{ property: 'totalFaceoffs', direction: 'DESC' }]));
  const foCayenne = encodeURIComponent(`seasonId=${season} and gameTypeId=${gameType}`);
  const foBaseUrl = `${STATS_BASE}/skater/faceoffpercentages?isAggregate=false&isGame=false&sort=${foSort}&cayenneExp=${foCayenne}`;

  const [summaryRows, foRows] = await Promise.all([
    fetchAllPages(summaryBaseUrl),
    fetchAllPages(foBaseUrl),
  ]);

  // Map playerId → faceoff row
  const foMap = new Map<number, any>();
  for (const p of foRows) {
    foMap.set(p.playerId, p);
  }

  const players = summaryRows.map((p) => {
    const teamAbbrev    = ((p.teamAbbrevs ?? '') as string).split(',')[0].trim();
    const fo            = foMap.get(p.playerId);
    const totalFaceoffs = fo?.totalFaceoffs ?? 0;
    const foWins        = fo != null ? Math.round(totalFaceoffs * (fo.faceoffWinPct ?? 0)) : 0;
    const foLosses      = totalFaceoffs - foWins;
    return {
      id:            p.playerId,
      fullName:      p.skaterFullName ?? '',
      position:      p.positionCode   ?? '',
      teamAbbrev,
      gamesPlayed:   p.gamesPlayed    ?? 0,
      totalFaceoffs,
      foWins,
      foLosses,
      foPct: fo?.faceoffWinPct != null && totalFaceoffs > 0
        ? +(fo.faceoffWinPct * 100).toFixed(2)
        : null,
      headshot: `https://assets.nhle.com/mugs/nhl/60x60/${p.playerId}.png`,
      teamLogo: teamAbbrev ? `https://assets.nhle.com/logos/nhl/svg/${teamAbbrev}_dark.svg` : '',
    };
  });

  return NextResponse.json({ players });
}
