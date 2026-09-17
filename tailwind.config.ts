import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rarity: {
          common: "#9CA3AF",
          rare: "#3B82F6",
          epic: "#A855F7",
          legendary: "#F59E0B",
        },
      },
      keyframes: {
        "gacha-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px) rotate(-2deg)" },
          "75%": { transform: "translateX(4px) rotate(2deg)" },
        },
        "gacha-pop": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "70%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "gacha-shake": "gacha-shake 0.15s ease-in-out 6",
        "gacha-pop": "gacha-pop 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
