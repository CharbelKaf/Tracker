// Central design tokens shared across the app. Keep this file in sync with `tailwind.config.js`.
// These tokens can be consumed directly from TypeScript modules or via the CSS custom properties
// declared in `index.css` (see `@layer base`).

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export const primaryPalette: ColorScale = {
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
};

export const secondaryPalette: ColorScale = {
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
};

export const statusPalettes: Record<'success' | 'warning' | 'danger' | 'info' | 'action', ColorScale> = {
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  action: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
};

export const radii = {
  badge: '9999px',
  card: '0.75rem',
  modal: '1rem',
  button: '0.5rem', // matches rounded-lg used across buttons
};

export const elevations = {
  elev1: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  elev2: '0 4px 8px -2px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  elev3: '0 12px 20px -6px rgb(0 0 0 / 0.2), 0 6px 12px -6px rgb(0 0 0 / 0.2)',
};

export const spacing = {
  13: '3.25rem',
  15: '3.75rem',
  18: '4.5rem',
  22: '5.5rem',
  30: '7.5rem',
};

export const animations = {
  slideUp: 'slide-up .3s ease-out',
  fadeIn: 'fade-in .3s ease-out forwards',
  shakeAndFadeOut: 'shake-and-fade-out .5s ease-in-out forwards',
  toastIn: 'toast-in .5s cubic-bezier(0.21, 1.02, 0.73, 1) forwards',
  toastOut: 'toast-out .5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
  progress: 'progress 3s linear forwards',
  shake: 'shake .82s cubic-bezier(.36,.07,.19,.97) both',
  bump: 'bump .2s ease-out',
  fabMenuIn: 'fab-menu-in .15s ease-out forwards',
  blob: 'blob 20s ease-in-out infinite',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
};

export const fontFamilies = {
  sans: "Inter, ui-sans-serif, system-ui, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
};

export const designTokens = {
  colors: {
    primary: primaryPalette,
    secondary: secondaryPalette,
    status: statusPalettes,
  },
  radii,
  elevations,
  spacing,
  animations,
  fontFamilies,
};

export type DesignTokens = typeof designTokens;
