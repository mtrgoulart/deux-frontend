/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--bg-surface)',
          raised: 'var(--bg-surface-raised)',
          primary: 'var(--bg-primary)',
          overlay: 'var(--bg-overlay)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
          accent: 'var(--border-accent)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--text-accent)',
        },
        success: {
          DEFAULT: 'var(--success)',
          muted: 'var(--success-muted)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          muted: 'var(--danger-muted)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          muted: 'var(--warning-muted)',
        },
      },
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
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        'float-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-40px, 30px) scale(0.9)' },
          '66%': { transform: 'translate(20px, -40px) scale(1.1)' },
        },
        'float-3': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(25px, 25px) rotate(180deg)' },
        },
        'logo-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
        },
        'slide-in-scale': {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'particle-rise': {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh)', opacity: '0' },
        },
        'nav-item-in': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'glow-success': 'glow-success 2s ease-in-out forwards',
        'glitch-out': 'glitch-out 0.7s ease-in-out forwards',
        'slide-up': 'slide-up 0.5s ease-out',
        'float-1': 'float-1 20s ease-in-out infinite',
        'float-2': 'float-2 25s ease-in-out infinite',
        'float-3': 'float-3 30s ease-in-out infinite',
        'logo-pulse': 'logo-pulse 3s ease-in-out infinite',
        'slide-in-scale': 'slide-in-scale 0.6s ease-out',
        'particle-rise': 'particle-rise 15s linear infinite',
        'nav-item-in': 'nav-item-in 0.25s ease-out forwards',
      }
    },
  },
  plugins: [],
};
