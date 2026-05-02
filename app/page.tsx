import Link from 'next/link';
import GlobalSearch from '@/components/GlobalSearch';

const CARDS = [
  { href: '/skaters', title: 'Skater Stats',    desc: 'Points, goals, assists, +/−, TOI and more.', icon: '🏒' },
  { href: '/goalies', title: 'Goalie Stats',    desc: 'Wins, GAA, save percentage, shutouts.',      icon: '🥅' },
  { href: '/teams',   title: 'Team Standings',  desc: 'Conference & division standings, goal diff.', icon: '🏆' },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-12 py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">HockeyTables</h1>
        <p className="text-lg text-muted">Real-time NHL statistics — sortable, filterable, fast.</p>
        {/* Hero search */}
        <div className="w-full max-w-lg">
          <GlobalSearch variant="hero" />
        </div>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {CARDS.map(({ href, title, desc, icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent hover:bg-hover"
          >
            <span className="text-3xl">{icon}</span>
            <h2 className="text-lg font-semibold text-white group-hover:text-accent">{title}</h2>
            <p className="text-sm text-muted">{desc}</p>
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted">Data sourced from the official NHL API · Updates every 5 minutes</p>
    </div>
  );
}
