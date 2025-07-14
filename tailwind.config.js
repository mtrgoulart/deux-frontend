/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // 1. Defina os passos da sua animação aqui
      keyframes: {
        'fade-in': {
          // 'from' ou '0%' é o estado inicial
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)'
          },
          // 'to' ou '100%' é o estado final
          '100%': {
            opacity: '1',
            transform: 'scale(1)'
          },
        }
      },
      // 2. Associe os keyframes a uma nova classe de animação
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
      }
    },
  },
  plugins: [],
};