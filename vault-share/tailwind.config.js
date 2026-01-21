/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          accent: '#10b981',
          danger: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}