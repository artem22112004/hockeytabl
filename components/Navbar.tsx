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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="12" rx="10" ry="7" fill="url(#puck-g)" />
      <ellipse cx="12" cy="10" rx="7" ry="3" fill="rgba(255,255,255,0.12)" />
      <defs>
        <linearGradient id="puck-g" x1="2" y1="5" x2="22" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00D1FF" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1e2d45] bg-[#111520]/80 backdrop-blur-[12px]">
      <div className="mx-auto max-w-screen-2xl px-4">

        {/* ── Desktop ── */}
        <div className="hidden h-14 grid-cols-[auto_1fr_auto] items-center gap-6 sm:grid">

          {/* Logo */}
          <Link href="/" className="flex shrink-0 select-none items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#00D1FF] to-[#6366f1] shadow-lg shadow-[#00D1FF]/20">
              <PuckIcon />
            </div>
            <span className="bg-gradient-to-r from-[#00D1FF] to-[#6366f1] bg-clip-text text-base font-bold text-transparent">
              HockeyTables
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center justify-center gap-0.5">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || (pathname.startsWith(href + '/') && href !== '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                    active ? 'text-[#00D1FF]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {active && (
                    <>
                      <span className="absolute inset-0 rounded-lg bg-[#00D1FF]/8" />
                      <span className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[#00D1FF]/70 to-transparent" />
                    </>
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
          <Link href="/" className="flex select-none items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D1FF] to-[#6366f1]">
              <PuckIcon />
            </div>
            <span className="bg-gradient-to-r from-[#00D1FF] to-[#6366f1] bg-clip-text text-sm font-bold text-transparent">
              HockeyTables
            </span>
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-[#94A3B8] transition-colors hover:bg-hover hover:text-white"
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
        <div className="border-t border-[#1e2d45] bg-[#111520]/95 backdrop-blur-[12px] sm:hidden">
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
                  className={`flex items-center rounded-lg py-2 text-sm font-medium transition-all ${
                    active
                      ? 'border-l-2 border-[#00D1FF] bg-[#00D1FF]/8 pl-[10px] pr-3 text-[#00D1FF]'
                      : 'px-3 text-[#94A3B8] hover:bg-hover hover:text-white'
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
