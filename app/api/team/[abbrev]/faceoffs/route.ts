import { NextRequest, NextResponse } from 'next/server';

const NHL_BASE   = 'https://api-web.nhle.com/v1';
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

  // Step 2: paginated summary + faceoff percentages in parallel
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

  // Build faceoff map
  const foMap = new Map<number, any>();
  for (const p of foRows) {
    foMap.set(p.playerId, p);
  }

  // Keep only players on this team's roster with GP≥5
  const players = summaryRows
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
