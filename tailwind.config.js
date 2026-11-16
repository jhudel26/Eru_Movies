/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        eru: {
          darkest: '#060b0d',
          bg: '#091316',
          card: '#0f1f23',
          cardHover: '#162d33',
          border: 'rgba(20, 184, 166, 0.2)',
          borderHover: 'rgba(45, 212, 191, 0.5)',
          teal: {
            DEFAULT: '#00e5bc',
            hover: '#14f4c9',
            dark: '#009e82',
            glow: 'rgba(0, 229, 188, 0.25)',
          },
          cyan: '#06b6d4',
          accent: '#2dd4bf',
          muted: '#809fa5',
        }
      },
      boxShadow: {
        'teal-glow': '0 0 25px rgba(0, 229, 188, 0.25)',
        'teal-glow-lg': '0 0 45px rgba(0, 229, 188, 0.35)',
      }
    },
  },
  plugins: [],
};
