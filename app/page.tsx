import Link from 'next/link';
import GlobalSearch from '@/components/GlobalSearch';
import HomeStats from '@/components/HomeStats';

const QUICK_NAV = [
  {
    href: '/matches',
    label: 'Matches',
    desc: "Today's scores and upcoming games.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/skaters',
    label: 'Skaters',
    desc: 'Points, goals, assists, +/−, TOI.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/goalies',
    label: 'Goalies',
    desc: 'GAA, save %, wins, shutouts.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/teams',
    label: 'Standings',
    desc: 'Conference & division standings.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/match-center',
    label: 'Match Center',
    desc: 'In-depth team analytics & filters.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12 py-10">

      {/* ── Hero ── */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-1.5 text-xs font-medium text-[#3b82f6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
            Live NHL data
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] bg-clip-text text-transparent">
              HockeyTables
            </span>
          </h1>
          <p className="max-w-md text-base text-muted">
            Real-time NHL statistics — sortable, filterable, fast.
          </p>
        </div>

        <div className="w-full max-w-lg">
          <GlobalSearch variant="hero" />
        </div>
      </div>

      {/* ── Live stats preview ── */}
      <HomeStats />

      {/* ── Quick nav ── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
          Browse
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_NAV.map(({ href, label, desc, icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-[#3b82f6]/40 hover:bg-hover hover:shadow-lg hover:shadow-[#3b82f6]/5"
            >
              <span className="text-muted transition-colors group-hover:text-[#3b82f6]">{icon}</span>
              <div>
                <h2 className="text-sm font-semibold text-white transition-colors group-hover:text-[#3b82f6]">
                  {label}
                </h2>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        Data from the official NHL API · Auto-refreshes every 5 min
      </p>
    </div>
  );
}
