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
        pink: {
          50:  "#FFF5F7",
          100: "#FFE4EC",
          200: "#FFB3C6",
          300: "#FF85A1",
          400: "#FF6B8B",
          500: "#E8607A",
          600: "#D4506A",
        },
        mint:     "#A8E6CF",
        lavender: "#D4B8E0",
        peach:    "#FFD3A5",
        lemon:    "#FFEAA7",
        clay: {
          text:  "#2D1B2E",
          mid:   "#6B3A4E",
          muted: "#A07890",
        },
      },
      fontFamily: {
        heading: ["var(--font-baloo)", "cursive"],
        body:    ["var(--font-nunito)", "sans-serif"],
      },
      borderRadius: {
        clay: "20px",
        "clay-lg": "28px",
      },
      boxShadow: {
        clay:    "6px 6px 0px #FFB3C6",
        "clay-sm": "4px 4px 0px #FFB3C6",
        "clay-mint":     "6px 6px 0px #7ECFB0",
        "clay-lavender": "6px 6px 0px #B89DD0",
        "clay-peach":    "6px 6px 0px #FFBA7A",
        "clay-lemon":    "6px 6px 0px #FFD97A",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        "float-delay": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%":      { transform: "rotate(2deg)" },
        },
      },
      animation: {
        float:        "float 4s ease-in-out infinite",
        "float-delay": "float-delay 5s ease-in-out 1s infinite",
        "float-slow":  "float 6s ease-in-out 0.5s infinite",
        wiggle:       "wiggle 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
