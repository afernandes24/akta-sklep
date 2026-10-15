import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0c0b0a',
          900: '#141210',
          800: '#1c1a17',
          700: '#2a2723',
          600: '#3b3731',
        },
        paper: {
          50: '#f7f1e3',
          100: '#efe5cd',
          200: '#e4d5b3',
          300: '#d2bd8f',
          400: '#b89f6c',
        },
        brass: {
          300: '#e2c689',
          400: '#d4b06a',
          500: '#c29a4f',
          600: '#a07d3a',
        },
        stamp: {
          500: '#b23a30',
          600: '#962f27',
        },
        muted: '#a79f92',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', '"Courier New"', 'Courier', 'monospace'],
      },
      boxShadow: {
        paper: '0 1px 0 rgba(255,255,255,.35) inset, 0 18px 40px -18px rgba(0,0,0,.7)',
      },
    },
  },
  plugins: [],
} satisfies Config;
