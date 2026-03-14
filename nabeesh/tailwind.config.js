/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1a93ac',
          50:  '#e8f6f9',
          100: '#c5eaf1',
          200: '#8dd4e3',
          300: '#4dbdd4',
          400: '#1a93ac',
          500: '#147a90',
          600: '#0f6274',
          700: '#0b4e5d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
