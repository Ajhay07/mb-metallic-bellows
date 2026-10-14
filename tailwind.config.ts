import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          50: "#f6f7f8",
          100: "#eceeef",
          200: "#d5d9dc",
          300: "#b1b8be",
          400: "#86909a",
          500: "#67737d",
          600: "#545e67",
          700: "#454d54",
          800: "#3b4147",
          850: "#2d3237",
          900: "#22262a",
          950: "#15181b",
        },
        steel: {
          50: "#eef4f8",
          100: "#d9e7ef",
          200: "#b7d0e0",
          300: "#8cb3cb",
          400: "#5b8fb0",
          500: "#3d7295",
          600: "#2f5a78",
          700: "#284a62",
          800: "#233f52",
          900: "#1f3646",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px 0 rgba(21, 24, 27, 0.06), 0 1px 1px 0 rgba(21, 24, 27, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
