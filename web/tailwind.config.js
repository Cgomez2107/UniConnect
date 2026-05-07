/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "uc-blue": "#0d2852",
        "uc-blue-dark": "#091d3d",
        "uc-blue-light": "#1a3d73",
        "uc-gold": "#c8ae7a",
        "uc-gold-dark": "#a8904f",
        "uc-gold-light": "#ddc99a",
      },
    },
  },
  plugins: [],
}
