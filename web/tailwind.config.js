/** @type {import('tailwindcss').Config} */
import { getTailwindTokens } from "@uniconnect/shared-ui";

const tokens = getTailwindTokens();

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      ...tokens,
    },
  },
  plugins: [],
}
