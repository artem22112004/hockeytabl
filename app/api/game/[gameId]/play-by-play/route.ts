import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const res = await fetch(
    `https://api-web.nhle.com/v1/gamecenter/${params.gameId}/play-by-play`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) return NextResponse.json({ goals: [], penalties: [], error: 'not found' });
  const d = await res.json();

  // Build playerId → name map from rosterSpots
  const playerMap: Record<number, { name: string; teamAbbrev: string }> = {};
  for (const p of d.rosterSpots ?? []) {
    const first = p.firstName?.default ?? '';
    const last  = p.lastName?.default  ?? '';
    playerMap[p.playerId] = {
      name:       `${first} ${last}`.trim(),
      teamAbbrev: p.teamAbbrev ?? '',
    };
  }

  const homeAbbrev = d.homeTeam?.abbrev ?? '';
  const awayAbbrev = d.awayTeam?.abbrev ?? '';

  const goals: any[]     = [];
  const penalties: any[] = [];

  for (const play of d.plays ?? []) {
    const period     = play.periodDescriptor?.number ?? 0;
    const periodType = play.periodDescriptor?.periodType ?? 'REG';
    const time       = play.timeInPeriod ?? '';
    const det        = play.details ?? {};

    if (play.typeDescKey === 'goal') {
      const scorer  = det.scoringPlayerId ? (playerMap[det.scoringPlayerId]?.name ?? 'Unknown') : 'Unknown';
      const a1      = det.assist1PlayerId ? (playerMap[det.assist1PlayerId]?.name ?? null) : null;
      const a2      = det.assist2PlayerId ? (playerMap[det.assist2PlayerId]?.name ?? null) : null;
      // Determine which team scored by looking at who the scorer belongs to
      const scorerTeam = det.scoringPlayerId
        ? (playerMap[det.scoringPlayerId]?.teamAbbrev ?? '')
        : '';

      goals.push({
        period,
        periodType,
        time,
        scorerName:  scorer,
        scorerTeam:  scorerTeam || (det.teamAbbrev ?? ''),
        assist1Name: a1,
        assist2Name: a2,
        awayScore:   det.awayScore ?? null,
        homeScore:   det.homeScore ?? null,
        goalType:    det.goalType  ?? '',
        isEmptyNet:  det.goalType === 'EN',
      });
    }

    if (play.typeDescKey === 'penalty') {
      const player = det.committedByPlayerId
        ? (playerMap[det.committedByPlayerId]?.name ?? 'Unknown')
        : (det.servedByPlayerId ? (playerMap[det.servedByPlayerId]?.name ?? 'Team Penalty') : 'Team Penalty');
      const teamAbbrev = det.teamAbbrev ?? '';

      penalties.push({
        period,
        periodType,
        time,
        playerName:   player,
        teamAbbrev,
        penaltyType:  det.descKey ?? '',
        duration:     typeof det.duration === 'number' ? det.duration : 2,
      });
    }
  }

  return NextResponse.json({
    gameId:      d.id,
    gameState:   d.gameState,
    homeAbbrev,
    awayAbbrev,
    homeName:    d.homeTeam?.commonName?.default ?? homeAbbrev,
    awayName:    d.awayTeam?.commonName?.default ?? awayAbbrev,
    homeLogo:    d.homeTeam?.logo ?? `https://assets.nhle.com/logos/nhl/svg/${homeAbbrev}_dark.svg`,
    awayLogo:    d.awayTeam?.logo ?? `https://assets.nhle.com/logos/nhl/svg/${awayAbbrev}_dark.svg`,
    homeScore:   d.homeTeam?.score ?? null,
    awayScore:   d.awayTeam?.score ?? null,
    goals,
    penalties,
  });
}
