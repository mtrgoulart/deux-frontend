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
