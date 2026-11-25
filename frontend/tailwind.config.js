/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: "#0d9488", // Soft calming teal - eye-friendly & pleasant
        primaryHover: "#0f766e",
        primaryLight: "#f0fdfa",
        secondary: "#d97706", // Soft warm amber
      },
      boxShadow: {
        'card': '0 2px 10px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(13, 148, 136, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
