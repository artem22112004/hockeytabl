import { NextResponse } from 'next/server';

const NHL_BASE = 'https://api-web.nhle.com/v1';

export async function GET() {
  const res = await fetch(`${NHL_BASE}/standings/now`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: `NHL API error ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
