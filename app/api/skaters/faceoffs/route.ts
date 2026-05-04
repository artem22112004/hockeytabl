import { NextRequest, NextResponse } from 'next/server';

const STATS_BASE = 'https://api.nhle.com/stats/rest/en';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const season   = searchParams.get('season')   ?? '20252026';
  const gameType = searchParams.get('gameType') ?? '2';

  // All qualifying skaters (GP ≥ 5) — basis for merging 0-faceoff players
  const summarySort    = encodeURIComponent(JSON.stringify([{ property: 'points', direction: 'DESC' }]));
  const summaryCayenne = encodeURIComponent(`seasonId=${season} and gameTypeId=${gameType} and gamesPlayed>=5`);
  const summaryUrl = `${STATS_BASE}/skater/summary?isAggregate=false&isGame=false&sort=${summarySort}&start=0&limit=1000&cayenneExp=${summaryCayenne}`;

  // All faceoff data — no minFO filter
  const foSort    = encodeURIComponent(JSON.stringify([{ property: 'totalFaceoffs', direction: 'DESC' }]));
  const foCayenne = encodeURIComponent(`seasonId=${season} and gameTypeId=${gameType}`);
  const foUrl = `${STATS_BASE}/skater/faceoffpercentages?isAggregate=false&isGame=false&sort=${foSort}&start=0&limit=1000&cayenneExp=${foCayenne}`;

  const [summaryRes, foRes] = await Promise.all([
    fetch(summaryUrl, { next: { revalidate: 300 } }),
    fetch(foUrl,      { next: { revalidate: 300 } }),
  ]);

  if (!summaryRes.ok) return NextResponse.json({ players: [] });

  const [summaryData, foData] = await Promise.all([
    summaryRes.json(),
    foRes.ok ? foRes.json() : Promise.resolve({ data: [] }),
  ]);

  // Map playerId → faceoff row
  const foMap = new Map<number, any>();
  for (const p of (foData.data ?? []) as any[]) {
    foMap.set(p.playerId, p);
  }

  const players = ((summaryData.data ?? []) as any[]).map((p) => {
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
