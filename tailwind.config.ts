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
        // ── ブランドカラー ──
        accent: {
          DEFAULT: "#7a5dc7",
          2:       "#534ab7",
          lt:      "#c5b3ff",
          dim:     "rgba(122,93,199,0.15)",
        },
        teal:  "#1d9e75",
        coral: "#d85a30",
        blue:  "#378add",
        amber: "#fac775",
        // ── 背景 ──
        bg: {
          DEFAULT: "#0a0910",
          card:    "#13121c",
          card2:   "#1a1827",
          nav:     "rgba(10,9,16,0.92)",
          side:    "#0f0e18",
        },
        // ── テキスト ──
        text: {
          1: "rgba(255,255,255,0.88)",
          2: "rgba(255,255,255,0.50)",
          3: "rgba(255,255,255,0.28)",
        },
        // ── ボーダー ──
        border: {
          DEFAULT: "rgba(255,255,255,0.07)",
          2:       "rgba(255,255,255,0.13)",
        },
      },
      fontFamily: {
        sans:  ["var(--font-sans)", "Noto Sans JP", "sans-serif"],
        serif: ["var(--font-serif)", "DM Serif Display", "Noto Serif JP", "serif"],
        body:  ["Noto Serif JP", "serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%":   { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        popIn: {
          "0%":   { opacity: "0", transform: "scale(0.94) translateY(-4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        pulse: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.4" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.2" },
        },
        pageCurl: {
          "0%":   { transform: "perspective(600px) rotateY(0deg)" },
          "50%":  { transform: "perspective(600px) rotateY(-12deg)" },
          "100%": { transform: "perspective(600px) rotateY(0deg)" },
        },
        scrollLine: {
          "0%":   { transform: "scaleY(0)", transformOrigin: "top" },
          "49%":  { transform: "scaleY(1)", transformOrigin: "top" },
          "51%":  { transform: "scaleY(1)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(0)", transformOrigin: "bottom" },
        },
      },
      animation: {
        "fade-up":    "fadeUp 0.8s ease both",
        "slide-up":   "slideUp 0.3s ease",
        "pop-in":     "popIn 0.18s ease",
        "pulse-slow": "pulse 2s ease-in-out infinite",
        "blink":      "blink 2s ease-in-out infinite",
        "page-curl":  "pageCurl 0.32s ease",
        "scroll-line":"scrollLine 1.8s ease-in-out infinite",
      },
      backdropBlur: {
        nav: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
