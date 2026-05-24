/** Brand color palette — mirrors apps/web tailwind.config.js */
export const COLORS = {
  brand: {
    primary: "#af601a",
    dark: "#8b4c14",
    light: "#c97a30",
    faint: "#fdf3e7",
  },
  dark: {
    bg: "#1b1b1b",
    card: "#2d2d2d",
    border: "#3d3d3d",
    elevated: "#333333",
  },
  text: {
    primary: "#111827",
    secondary: "#6b7280",
    muted: "#9ca3af",
    inverse: "#ffffff",
    brand: "#af601a",
  },
  bg: {
    primary: "#ffffff",
    secondary: "#f9fafb",
    elevated: "#f3f4f6",
  },
  border: {
    default: "#e5e7eb",
    muted: "#f3f4f6",
  },
  status: {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
} as const;
