/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    // Breakpoints standards (Tailwind defaults)
    // sm: 640px  - Micro-ajustements (rarement utilisé)
    // md: 768px  - Mobile → Tablet (layouts 1→2 colonnes)
    // lg: 1024px - Tablet → Desktop (Sidebar/MobileNav switch, layouts 2→3 colonnes)
    // xl: 1280px - Desktop large
    // 2xl: 1536px - Extra large
    //
    // Usage dans Neemba Tracker:
    // - Navigation: lg:hidden (MobileNav), hidden lg:flex (Sidebar)
    // - FloatingActionButton: lg:hidden (mobile uniquement)
    // - Grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
    // - Layouts: flex-col lg:flex-row
    extend: {
      colors: {
        primary: {
          50: '#fff9e0',
          100: '#fff4c2',
          200: '#ffe985',
          300: '#ffde47',
          400: '#ffd324',
          500: '#ffca18',
          600: '#f0be15',
          700: '#d6a812',
          800: '#bb9210',
          900: '#a07d0d',
        },
        secondary: {
          50: '#f4f7fb',
          100: '#e8edf5',
          200: '#d5ddeb',
          300: '#b1c2d7',
          400: '#8ba4c2',
          500: '#6e87a7',
          600: '#586c89',
          700: '#47586f',
          800: '#394657',
          900: '#27313d',
        },
        status: {
          success: { // green
            50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
            500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d'
          },
          warning: { // yellow
            50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15',
            500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e', 900: '#713f12'
          },
          danger: { // red
            50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171',
            500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d'
          },
          info: { // blue
            50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
            500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a'
          },
          action: { // orange
            50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
            500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12'
          }
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'],
      },
      borderRadius: {
        badge: '9999px', // fully rounded pills
        card: '0.75rem', // 12px
        modal: '1rem',   // 16px
      },
      boxShadow: {
        'elev-1': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'elev-2': '0 4px 8px -2px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elev-3': '0 12px 20px -6px rgb(0 0 0 / 0.2), 0 6px 12px -6px rgb(0 0 0 / 0.2)',
      },
      spacing: {
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'shake-and-fade-out': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
          '100%': { transform: 'translateX(0) scale(0.95)', opacity: '0' },
        },
        'toast-in': {
          from: { transform: 'translateY(calc(100% + 1rem))', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'toast-out': {
          from: { transform: 'translateY(0)', opacity: '1' },
          to: { transform: 'translateY(calc(100% + 1rem))', opacity: '0' },
        },
        progress: {
          from: { width: '100%' },
          to: { width: '0%' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-1px)' },
          '20%, 80%': { transform: 'translateX(2px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' },
        },
        bump: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'fab-menu-in': {
          from: { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(100px, -80px) scale(1.1)' },
          '66%': { transform: 'translate(-80px, 50px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        pulse: {
          '50%': { opacity: '.6' },
        },
      },
      animation: {
        'slide-up': 'slide-up .3s ease-out',
        'fade-in': 'fade-in .3s ease-out forwards',
        'shake-and-fade-out': 'shake-and-fade-out .5s ease-in-out forwards',
        'toast-in': 'toast-in .5s cubic-bezier(0.21, 1.02, 0.73, 1) forwards',
        'toast-out': 'toast-out .5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        progress: 'progress 3s linear forwards',
        shake: 'shake .82s cubic-bezier(.36,.07,.19,.97) both',
        bump: 'bump .2s ease-out',
        'fab-menu-in': 'fab-menu-in .15s ease-out forwards',
        blob: 'blob 20s ease-in-out infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
