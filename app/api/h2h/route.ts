import { NextRequest, NextResponse } from 'next/server';

const NHL_BASE = 'https://api-web.nhle.com/v1';

async function fetchSeasonGames(abbrev: string, season: string): Promise<any[]> {
  try {
    const res = await fetch(`${NHL_BASE}/club-schedule-season/${abbrev}/${season}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.games ?? [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const team1  = searchParams.get('team1')?.toUpperCase();
  const team2  = searchParams.get('team2')?.toUpperCase();
  const season = searchParams.get('season') ?? '20242025';

  if (!team1 || !team2) {
    return NextResponse.json({ error: 'team1 and team2 required' }, { status: 400 });
  }

  const yearStart  = parseInt(season.slice(0, 4), 10);
  const prevSeason = `${yearStart - 1}${yearStart}`;

  const [currGames, prevGames] = await Promise.all([
    fetchSeasonGames(team1, season),
    fetchSeasonGames(team1, prevSeason),
  ]);

  // Tag each game with which season it belongs to
  const tagged = [
    ...currGames.map((g: any) => ({ ...g, _season: season })),
    ...prevGames.map((g: any) => ({ ...g, _season: prevSeason })),
  ];

  const h2h = tagged.filter((g: any) => {
    const finished = g.gameState === 'OFF' || g.gameState === 'FINAL';
    if (!finished) return false;
    if (g.gameType !== 2) return false; // regular season only
    const homeAbbrev = g.homeTeam?.abbrev;
    const awayAbbrev = g.awayTeam?.abbrev;
    return (
      (homeAbbrev === team1 && awayAbbrev === team2) ||
      (homeAbbrev === team2 && awayAbbrev === team1)
    );
  });

  // Newest first
  h2h.sort((a: any, b: any) => b.gameDate.localeCompare(a.gameDate));

  const games = h2h.slice(0, 10).map((g: any) => {
    const homeAbbrev = g.homeTeam.abbrev as string;
    const awayAbbrev = g.awayTeam.abbrev as string;
    const homeScore  = g.homeTeam.score ?? 0;
    const awayScore  = g.awayTeam.score ?? 0;
    const total      = homeScore + awayScore;
    const lastPeriod = g.gameOutcome?.lastPeriodType ?? 'REG';
    const winner     = homeScore > awayScore ? homeAbbrev : awayAbbrev;

    return {
      gameId:         g.id,
      gameDate:       g.gameDate,
      homeAbbrev,
      awayAbbrev,
      homeScore,
      awayScore,
      total,
      lastPeriodType: lastPeriod,
      winner,
      season:         g._season,
    };
  });

  return NextResponse.json({ games });
}
