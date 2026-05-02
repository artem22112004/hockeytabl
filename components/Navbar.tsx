'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlobalSearch from './GlobalSearch';

const NAV_LINKS = [
  { href: '/skaters',      label: 'Skaters'      },
  { href: '/goalies',      label: 'Goalies'      },
  { href: '/teams',        label: 'Teams'        },
  { href: '/match-center', label: 'Match Center' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-bold text-white">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="13" stroke="#1f6feb" strokeWidth="2" />
            <path d="M7 14c2-4 5-7 7-7s5 3 7 7-5 7-7 7-7-3-7-7z" fill="#1f6feb" opacity=".3" />
            <ellipse cx="14" cy="18" rx="6" ry="2.5" fill="#1f6feb" opacity=".6" />
          </svg>
          <span className="hidden sm:inline">HockeyTables</span>
        </Link>

        {/* Nav links */}
        <div className="flex shrink-0 items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-accent text-white'
                  : 'text-muted hover:bg-hover hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Global search */}
        <div className="flex-1">
          <GlobalSearch variant="navbar" />
        </div>
      </div>
    </nav>
  );
}
