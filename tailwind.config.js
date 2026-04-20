/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',
          mid: '#1e3a5f',
          bg: '#f5f5f0',
          card: '#ffffff',
          border: '#e8e8e4',
          text: '#0f172a',
          muted: '#888888',
          success: '#16a34a',
          danger: '#dc2626',
          warning: '#ca8a04',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
