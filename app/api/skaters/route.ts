import { NextRequest, NextResponse } from 'next/server';

const NHL_BASE   = 'https://api-web.nhle.com/v1';
const STATS_BASE = 'https://api.nhle.com/stats/rest/en';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const season   = searchParams.get('season')   ?? '20252026';
  const gameType = searchParams.get('gameType') ?? '2';

  const sort    = encodeURIComponent(JSON.stringify([{ property: 'points', direction: 'DESC' }]));
  const cayenne = encodeURIComponent(`seasonId=${season} and gameTypeId=${gameType} and gamesPlayed>=5`);
  const summaryUrl = `${STATS_BASE}/skater/summary?isAggregate=false&isGame=false&sort=${sort}&start=0&limit=1000&cayenneExp=${cayenne}`;

  // Parallel: legacy summary + v1 plusMinus category (covers players the legacy field may miss)
  const [summaryRes, pmRes] = await Promise.all([
    fetch(summaryUrl, { next: { revalidate: 300 } }),
    fetch(`${NHL_BASE}/skater-stats-leaders/${season}/${gameType}?categories=plusMinus&limit=1000`, { next: { revalidate: 300 } }),
  ]);

  if (!summaryRes.ok) return NextResponse.json({ skaters: [] });

  const [summaryData, pmData] = await Promise.all([
    summaryRes.json(),
    pmRes.ok ? pmRes.json() : Promise.resolve(null),
  ]);

  // Build plusMinus map from v1 leaders (id → value)
  const pmMap = new Map<number, number>();
  for (const p of ((pmData?.plusMinus ?? []) as any[])) {
    pmMap.set(p.id, p.value);
  }

  const skaters = ((summaryData.data ?? []) as any[]).map((p) => {
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
      // Prefer v1 plusMinus (covers full signed range); fall back to legacy summary field
      plusMinus:   pmMap.has(p.playerId) ? pmMap.get(p.playerId)! : (p.plusMinus ?? null),
      pim:         p.penaltyMinutes   ?? 0,
      toiSeconds:  p.timeOnIcePerGame != null ? Math.round(p.timeOnIcePerGame) : 0,
      gamesPlayed: p.gamesPlayed      ?? 0,
    };
  });

  return NextResponse.json({ skaters });
}
