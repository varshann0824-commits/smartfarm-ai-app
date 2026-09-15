/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Deep agricultural ink — grounds the palette so green is an accent, not a flood
        ink: {
          50: '#f6f7f6',
          100: '#e7e9e7',
          200: '#cdd2cf',
          300: '#a8b1ab',
          400: '#7f8b83',
          500: '#5f6b63',
          600: '#4a544d',
          700: '#3c443f',
          800: '#2c332e',
          900: '#1d231f',
          950: '#121714',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,23,20,0.04), 0 4px 16px -4px rgba(18,23,20,0.08)',
        lift: '0 2px 4px rgba(18,23,20,0.05), 0 16px 32px -12px rgba(18,23,20,0.18)',
        hero: '0 24px 64px -24px rgba(18,23,20,0.45)',
        glow: '0 0 0 1px rgba(22,163,74,0.18), 0 8px 32px -8px rgba(22,163,74,0.35)',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translateX(-12%)' },
          '100%': { transform: 'translateX(112%)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-1.2deg)' },
          '50%': { transform: 'rotate(1.2deg)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.045)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'drift-slow': 'drift 46s linear infinite',
        'drift-slower': 'drift 78s linear infinite',
        sway: 'sway 7s ease-in-out infinite',
        breathe: 'breathe 4.2s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
};
