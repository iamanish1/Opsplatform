/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        secondary: {
          DEFAULT: '#06b6d4',
          50: '#f0fdfa',
          100: '#ecfeff',
          200: '#cffafe',
          300: '#a5f3fc',
          400: '#67e8f9',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        accent: {
          DEFAULT: '#f59e0b',
          yellow: '#f59e0b',
          green: '#10b981',
          red: '#ef4444',
        },
        dark: {
          DEFAULT: '#0a0f0d',
          lighter: '#0a1a0f',
          light: '#1e1e1e',
          medium: '#2d2d2d',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #10b981, #06b6d4)',
        'gradient-dark': 'linear-gradient(135deg, #0a0f0d 0%, #0a1a0f 50%, #0a0f0d 100%)',
      },
      animation: {
        'float': 'float 20s infinite ease-in-out',
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
        mono: ['Courier New', 'Monaco', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
