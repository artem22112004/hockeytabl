'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

export interface GoalieChartPoint {
  game:         number;
  date:         string;
  opp:          string;
  decision:     string;
  svPctg:       number;
  goalsAgainst: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: GoalieChartPoint = payload[0].payload;
  return (
    <div className="rounded-xl border border-[#1e2a3e] bg-[#111827] px-3 py-2.5 text-xs shadow-2xl">
      <p className="font-semibold text-white">Game {d.game} · {d.date}</p>
      <p className="text-[#6b7280]">vs {d.opp} · <span className={
        d.decision === 'W' ? 'text-green-400' : d.decision === 'L' ? 'text-red-400' : 'text-yellow-400'
      }>{d.decision}</span></p>
      <p className="mt-1 font-bold text-[#3b82f6]">SV%: {d.svPctg.toFixed(1)}%</p>
      <p className="text-red-400">GA: {d.goalsAgainst}</p>
    </div>
  );
}

export default function GoalieChart({ data }: { data: GoalieChartPoint[] }) {
  const maxGA = Math.max(...data.map((d) => d.goalsAgainst), 4);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 32, left: -18, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3e" vertical={false} />
        <XAxis
          dataKey="game"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#1e2a3e' }}
          tickLine={false}
          tickCount={8}
        />
        <YAxis
          yAxisId="sv"
          domain={[80, 100]}
          tick={{ fill: '#3b82f6', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickCount={5}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          yAxisId="ga"
          orientation="right"
          domain={[0, maxGA + 1]}
          tick={{ fill: '#ef4444', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickCount={maxGA + 2}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1e2a3e', strokeWidth: 1 }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#6b7280', paddingTop: 4 }}
          formatter={(v) => v === 'svPctg' ? 'SV%' : 'GA'}
        />
        <Line
          yAxisId="sv"
          type="monotone"
          dataKey="svPctg"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6', stroke: '#0a0e1a', strokeWidth: 2 }}
        />
        <Line
          yAxisId="ga"
          type="monotone"
          dataKey="goalsAgainst"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#ef4444', stroke: '#0a0e1a', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
