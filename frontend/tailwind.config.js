/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-background": "#E5E7EB",
        primary: "#22C55E",
        "primary-container": "#1F2F1F",
        "on-primary": "#052910",
        "on-primary-container": "#DCFCE7",
        secondary: "#F59E0B",
        "secondary-container": "#2D1F0A",
        "on-secondary": "#241400",
        "on-secondary-container": "#FDE68A",
        tertiary: "#60A5FA",
        "tertiary-container": "#0F172A",
        "on-tertiary": "#071225",
        "on-tertiary-container": "#DBEAFE",
      },
      fontFamily: {
        "body-md": ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        h1: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        h3: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        badge: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "body-md": ["0.95rem", { lineHeight: "1.4rem" }],
        h1: ["1.5rem", { lineHeight: "1.8rem" }],
        h3: ["1.1rem", { lineHeight: "1.4rem" }],
        badge: ["0.7rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};
