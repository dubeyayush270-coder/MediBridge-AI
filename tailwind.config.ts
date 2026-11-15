import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#FAF9F5", // Warm off-white
          subtle: "#F4F3EE",
          surface: "#FFFFFF",
        },
        navy: {
          50: "#F0F4F8",
          100: "#D9E2EC",
          200: "#BCCCDC",
          300: "#9FB3C8",
          400: "#829AB1",
          500: "#627D98",
          600: "#486581",
          700: "#334E68",
          800: "#1B2A4A",
          900: "#0F1A2F", // Deep navy for high-contrast text
          950: "#080F1D",
        },
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488", // Primary teal accent
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
          950: "#042F2E",
        },
        coral: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          500: "#F97316",
          600: "#EA580C",
        },
        sage: {
          50: "#F2F7F4",
          100: "#E2ECE5",
          600: "#427A5B",
          700: "#2F5C43",
        }
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 2px 10px rgba(15, 26, 47, 0.04), 0 1px 3px rgba(15, 26, 47, 0.02)",
        "card-hover": "0 10px 25px -5px rgba(15, 26, 47, 0.08), 0 8px 10px -6px rgba(15, 26, 47, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
