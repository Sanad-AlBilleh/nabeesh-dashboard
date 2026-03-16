/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        'bg-primary': '#09090b',
        'bg-secondary': '#18181b',
        'bg-tertiary': '#27272a',
        'border-color': '#3f3f46',
        'text-primary': '#fafafa',
        'text-secondary': '#a1a1aa',
        'text-muted': '#71717a',
        'accent': '#818cf8',
        'accent-hover': '#6366f1',
        'success': '#34d399',
        'warning': '#fbbf24',
        'danger': '#f87171',
        'info': '#60a5fa',
      },
    },
  },
  plugins: [],
}
