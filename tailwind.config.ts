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
        // Restrained industrial accent — primary actions, active nav state,
        // occasional icon emphasis. Never used as a body-text color.
        orange: {
          50: "#fff2ec",
          100: "#ffdfd0",
          200: "#ffbfa3",
          300: "#ff9a6e",
          400: "#ff7238",
          500: "#ff4b0b",
          600: "#e63f05",
          700: "#bd3304",
          800: "#932804",
          900: "#782106",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        // Controls (buttons, inputs, badges) vs. panels/tables — the
        // reference uses near-square geometry, not Soft UI's 8–12px scale.
        DEFAULT: "4px",
        md: "4px",
        lg: "2px",
        xl: "2px",
      },
      boxShadow: {
        // Base raised elevation for panels/cards/buttons.
        panel: "var(--shadow-raised)",
        // Hover lift — every existing `hover:shadow-md` in the app (cards,
        // nav rows) now resolves to the soft-UI hover token for free.
        md: "var(--shadow-hover)",
        // Floating layers — dropdowns, popovers, the entry-screen modal.
        lg: "var(--shadow-elevated)",
        raised: "var(--shadow-raised)",
        elevated: "var(--shadow-elevated)",
        hover: "var(--shadow-hover)",
        inset: "var(--shadow-inset)",
        "inset-focus": "var(--shadow-inset-focus)",
        pressed: "var(--shadow-pressed)",
      },
    },
  },
  plugins: [],
};
export default config;
