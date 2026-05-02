'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlobalSearch from './GlobalSearch';

const NAV_LINKS = [
  { href: '/matches',      label: 'Matches'      },
  { href: '/skaters',      label: 'Skaters'      },
  { href: '/goalies',      label: 'Goalies'      },
  { href: '/teams',        label: 'Teams'        },
  { href: '/match-center', label: 'Match Center' },
];

function PuckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="12" rx="10" ry="7" fill="url(#puck-grad)" />
      <ellipse cx="12" cy="12" rx="10" ry="7" stroke="url(#puck-grad)" strokeWidth="0" />
      <ellipse cx="12" cy="10" rx="7" ry="3" fill="rgba(255,255,255,0.15)" />
      <defs>
        <linearGradient id="puck-grad" x1="2" y1="5" x2="22" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Navbar() {
  const pathname  = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto max-w-screen-2xl px-4">

        {/* ── Desktop (sm+) ── */}
        <div className="hidden h-14 grid-cols-[auto_1fr_auto] items-center gap-6 sm:grid">

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5 select-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] shadow-lg shadow-blue-500/20">
              <PuckIcon />
            </div>
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] bg-clip-text text-base font-bold text-transparent">
              HockeyTables
            </span>
          </Link>

          {/* Nav links — centered */}
          <div className="flex items-center justify-center gap-0.5">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || (pathname.startsWith(href + '/') && href !== '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'text-white'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#3b82f6]/15 to-[#06b6d4]/15" />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex justify-end">
            <GlobalSearch variant="navbar" />
          </div>
        </div>

        {/* ── Mobile ── */}
        <div className="flex h-14 items-center justify-between sm:hidden">
          <Link href="/" className="flex items-center gap-2 select-none">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#06b6d4]">
              <PuckIcon />
            </div>
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] bg-clip-text text-sm font-bold text-transparent">
              HockeyTables
            </span>
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-white"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-border bg-surface sm:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            <div className="pb-2">
              <GlobalSearch variant="navbar" />
            </div>
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#3b82f6]/15 to-[#06b6d4]/15 text-white'
                      : 'text-muted hover:bg-hover hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
