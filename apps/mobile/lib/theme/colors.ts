/**
 * Franchise Church design tokens — mobile source of truth.
 * Synced from apps/mobile/design/design-tokens.json.
 * Rule: No blue. Gold is the primary action colour. Red is for LIVE only.
 */
export const COLORS = {
  brand: {
    primary: "#d4a64a",                       // gold — buttons, active states, CTAs
    bright:  "#e8bc5e",                       // gold-bright — gradients, highlights
    deep:    "#a87f2d",                       // gold-deep — labels on dark
    soft:    "rgba(212, 166, 74, 0.12)",      // gold-soft — badge/tag backgrounds
    glow:    "rgba(212, 166, 74, 0.25)",      // gold-glow — shadows and halos
  },
  bg: {
    page:      "#0a0807",                     // deepest canvas — screen background
    elevated:  "#14110f",                     // toolbars, bottom sheets, tab bar
    card:      "#1a1614",                     // cards, list items, inputs
    cardHover: "#221d1a",                     // card pressed state
    overlay:   "rgba(10, 8, 7, 0.95)",       // overlay modals
  },
  ink: {
    primary:   "#f7f3ec",                     // main body text — warm white
    secondary: "#a5a09a",                     // supporting text, meta, timestamps
    muted:     "#6b6661",                     // placeholders, disabled labels
    inverse:   "#0a0807",                     // text on gold surfaces
  },
  border: {
    subtle:  "rgba(212, 166, 74, 0.08)",      // barely-there dividers
    default: "rgba(212, 166, 74, 0.18)",      // standard card/component border
    strong:  "rgba(212, 166, 74, 0.35)",      // focused or active border
    neutral: "rgba(255, 255, 255, 0.06)",     // neutral divider, no gold tint
  },
  cream: {
    DEFAULT: "#f0e4cf",                       // warm secondary accent
    soft:    "rgba(240, 228, 207, 0.08)",     // subtle section backgrounds
  },
  status: {
    live:    "#c93a3a",                       // LIVE badge only — universal red
    liveSoft:"rgba(201, 58, 58, 0.15)",       // soft live background
    error:   "#c93a3a",                       // error/danger — same red (alias)
    success: "#4a9e6b",                       // positive confirmation
    warning: "#d4a64a",                       // warnings reuse gold (on-brand)
    // Note: no info/blue — blue is not part of the Franchise brand
  },
  gradient: {
    heroWarm:     "linear-gradient(135deg, #1a0e05 0%, #4a2a1a 50%, #8b6f3e 100%)",
    profileCover: "linear-gradient(135deg, #1a0e05 0%, #6b4e1f 40%, #d4a64a 100%)",
    avatarDefault:"linear-gradient(135deg, #5a3a1a 0%, #d4a64a 100%)",
    avatarDeep:   "linear-gradient(135deg, #2a1d0a 0%, #6b4e1f 100%)",
    avatarWarm:   "linear-gradient(135deg, #8b6f3e 0%, #f0e4cf 100%)",
    avatarBronze: "linear-gradient(135deg, #4a2a1a 0%, #b8702e 100%)",
    avatarAmber:  "linear-gradient(135deg, #6b4e1f 0%, #e8bc5e 100%)",
  },
} as const;
