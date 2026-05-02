import { NextRequest, NextResponse } from 'next/server';

interface NHLLeaderPlayer {
  id: number;
  firstName: { default: string };
  lastName: { default: string };
  headshot: string;
  teamAbbrev: string;
  teamName: { default: string };
  teamLogo: string;
  position: string;
  value: number;
}

const NHL_BASE = 'https://api-web.nhle.com/v1';

// Fetch a single category — the NHL API rejects comma-separated categories (400)
// and returns only { id, firstName, lastName, headshot, teamAbbrev, teamName,
// teamLogo, position, value } per player — no cross-stat fields.
async function fetchCategory(
  season: string,
  gameType: string,
  category: string,
  limit: number
): Promise<NHLLeaderPlayer[]> {
  const res = await fetch(
    `${NHL_BASE}/skater-stats-leaders/${season}/${gameType}?categories=${category}&limit=${limit}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data[category] ?? []) as NHLLeaderPlayer[];
}

function toMap(arr: NHLLeaderPlayer[]): Map<number, number> {
  return new Map(arr.map((p) => [p.id, p.value]));
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const season   = searchParams.get('season')   ?? '20242025';
  const gameType = searchParams.get('gameType') ?? '2';

  // Parallel fetches — limit 200 for secondary stats so every top-100 points
  // scorer is covered even if they're not in the top 100 for that other stat.
  const [ptsArr, gArr, aArr, pmArr, toiArr, pimArr] = await Promise.all([
    fetchCategory(season, gameType, 'points',      100),
    fetchCategory(season, gameType, 'goals',       200),
    fetchCategory(season, gameType, 'assists',     200),
    fetchCategory(season, gameType, 'plusMinus',   200),
    fetchCategory(season, gameType, 'toi',         200),
    fetchCategory(season, gameType, 'penaltyMins', 200),
  ]);

  const gMap   = toMap(gArr);
  const aMap   = toMap(aArr);
  const pmMap  = toMap(pmArr);
  const toiMap = toMap(toiArr);
  const pimMap = toMap(pimArr);

  const skaters = ptsArr.map((p) => ({
    id:         p.id,
    firstName:  p.firstName,
    lastName:   p.lastName,
    headshot:   p.headshot,
    teamAbbrev: p.teamAbbrev,
    teamName:   p.teamName,
    teamLogo:   p.teamLogo,
    position:   p.position,
    pts:        p.value           ?? 0,
    g:          gMap.get(p.id)   ?? 0,
    a:          aMap.get(p.id)   ?? 0,
    plusMinus:  pmMap.get(p.id)  ?? 0,
    pim:        pimMap.get(p.id) ?? 0,
    toiSeconds: toiMap.get(p.id) ?? 0,
  }));

  return NextResponse.json({ skaters });
}
