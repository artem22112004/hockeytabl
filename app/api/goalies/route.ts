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

async function fetchCategory(
  season: string,
  gameType: string,
  category: string,
  limit: number
): Promise<NHLLeaderPlayer[]> {
  const res = await fetch(
    `${NHL_BASE}/goalie-stats-leaders/${season}/${gameType}?categories=${category}&limit=${limit}`,
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

  const [winsArr, svArr, gaaArr, soArr] = await Promise.all([
    fetchCategory(season, gameType, 'wins',                50),
    fetchCategory(season, gameType, 'savePctg',           100),
    fetchCategory(season, gameType, 'goalsAgainstAverage', 100),
    fetchCategory(season, gameType, 'shutouts',           100),
  ]);

  const svMap  = toMap(svArr);
  const gaaMap = toMap(gaaArr);
  const soMap  = toMap(soArr);

  const goalies = winsArr.map((g) => ({
    id:         g.id,
    firstName:  g.firstName,
    lastName:   g.lastName,
    headshot:   g.headshot,
    teamAbbrev: g.teamAbbrev,
    teamName:   g.teamName,
    teamLogo:   g.teamLogo,
    w:          g.value            ?? 0,
    savePctg:   svMap.get(g.id)   ?? 0,
    gaa:        gaaMap.get(g.id)  ?? 0,
    shutouts:   soMap.get(g.id)   ?? 0,
  }));

  return NextResponse.json({ goalies });
}
