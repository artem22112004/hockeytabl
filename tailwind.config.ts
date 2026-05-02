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
        base:    '#0a0e1a',
        surface: '#111827',
        hover:   '#162032',
        accent:  '#3b82f6',
        cyan:    '#06b6d4',
        muted:   '#6b7280',
        border:  '#1e2a3e',
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
