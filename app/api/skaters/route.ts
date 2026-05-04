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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const season   = searchParams.get('season')   ?? '20252026';
  const gameType = searchParams.get('gameType') ?? '2';

  const sort    = encodeURIComponent(JSON.stringify([{ property: 'points', direction: 'DESC' }]));
  const cayenne = encodeURIComponent(`seasonId=${season} and gameTypeId=${gameType} and gamesPlayed>=5`);
  const summaryBaseUrl = `${STATS_BASE}/skater/summary?isAggregate=false&isGame=false&sort=${sort}&cayenneExp=${cayenne}`;

  // Parallel: paginated legacy summary + v1 plusMinus category
  const [summaryRows, pmRes] = await Promise.all([
    fetchAllPages(summaryBaseUrl),
    fetch(`${NHL_BASE}/skater-stats-leaders/${season}/${gameType}?categories=plusMinus&limit=1000`, { next: { revalidate: 300 } }),
  ]);

  const pmData = pmRes.ok ? await pmRes.json() : null;

  // Build plusMinus map from v1 leaders (id → value)
  const pmMap = new Map<number, number>();
  for (const p of ((pmData?.plusMinus ?? []) as any[])) {
    pmMap.set(p.id, p.value);
  }

  const skaters = summaryRows.map((p) => {
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
      plusMinus:   pmMap.has(p.playerId) ? pmMap.get(p.playerId)! : (p.plusMinus ?? null),
      pim:         p.penaltyMinutes   ?? 0,
      toiSeconds:  p.timeOnIcePerGame != null ? Math.round(p.timeOnIcePerGame) : 0,
      gamesPlayed: p.gamesPlayed      ?? 0,
    };
  });

  return NextResponse.json({ skaters });
}
