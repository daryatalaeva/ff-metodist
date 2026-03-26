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
        "fox-orange":       "#F96B1B",
        "fox-orange-light": "#FEF0E6",
        "fox-blue":         "#2B7FFF",
        "fox-blue-light":   "#E8F4FF",
        "fox-page":         "#F3F4F6",
        "fox-answer":       "#F0F7FF",
        "fox-warning":      "#FFF8DC",
        "fox-purple":       "#C084FC",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
