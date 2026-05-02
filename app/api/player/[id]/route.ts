import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const res = await fetch(
    `https://api-web.nhle.com/v1/player/${params.id}/landing`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const d = await res.json();

  // Regular-season totals only, newest first
  const seasonTotals: any[] = (d.seasonTotals ?? [])
    .filter((s: any) => s.gameTypeId === 2)
    .sort((a: any, b: any) => b.season - a.season);

  const currentSeason = seasonTotals[0] ?? null;
  const prevSeason    = seasonTotals[1] ?? null;

  const age = d.birthDate
    ? Math.floor((Date.now() - new Date(d.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const abbrev = d.currentTeamAbbrev ?? '';

  return NextResponse.json({
    id:             d.playerId,
    firstName:      d.firstName?.default  ?? '',
    lastName:       d.lastName?.default   ?? '',
    fullName:       `${d.firstName?.default ?? ''} ${d.lastName?.default ?? ''}`.trim(),
    headshot:       d.headshot   ?? '',
    heroImage:      d.heroImage  ?? null,
    teamAbbrev:     abbrev,
    teamName:       d.fullTeamName?.default ?? '',
    teamLogo:       d.teamLogo ?? `https://assets.nhle.com/logos/nhl/svg/${abbrev}_dark.svg`,
    position:       d.position ?? '',
    sweaterNumber:  d.sweaterNumber  ?? null,
    shootsCatches:  d.shootsCatches  ?? null,
    birthDate:      d.birthDate      ?? null,
    age,
    birthCity:      d.birthCity?.default ?? null,
    birthCountry:   d.birthCountry   ?? null,
    heightInInches: d.heightInInches ?? null,
    weightInPounds: d.weightInPounds ?? null,
    draftDetails:   d.draftDetails   ?? null,
    currentSeason,
    prevSeason,
    careerTotals:   d.careerTotals?.regularSeason ?? null,
    seasonTotals:   seasonTotals.slice(0, 5),
  });
}
