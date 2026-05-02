'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export interface ChartPoint {
  game:    number;
  pts:     number;
  cumPts:  number;
  date:    string;
  opp:     string;
  goals:   number;
  assists: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d: ChartPoint = payload[0].payload;
  return (
    <div className="rounded-xl border border-[#1e2a3e] bg-[#111827] px-3 py-2.5 text-xs shadow-2xl">
      <p className="font-semibold text-white">
        Game {d.game} · {d.date}
      </p>
      <p className="text-[#6b7280]">vs {d.opp}</p>
      <p className="mt-1 font-bold text-[#3b82f6]">{d.cumPts} PTS (season total)</p>
      <p className="text-white">
        {d.goals}G + {d.assists}A = {d.pts} this game
      </p>
    </div>
  );
}

export default function PointsChart({ data }: { data: ChartPoint[] }) {
  const maxPts = Math.max(...data.map((d) => d.cumPts), 1);
  const yMax   = Math.ceil(maxPts / 10) * 10 + 10;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3e" vertical={false} />

        <XAxis
          dataKey="game"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#1e2a3e' }}
          tickLine={false}
          tickCount={8}
        />
        <YAxis
          domain={[0, yMax]}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickCount={6}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#1e2a3e', strokeWidth: 1 }}
        />

        {/* Shade every 10-point milestone */}
        {Array.from({ length: Math.floor(yMax / 10) }, (_, i) => (i + 1) * 10).map((v) => (
          <ReferenceLine
            key={v}
            y={v}
            stroke="#1e2a3e"
            strokeDasharray="2 4"
            strokeWidth={1}
          />
        ))}

        <Line
          type="monotone"
          dataKey="cumPts"
          stroke="url(#lineGrad)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{
            r: 5,
            fill: '#3b82f6',
            stroke: '#0a0e1a',
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
