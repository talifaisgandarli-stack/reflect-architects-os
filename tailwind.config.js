/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Attio-inspired cool neutral design system
        'bg-base': '#F2F3F7',
        'bg-surface': '#FFFFFF',
        'sidebar-bg': '#1A1D23',
        'sidebar-inactive': '#8B8FA8',
        'sidebar-active': '#FFFFFF',
        'border-base': '#E8E9ED',
        'text-primary': '#0F1117',
        'text-muted': '#6B7280',
        'accent': '#4F6BFB',
        'accent-hover': '#3D56E8',
        'income': '#16A34A',
        'expense': '#DC2626',
        'warning': '#D97706',
        'dot-color': '#D1D5E0',
        // Semantic aliases (backward-compat for existing components)
        brand: {
          dark: '#0F1117',
          mid: '#4F6BFB',
          bg: '#F2F3F7',
          card: '#FFFFFF',
          border: '#E8E9ED',
          text: '#0F1117',
          muted: '#6B7280',
          success: '#16A34A',
          danger: '#DC2626',
          warning: '#D97706',
          info: '#4F6BFB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'panel': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'panel': '0 4px 24px rgba(0,0,0,0.06)',
        'dropdown': '0 4px 16px rgba(0,0,0,0.08)',
        'slide-panel': '-8px 0 32px rgba(0,0,0,0.08)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'ease-out-custom': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        'fade-in': 'fade-in 200ms ease',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-down': 'slide-in-down 150ms ease',
        'toast-in': 'toast-in 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
