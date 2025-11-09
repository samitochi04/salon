/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'rb-cream': '#f7f1eb',
        'rb-gold': '#d6a77a',
        'rb-brown': '#4b3621',
        'rb-pink': '#f5d0c5',
        'rb-sage': '#d7e3d4',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
