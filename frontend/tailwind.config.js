/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        luna: {
          bg: '#05050A',
          card: 'rgba(15, 15, 30, 0.65)',
          purple: '#8B5CF6',
          blue: '#3B82F6',
          accent: '#C084FC',
          text: '#F3F4F6',
          textMuted: '#9CA3AF'
        }
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
}
