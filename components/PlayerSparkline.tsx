'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Props {
  id: number;
  season: string;
}

const W = 64;
const H = 22;

export default function PlayerSparkline({ id, season }: Props) {
  const { data } = useSWR(
    `/api/player/${id}/game-log?season=${season}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 600_000 }
  );

  const gameLog: any[] = data?.gameLog ?? [];
  const last5 = gameLog
    .filter((g) => g.gameDate)
    .sort((a, b) => a.gameDate.localeCompare(b.gameDate))
    .slice(-5)
    .map((g) => (g.points ?? 0) as number);

  if (!data) {
    // Loading skeleton
    return (
      <div className="flex items-end gap-0.5" style={{ width: W, height: H }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 animate-pulse rounded-sm bg-[#1e2d45]" style={{ height: 4 + i * 2 }} />
        ))}
      </div>
    );
  }

  if (last5.length < 2) {
    return (
      <div className="flex items-end gap-0.5" style={{ width: W, height: H }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 rounded-sm bg-[#1e2d45]" style={{ height: 3 }} />
        ))}
      </div>
    );
  }

  const max = Math.max(...last5, 1);
  const coords = last5.map((v, i) => {
    const x = (i / (last5.length - 1)) * (W - 4) + 2;
    const y = H - 3 - (v / max) * (H - 8);
    return [x, y] as [number, number];
  });
  const polyline = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const [lx, ly] = coords[coords.length - 1];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#00D1FF" />
        </linearGradient>
      </defs>
      <polyline
        points={polyline}
        fill="none"
        stroke={`url(#spark-${id})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="2.5" fill="#00D1FF" />
    </svg>
  );
}
