/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#02040a',
          900: '#060a1e',
          800: '#0a0e27',
          700: '#0f1638',
        },
        cyan: {
          400: '#00d4ff',
          500: '#00b8e6',
        },
        purple: {
          500: '#7b2ff7',
          600: '#6a26d9',
        },
        pink: {
          400: '#ff6fd8',
        },
        gold: {
          400: '#ffd700',
          500: '#e6c200',
        },
        orange: {
          500: '#ff8c00',
          600: '#e67e00',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 10px #00d4ff, 0 0 20px #00d4ff' },
          'to': { boxShadow: '0 0 20px #00d4ff, 0 0 30px #00d4ff' },
        },
      }
    },
  },
  plugins: [],
}
