import { Fragment } from 'react';

const THRESHOLDS = [2.5, 3.5, 4.5, 5.5, 6.5];

function pctColor(pct: number): string {
  if (pct >= 65) return 'text-green-400';
  if (pct >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function calcOver(games: any[], threshold: number, filter?: 'H' | 'A') {
  const filtered = filter ? games.filter((g) => g.homeOrAway === filter) : games;
  const total    = filtered.length;
  if (total === 0) return { over: 0, under: 0, pct: 0, total: 0 };
  const over  = filtered.filter((g) => (g.total ?? g.gf + g.ga) > threshold).length;
  const pct   = Math.round((over / total) * 100);
  return { over, under: total - over, pct, total };
}

function calcBTTS(games: any[], filter?: 'H' | 'A') {
  const filtered = filter ? games.filter((g) => g.homeOrAway === filter) : games;
  const total    = filtered.length;
  if (total === 0) return { over: 0, under: 0, pct: 0, total: 0 };
  const btts = filtered.filter((g) => g.gf > 0 && g.ga > 0).length;
  return { over: btts, under: total - btts, pct: Math.round((btts / total) * 100), total };
}

interface StatCell {
  over: number;
  under: number;
  pct: number;
  total: number;
}

function Cells({ stat }: { stat: StatCell }) {
  return (
    <>
      <td className="px-2 py-2 text-center text-white">{stat.over}</td>
      <td className="px-2 py-2 text-center text-muted">{stat.under}</td>
      <td className={`px-2 py-2 text-center font-bold ${stat.total > 0 ? pctColor(stat.pct) : 'text-muted'}`}>
        {stat.total > 0 ? `${stat.pct}%` : '—'}
      </td>
    </>
  );
}

export default function TotalsTable({ games }: { games: any[] }) {
  const last20   = games.slice(-20);
  const homeGames = last20.filter((g) => g.homeOrAway === 'H');
  const awayGames = last20.filter((g) => g.homeOrAway === 'A');

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface text-xs font-semibold uppercase tracking-wider text-muted">
            <th className="border-b border-border px-3 py-2.5 text-left">Total</th>
            <th className="border-b border-border px-3 py-2.5 text-center" colSpan={3}>
              All ({last20.length})
            </th>
            <th className="border-b border-border px-3 py-2.5 text-center" colSpan={3}>
              Home ({homeGames.length})
            </th>
            <th className="border-b border-border px-3 py-2.5 text-center" colSpan={3}>
              Away ({awayGames.length})
            </th>
          </tr>
          <tr className="bg-surface text-[11px] text-muted">
            <th className="border-b border-border px-3 py-1.5 text-left" />
            {(['Over', 'Under', '%'] as const).map((h) => (
              <th key={`a-${h}`} className="border-b border-border px-2 py-1.5 text-center font-medium">{h}</th>
            ))}
            {(['Over', 'Under', '%'] as const).map((h) => (
              <th key={`h-${h}`} className="border-b border-border px-2 py-1.5 text-center font-medium">{h}</th>
            ))}
            {(['Over', 'Under', '%'] as const).map((h) => (
              <th key={`aw-${h}`} className="border-b border-border px-2 py-1.5 text-center font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {THRESHOLDS.map((threshold, i) => (
            <tr key={threshold} className={`border-b border-border ${i % 2 === 0 ? 'bg-base' : 'bg-surface/30'}`}>
              <td className="px-3 py-2 font-semibold text-white">O {threshold}</td>
              <Cells stat={calcOver(last20, threshold)} />
              <Cells stat={calcOver(last20, threshold, 'H')} />
              <Cells stat={calcOver(last20, threshold, 'A')} />
            </tr>
          ))}
          <tr className="border-b border-border bg-surface/50">
            <td className="px-3 py-2 font-semibold text-white">BTTS</td>
            <Cells stat={calcBTTS(last20)} />
            <Cells stat={calcBTTS(last20, 'H')} />
            <Cells stat={calcBTTS(last20, 'A')} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
