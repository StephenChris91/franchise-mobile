/**
 * Franchise Church — NativeWind / Tailwind config
 * Synced from apps/mobile/design/tailwind.config.tokens.js
 */

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

      // ─────────────────────────────────────────────────────────────────
      // COLORS
      // ─────────────────────────────────────────────────────────────────
      colors: {
        // Backgrounds
        page:         "#0a0807",
        elevated:     "#14110f",
        card:         "#1a1614",
        "card-hover": "#221d1a",

        // Ink (text)
        ink: {
          DEFAULT:   "#f7f3ec",
          secondary: "#a5a09a",
          muted:     "#6b6661",
          inverse:   "#0a0807",
        },

        // Gold — the signature accent
        gold: {
          DEFAULT: "#d4a64a",
          bright:  "#e8bc5e",
          deep:    "#a87f2d",
          soft:    "rgba(212, 166, 74, 0.12)",
          glow:    "rgba(212, 166, 74, 0.25)",
        },

        // Cream
        cream: {
          DEFAULT: "#f0e4cf",
          soft:    "rgba(240, 228, 207, 0.08)",
        },

        // Borders
        border: {
          subtle:  "rgba(212, 166, 74, 0.08)",
          default: "rgba(212, 166, 74, 0.18)",
          strong:  "rgba(212, 166, 74, 0.35)",
          neutral: "rgba(255, 255, 255, 0.06)",
        },

        // Status — no blue (blue is not part of the brand)
        live:    "#c93a3a",
        success: "#4a9e6b",
        // warning intentionally maps to gold (on-brand)
      },

      // ─────────────────────────────────────────────────────────────────
      // TYPOGRAPHY
      // ─────────────────────────────────────────────────────────────────
      fontFamily: {
        sans:   ["Inter_400Regular", "Inter", "System"],
        serif:  ["Fraunces_400Regular", "Fraunces", "Georgia"],
        script: ["DancingScript_700Bold", "cursive"],
      },

      fontSize: {
        xs:    ["10px", { lineHeight: "1.4" }],
        sm:    ["12px", { lineHeight: "1.4" }],
        base:  ["14px", { lineHeight: "1.55" }],
        md:    ["15px", { lineHeight: "1.55" }],
        lg:    ["18px", { lineHeight: "1.4" }],
        xl:    ["22px", { lineHeight: "1.1" }],
        "2xl": ["28px", { lineHeight: "1.1" }],
        "3xl": ["36px", { lineHeight: "1.0" }],
        "4xl": ["44px", { lineHeight: "1.0" }],
        hero:  ["52px", { lineHeight: "1.05" }],
      },

      letterSpacing: {
        tight:   "-0.03em",
        snug:    "-0.02em",
        normal:  "0",
        wide:    "0.05em",
        wider:   "0.1em",
        widest:  "0.2em",
        brand:   "0.4em",   // ALL CAPS sub-labels
        eyebrow: "0.25em",  // Section eyebrow labels
        badge:   "0.06em",  // Badge text
      },

      // ─────────────────────────────────────────────────────────────────
      // BORDER RADIUS
      // ─────────────────────────────────────────────────────────────────
      borderRadius: {
        sm:     "8px",
        md:     "12px",
        lg:     "16px",
        xl:     "20px",
        "2xl":  "24px",
        pill:   "100px",
      },

      // ─────────────────────────────────────────────────────────────────
      // SPACING
      // ─────────────────────────────────────────────────────────────────
      spacing: {
        "4.5": "18px",
        "18":  "72px",  // Tab bar height
      },

      // ─────────────────────────────────────────────────────────────────
      // HEIGHT / WIDTH — named component sizes
      // ─────────────────────────────────────────────────────────────────
      height: {
        "tab-bar":   "72px",
        "btn":       "52px",
        "btn-sm":    "36px",
        "icon-btn":  "36px",
        "avatar-sm": "22px",
        "avatar-md": "38px",
        "avatar-lg": "56px",
        "avatar-xl": "80px",
      },

      width: {
        "icon-btn":  "36px",
        "avatar-sm": "22px",
        "avatar-md": "38px",
        "avatar-lg": "56px",
        "avatar-xl": "80px",
      },

      // ─────────────────────────────────────────────────────────────────
      // SHADOWS
      // ─────────────────────────────────────────────────────────────────
      boxShadow: {
        card:        "0 1px 3px rgba(0, 0, 0, 0.4)",
        "gold-glow": "0 8px 24px -8px rgba(212, 166, 74, 0.5)",
      },

      // ─────────────────────────────────────────────────────────────────
      // BACKGROUND IMAGES (gradient helpers)
      // ─────────────────────────────────────────────────────────────────
      backgroundImage: {
        "hero-warm":
          "linear-gradient(135deg, #1a0e05 0%, #4a2a1a 50%, #8b6f3e 100%)",
        "profile-cover":
          "linear-gradient(135deg, #1a0e05 0%, #6b4e1f 40%, #d4a64a 100%)",
        "welcome-glow":
          "radial-gradient(ellipse at 50% 0%, rgba(212, 166, 74, 0.18) 0%, transparent 55%)",
        "avatar-default":
          "linear-gradient(135deg, #5a3a1a 0%, #d4a64a 100%)",
        "avatar-deep":
          "linear-gradient(135deg, #2a1d0a 0%, #6b4e1f 100%)",
        "avatar-warm":
          "linear-gradient(135deg, #8b6f3e 0%, #f0e4cf 100%)",
        "avatar-bronze":
          "linear-gradient(135deg, #4a2a1a 0%, #b8702e 100%)",
        "avatar-amber":
          "linear-gradient(135deg, #6b4e1f 0%, #e8bc5e 100%)",
      },

      // ─────────────────────────────────────────────────────────────────
      // ANIMATION
      // ─────────────────────────────────────────────────────────────────
      keyframes: {
        "fc-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(1.3)" },
        },
        "fc-shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      animation: {
        "fc-pulse":   "fc-pulse 1.5s ease-in-out infinite",
        "fc-shimmer": "fc-shimmer 1.5s linear infinite",
      },
    },
  },
  plugins: [],
};
