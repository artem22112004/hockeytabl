'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

export interface TrendPoint {
  game:  number;
  value: number;
  date:  string;
  opp:   string;
}

interface Props {
  data:       TrendPoint[];
  color?:     string;
  label:      string;
  yDomain?:   [number, number];
  formatter?: (v: number) => string;
  refLine?:   number;
}

function CustomTooltip({ active, payload, label: chartLabel, formatter }: any) {
  if (!active || !payload?.[0]) return null;
  const d: TrendPoint = payload[0].payload;
  const valStr = formatter ? formatter(d.value) : String(d.value);
  return (
    <div className="rounded-xl border border-[#1e2a3e] bg-[#111827] px-3 py-2.5 text-xs shadow-2xl">
      <p className="font-semibold text-white">Game {d.game} · {d.date}</p>
      <p className="text-[#6b7280]">vs {d.opp}</p>
      <p className="mt-1 font-bold text-[#3b82f6]">{chartLabel}: {valStr}</p>
    </div>
  );
}

export default function TrendChart({
  data, color = '#3b82f6', label, yDomain, formatter, refLine,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3e" vertical={false} />
        <XAxis
          dataKey="game"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#1e2a3e' }}
          tickLine={false}
          tickCount={8}
        />
        <YAxis
          domain={yDomain ?? ['auto', 'auto']}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickCount={5}
          tickFormatter={formatter}
        />
        <Tooltip
          content={<CustomTooltip formatter={formatter} label={label} />}
          cursor={{ stroke: '#1e2a3e', strokeWidth: 1 }}
        />
        {refLine !== undefined && (
          <ReferenceLine y={refLine} stroke="#1e2a3e" strokeDasharray="4 4" strokeWidth={1} />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: '#0a0e1a', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
