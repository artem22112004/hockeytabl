import Link from 'next/link';
import GlobalSearch from '@/components/GlobalSearch';
import HomeStats from '@/components/HomeStats';

const QUICK_NAV = [
  {
    href: '/matches',
    label: 'Matches',
    desc: "Today's scores and upcoming games.",
    color: '#00D1FF',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/skaters',
    label: 'Skaters',
    desc: 'Points, goals, assists, +/−, TOI.',
    color: '#6366f1',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/goalies',
    label: 'Goalies',
    desc: 'GAA, save %, wins, shutouts.',
    color: '#00D1FF',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/teams',
    label: 'Standings',
    desc: 'Conference & division standings.',
    color: '#6366f1',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/match-center',
    label: 'Match Center',
    desc: 'In-depth team analytics & H2H.',
    color: '#00D1FF',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-14 py-10">

      {/* ── Hero ── */}
      <div className="relative flex flex-col items-center gap-8 text-center">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[500px] -translate-x-1/2 rounded-full bg-[#00D1FF]/5 blur-3xl" />
        <div className="pointer-events-none absolute -top-8 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#6366f1]/7 blur-2xl" />

        <div className="relative flex flex-col items-center gap-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00D1FF]/25 bg-[#00D1FF]/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#00D1FF]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00D1FF]" />
            Live NHL Analytics
          </div>

          {/* Title */}
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #00D1FF 0%, #6366f1 50%, #00D1FF 100%)', backgroundSize: '200%' }}
            >
              HockeyTables
            </span>
          </h1>

          <p className="max-w-lg text-base font-light leading-relaxed text-[#94A3B8]">
            Premium NHL statistics — sortable, filterable, real-time.
          </p>
          <p className="text-sm text-[#94A3B8]/50">Bloomberg meets ESPN Stats.</p>
        </div>

        {/* Search */}
        <div className="relative z-10 w-full max-w-xl">
          <GlobalSearch variant="hero" />
        </div>
      </div>

      {/* ── Stats widgets ── */}
      <HomeStats />

      {/* ── Quick nav ── */}
      <div>
        <div className="mb-5 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#1e2d45] to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#94A3B8]/60">Sections</p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#1e2d45] to-transparent" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_NAV.map(({ href, label, desc, icon, color }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-[#1e2d45] bg-[#111520] p-5 shadow-card transition-all duration-200 hover:border-[#00D1FF]/25 hover:shadow-[0_8px_32px_rgba(0,209,255,0.08)]"
            >
              {/* Hover glow spot */}
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-60"
                style={{ background: color }}
              />
              <span style={{ color }} className="opacity-60 transition-opacity duration-200 group-hover:opacity-100">
                {icon}
              </span>
              <div>
                <h2 className="text-sm font-semibold text-white">{label}</h2>
                <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">{desc}</p>
              </div>
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00D1FF]/0 to-transparent transition-all duration-300 group-hover:via-[#00D1FF]/50" />
            </Link>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-[#94A3B8]/40">
        Data sourced from the official NHL API · Auto-refreshes every 5 min
      </p>
    </div>
  );
}
