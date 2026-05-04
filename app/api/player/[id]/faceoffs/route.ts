import { NextRequest, NextResponse } from 'next/server';

const STATS_BASE = 'https://api.nhle.com/stats/rest/en';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = req.nextUrl;
  const season   = searchParams.get('season')   ?? '20252026';
  const gameType = searchParams.get('gameType') ?? '2';

  const sort    = encodeURIComponent(JSON.stringify([{ property: 'totalFaceoffs', direction: 'DESC' }]));
  const cayenne = encodeURIComponent(`seasonId=${season} and gameTypeId=${gameType} and playerId=${params.id}`);
  const url = `${STATS_BASE}/skater/faceoffpercentages?isAggregate=false&isGame=false&sort=${sort}&start=0&limit=1&cayenneExp=${cayenne}`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return NextResponse.json({ data: null });
  const json = await res.json();
  const p = json.data?.[0] ?? null;
  if (!p) return NextResponse.json({ data: null });

  const foWins   = Math.round((p.totalFaceoffs ?? 0) * (p.faceoffWinPct ?? 0));
  const foLosses = (p.totalFaceoffs ?? 0) - foWins;

  return NextResponse.json({
    data: {
      totalFaceoffs: p.totalFaceoffs ?? 0,
      foWins,
      foLosses,
      foPct:        p.faceoffWinPct         != null ? +(p.faceoffWinPct * 100).toFixed(1)         : null,
      evFoPct:      p.evFaceoffPct          != null ? +(p.evFaceoffPct * 100).toFixed(1)          : null,
      ppFoPct:      p.ppFaceoffPct          != null ? +(p.ppFaceoffPct * 100).toFixed(1)          : null,
      dzFoPct:      p.defensiveZoneFaceoffPct != null ? +(p.defensiveZoneFaceoffPct * 100).toFixed(1) : null,
      ozFoPct:      p.offensiveZoneFaceoffPct != null ? +(p.offensiveZoneFaceoffPct * 100).toFixed(1) : null,
      nzFoPct:      p.neutralZoneFaceoffPct  != null ? +(p.neutralZoneFaceoffPct * 100).toFixed(1)  : null,
    },
  });
}
