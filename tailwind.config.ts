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
        surface: "#161b22",
        base: "#0d1117",
        accent: "#1f6feb",
        muted: "#8b949e",
        border: "#30363d",
        hover: "#1c2128",
      },
    },
  },
  plugins: [],
};
export default config;
