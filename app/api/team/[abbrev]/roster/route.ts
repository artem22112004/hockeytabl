import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { abbrev: string } }
) {
  const abbrev = params.abbrev.toUpperCase();

  const res = await fetch(
    `https://api-web.nhle.com/v1/roster/${abbrev}/current`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return NextResponse.json({ forwards: [], defensemen: [], goalies: [] });
  const data = await res.json();

  function mapPlayer(p: any) {
    return {
      id:             p.id,
      firstName:      p.firstName?.default  ?? '',
      lastName:       p.lastName?.default   ?? '',
      sweaterNumber:  p.sweaterNumber       ?? null,
      position:       p.positionCode        ?? '',
      headshot:       p.headshot            ?? '',
      heightInInches: p.heightInInches      ?? null,
      weightInPounds: p.weightInPounds      ?? null,
      birthDate:      p.birthDate           ?? null,
      birthCountry:   p.birthCountry        ?? '',
      shoots:         p.shootsCatches       ?? null,
    };
  }

  return NextResponse.json({
    forwards:   (data.forwards   ?? []).map(mapPlayer),
    defensemen: (data.defensemen ?? []).map(mapPlayer),
    goalies:    (data.goalies    ?? []).map(mapPlayer),
  });
}
