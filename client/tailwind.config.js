/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./src/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf5f9",
          100: "#fae7f1",
          200: "#f3c9dd",
          300: "#e9a6c6",
          400: "#df7cab",
          500: "#d95d95",
          600: "#cb3f7f",
          700: "#b22d69",
          800: "#8f2656",
          900: "#742149",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'Inter'", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        soft: "0 20px 45px -20px rgba(210, 50, 120, 0.35)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
}

