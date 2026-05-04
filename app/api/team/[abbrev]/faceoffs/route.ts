import { NextRequest, NextResponse } from 'next/server';

const NHL_BASE   = 'https://api-web.nhle.com/v1';
const STATS_BASE = 'https://api.nhle.com/stats/rest/en';

export async function GET(
  req: NextRequest,
  { params }: { params: { abbrev: string } }
) {
  const abbrev   = params.abbrev.toUpperCase();
  const season   = req.nextUrl.searchParams.get('season')   ?? '20252026';
  const gameType = req.nextUrl.searchParams.get('gameType') ?? '2';

  // Step 1: get roster to know which player IDs belong to this team
  const rosterRes = await fetch(
    `${NHL_BASE}/roster/${abbrev}/current`,
    { next: { revalidate: 3600 } }
  );
  if (!rosterRes.ok) return NextResponse.json({ players: [] });
  const rosterData = await rosterRes.json();

  const rosterIds = new Set<number>([
    ...(rosterData.forwards   ?? []).map((p: any) => p.id as number),
    ...(rosterData.defensemen ?? []).map((p: any) => p.id as number),
  ]);
  if (!rosterIds.size) return NextResponse.json({ players: [] });

  // Step 2: season summary (GP≥5, limit 1000) + faceoff percentages in parallel
  const summarySort    = encodeURIComponent(JSON.stringify([{ property: 'points', direction: 'DESC' }]));
  const summaryCayenne = encodeURIComponent(`seasonId=${season} and gameTypeId=${gameType} and gamesPlayed>=5`);
  const summaryUrl = `${STATS_BASE}/skater/summary?isAggregate=false&isGame=false&sort=${summarySort}&start=0&limit=1000&cayenneExp=${summaryCayenne}`;

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

  // Build faceoff map
  const foMap = new Map<number, any>();
  for (const p of (foData.data ?? []) as any[]) {
    foMap.set(p.playerId, p);
  }

  // Keep only players on this team's roster with GP≥5
  const players = ((summaryData.data ?? []) as any[])
    .filter((p) => rosterIds.has(p.playerId))
    .map((p) => {
      const fo            = foMap.get(p.playerId);
      const totalFaceoffs = fo?.totalFaceoffs ?? 0;
      const foWins        = fo != null ? Math.round(totalFaceoffs * (fo.faceoffWinPct ?? 0)) : 0;
      const foLosses      = totalFaceoffs - foWins;
      return {
        id:            p.playerId,
        fullName:      p.skaterFullName ?? '',
        position:      p.positionCode   ?? '',
        teamAbbrev:    abbrev,
        gamesPlayed:   p.gamesPlayed    ?? 0,
        totalFaceoffs,
        foWins,
        foLosses,
        foPct: fo?.faceoffWinPct != null && totalFaceoffs > 0
          ? +(fo.faceoffWinPct * 100).toFixed(2)
          : null,
        headshot: `https://assets.nhle.com/mugs/nhl/60x60/${p.playerId}.png`,
        teamLogo: `https://assets.nhle.com/logos/nhl/svg/${abbrev}_dark.svg`,
      };
    });

  return NextResponse.json({ players });
}
