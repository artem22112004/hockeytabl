import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { abbrev: string } }
) {
  const season = req.nextUrl.searchParams.get('season') ?? '20252026';
  const abbrev = params.abbrev.toUpperCase();

  try {
    const res = await fetch(
      `https://api-web.nhle.com/v1/club-stats/${abbrev}/${season}/2`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return NextResponse.json({ teamStats: null });
    const data = await res.json();

    // The endpoint may return different shapes; normalise what we can use
    const ts = data.teamStats ?? data.seasonStats ?? null;
    return NextResponse.json({ teamStats: ts, raw: data });
  } catch {
    return NextResponse.json({ teamStats: null });
  }
}
