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
        brand: {
          DEFAULT: "#af601a",
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
      },
    },
  },
  plugins: [],
};
