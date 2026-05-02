import { NextRequest, NextResponse } from 'next/server';

const NHL_BASE = 'https://api-web.nhle.com/v1';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = req.nextUrl;
  const season   = searchParams.get('season')   ?? '20242025';
  const gameType = searchParams.get('gameType') ?? '2';

  const res = await fetch(
    `${NHL_BASE}/player/${params.id}/game-log/${season}/${gameType}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `NHL API error ${res.status}` },
      { status: res.status }
    );
  }

  return NextResponse.json(await res.json());
}
