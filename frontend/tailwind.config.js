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
        // Paleta Institucional - Universidad de Caldas
        // Estos colores coinciden exactamente con constants/Colors.ts
        
        // Colores Institucionales
        "uc-blue": "#0d2852",
        "uc-blue-dark": "#091d3d",
        "uc-blue-light": "#1a3d73",
        "uc-gold": "#c8ae7a",
        "uc-gold-dark": "#a8904f",
        "uc-gold-light": "#ddc99a",
        
        // Semánticos (Light Mode)
        primary: "#0d2852",           // UC Blue
        "primary-container": "#1a3d73", // UC Blue Light
        "on-primary": "#ffffff",
        "on-primary-container": "#091d3d",
        
        accent: "#c8ae7a",            // UC Gold
        "accent-dark": "#a8904f",
        "accent-light": "#ddc99a",
        
        secondary: "#6c757d",         // Gray 600 (neutro)
        "secondary-container": "#e9ecef", // Gray 200
        "on-secondary": "#ffffff",
        "on-secondary-container": "#212529",
        
        // Estados
        error: "#dc3545",
        "error-light": "#fff5f5",
        success: "#198754",
        "success-light": "#f0fff4",
        
        // Fondo y superficie
        background: "#f8f9fa",        // Gray 50
        surface: "#ffffff",
        "surface-elevated": "#ffffff",
        "on-background": "#212529",   // Gray 900
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
