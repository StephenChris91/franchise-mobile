/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── Backgrounds ──────────────────────────────────────────────────────
        page:          "#0a0807",
        elevated:      "#14110f",
        card:          "#1a1614",
        "card-hover":  "#221d1a",

        // ── Text (ink) ───────────────────────────────────────────────────────
        ink: {
          DEFAULT:   "#f7f3ec",      // className="text-ink"
          secondary: "#a5a09a",      // className="text-ink-secondary"
          muted:     "#6b6661",      // className="text-ink-muted"
        },

        // ── Gold accent ──────────────────────────────────────────────────────
        gold: {
          DEFAULT: "#d4a64a",        // className="text-gold" / "bg-gold"
          bright:  "#e8bc5e",
          deep:    "#a87f2d",
        },

        cream:   "#f0e4cf",

        // ── Status ───────────────────────────────────────────────────────────
        success: "#10b981",
        warning: "#f59e0b",
        danger:  "#c93a3a",
      },
      fontFamily: {
        sans:   ["Inter_400Regular", "Inter", "System"],
        serif:  ["Fraunces_400Regular", "Fraunces", "Georgia"],
        script: ["DancingScript_700Bold", "cursive"],
      },
    },
  },
  plugins: [],
};
