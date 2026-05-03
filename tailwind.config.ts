import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base:    '#0B0E14',
        surface: '#111520',
        hover:   '#161c2e',
        accent:  '#00D1FF',
        indigo:  '#6366f1',
        muted:   '#94A3B8',
        border:  '#1e2d45',
        success: '#22c55e',
        danger:  '#ef4444',
        cyan:    '#06b6d4',
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #00D1FF 0%, #6366f1 100%)',
      },
      boxShadow: {
        card:        '0 4px 24px rgba(0,0,0,0.4)',
        glow:        '0 0 24px rgba(0,209,255,0.15)',
        'glow-indigo': '0 0 24px rgba(99,102,241,0.2)',
      },
    },
  },
  plugins: [],
};
export default config;
