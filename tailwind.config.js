/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'monospace'],
      },
      colors: {
        'audio': {
          'bg': '#0f172a',
          'panel': '#1e293b',
          'border': '#334155',
          'accent': '#3b82f6',
          'accent-orange': '#f97316',
          'text': '#f1f5f9',
          'text-dim': '#94a3b8',
          'success': '#10b981',
          'warning': '#f59e0b',
          'danger': '#ef4444',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)' },
        }
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
};