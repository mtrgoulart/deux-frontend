/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glow-success': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(74, 222, 128, 0.2)' },
          '50%': { boxShadow: '0 0 20px 5px rgba(74, 222, 128, 0.7)' },
        },
        'glitch-out': {
          '0%': { transform: 'translate(0)', opacity: '1' },
          '20%': { transform: 'translate(-3px, 3px)', opacity: '1' },
          '40%': { transform: 'translate(3px, -3px)', opacity: '1', filter: 'hue-rotate(90deg)' },
          '60%': { transform: 'translate(-3px, -3px)', opacity: '1' },
          '80%': { transform: 'translate(3px, 3px)', opacity: '1', filter: 'none' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'glow-success': 'glow-success 2s ease-in-out forwards',
        'glitch-out': 'glitch-out 0.7s ease-in-out forwards',
      }
    },
  },
  plugins: [],
};