/** Franchise Church design tokens — deep-dark premium palette */
export const COLORS = {
  brand: {
    primary: "#d4a64a",                        // gold
    bright:  "#e8bc5e",                        // gold-bright
    deep:    "#a87f2d",                        // gold-deep
    soft:    "rgba(212, 166, 74, 0.12)",       // gold-soft (icon bg tint)
  },
  bg: {
    page:      "#0a0807",                      // darkest canvas
    elevated:  "#14110f",                      // nav bars, tab bar
    card:      "#1a1614",                      // cards, inputs
    cardHover: "#221d1a",                      // card pressed state
  },
  ink: {
    primary:   "#f7f3ec",                      // main text
    secondary: "#a5a09a",                      // sub-text, labels
    muted:     "#6b6661",                      // placeholders, idle icons
  },
  border: {
    subtle:  "rgba(212, 166, 74, 0.08)",       // very faint dividers
    default: "rgba(212, 166, 74, 0.18)",       // standard card/input borders
  },
  cream:  "#f0e4cf",
  status: {
    success: "#10b981",
    warning: "#f59e0b",
    error:   "#c93a3a",                        // accent-red
    info:    "#3b82f6",
  },
} as const;
