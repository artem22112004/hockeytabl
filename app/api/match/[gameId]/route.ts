import { NextRequest, NextResponse } from 'next/server';

async function getLastFive(abbrev: string, season: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api-web.nhle.com/v1/club-schedule-season/${abbrev}/${season}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const finished = (data.games ?? [])
      .filter((g: any) => g.gameState === 'OFF' || g.gameState === 'FINAL')
      .map((g: any) => {
        const isHome     = g.homeTeam.abbrev === abbrev;
        const gf         = isHome ? (g.homeTeam.score ?? 0) : (g.awayTeam.score ?? 0);
        const ga         = isHome ? (g.awayTeam.score ?? 0) : (g.homeTeam.score ?? 0);
        const lastPeriod = g.gameOutcome?.lastPeriodType ?? 'REG';
        const isOT       = lastPeriod === 'OT' || lastPeriod === 'SO';
        const isWin      = gf > ga;
        const oppAbbrev  = isHome ? g.awayTeam.abbrev : g.homeTeam.abbrev;
        return {
          gameId:     g.id,
          gameDate:   g.gameDate?.slice(0, 10) ?? '',
          homeOrAway: isHome ? 'H' : 'A',
          oppAbbrev,
          gf,
          ga,
          isWin,
          isOT,
          lastPeriodType: lastPeriod,
        };
      });

    return finished.slice(-5);
  } catch {
    return [];
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const { gameId } = params;

  const bsRes = await fetch(
    `https://api-web.nhle.com/v1/gamecenter/${gameId}/boxscore`,
    { next: { revalidate: 30 } }
  );
  if (!bsRes.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const d = await bsRes.json();

  const homeAbbrev = d.homeTeam.abbrev;
  const awayAbbrev = d.awayTeam.abbrev;
  const season     = String(d.season);

  const rawStats: { category: string; awayValue: string; homeValue: string }[] =
    d.teamGameStats ?? [];

  function statNum(cat: string, side: 'home' | 'away'): number | null {
    const found = rawStats.find((s) => s.category === cat);
    if (!found) return null;
    const n = parseFloat(side === 'home' ? found.homeValue : found.awayValue);
    return isNaN(n) ? null : n;
  }

  function statStr(cat: string, side: 'home' | 'away'): string | null {
    const found = rawStats.find((s) => s.category === cat);
    if (!found) return null;
    return side === 'home' ? found.homeValue : found.awayValue;
  }

  const teamStats = rawStats.length > 0 ? {
    home: {
      shots:       statNum('sog', 'home'),
      hits:        statNum('hits', 'home'),
      faceoffPctg: statNum('faceoffWinningPctg', 'home'),
      ppConv:      statStr('powerPlayConversion', 'home'),
      blocked:     statNum('blockedShots', 'home'),
      giveaways:   statNum('giveaways', 'home'),
      takeaways:   statNum('takeaways', 'home'),
      pim:         statNum('pim', 'home'),
    },
    away: {
      shots:       statNum('sog', 'away'),
      hits:        statNum('hits', 'away'),
      faceoffPctg: statNum('faceoffWinningPctg', 'away'),
      ppConv:      statStr('powerPlayConversion', 'away'),
      blocked:     statNum('blockedShots', 'away'),
      giveaways:   statNum('giveaways', 'away'),
      takeaways:   statNum('takeaways', 'away'),
      pim:         statNum('pim', 'away'),
    },
  } : null;

  const [homeLastFive, awayLastFive] = await Promise.all([
    getLastFive(homeAbbrev, season),
    getLastFive(awayAbbrev, season),
  ]);

  return NextResponse.json({
    gameId:    d.id,
    gameDate:  d.gameDate,
    gameState: d.gameState,
    season,
    period:         d.periodDescriptor?.number ?? null,
    periodType:     d.periodDescriptor?.periodType ?? null,
    lastPeriodType: d.gameOutcome?.lastPeriodType ?? null,
    clock: d.clock
      ? { timeRemaining: d.clock.timeRemaining, inIntermission: d.clock.inIntermission }
      : null,
    homeTeam: {
      abbrev: homeAbbrev,
      name:   d.homeTeam.commonName?.default ?? homeAbbrev,
      logo:   d.homeTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${homeAbbrev}_dark.svg`,
      score:  d.homeTeam.score ?? null,
    },
    awayTeam: {
      abbrev: awayAbbrev,
      name:   d.awayTeam.commonName?.default ?? awayAbbrev,
      logo:   d.awayTeam.logo ?? `https://assets.nhle.com/logos/nhl/svg/${awayAbbrev}_dark.svg`,
      score:  d.awayTeam.score ?? null,
    },
    teamStats,
    homeLastFive,
    awayLastFive,
  });
}
