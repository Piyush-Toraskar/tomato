import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tomato: {
          50: "#fff4f2",
          100: "#ffe2de",
          200: "#ffc9c2",
          300: "#ffa397",
          400: "#fa7464",
          500: "#e43d30",
          600: "#c92f24",
          700: "#a8271f",
          800: "#8b251f",
          900: "#74241f"
        },
        ink: "#171717",
        canvas: "#fafaf8",
        warm: {
          50: "#fcfbf8",
          100: "#f4f1eb",
          200: "#e7e1d7",
          300: "#d3c9bb",
          500: "#8b7d6b",
          700: "#5c5145"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(23, 23, 23, 0.07)",
        lift: "0 14px 38px rgba(23, 23, 23, 0.10)"
      },
      maxWidth: {
        page: "1360px"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        },
        toastIn: {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        }
      },
      animation: {
        shimmer: "shimmer 1.7s linear infinite",
        toastIn: "toastIn 180ms ease-out"
      }
    }
  },
  plugins: []
} satisfies Config;
