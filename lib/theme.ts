/**
 * Wavelength Game Theme Configuration
 * 
 * Central theme management for consistent styling across the application.
 * This file defines all design tokens used throughout the game.
 */

export const theme = {
  // Primary Color Palette
  colors: {
    psychic: {
      primary: '#ec4899',     // fuchsia-500
      light: '#f9a8d4',       // fuchsia-300
      dark: '#be185d',        // fuchsia-700
      shadow: 'rgba(236, 72, 153, 0.3)',
    },
    player: {
      primary: '#14b8a6',     // teal-500
      light: '#5eead4',       // teal-300
      dark: '#0f766e',        // teal-700
      shadow: 'rgba(20, 184, 166, 0.3)',
    },
    accent: {
      primary: '#eab308',     // yellow-500
      light: '#fde047',       // yellow-300
      dark: '#a16207',        // yellow-700
    },
    danger: {
      primary: '#ef4444',     // red-500
      light: '#fca5a5',       // red-300
      dark: '#b91c1c',        // red-700
    },
    success: {
      primary: '#10b981',     // green-500
      light: '#6ee7b7',       // green-300
      dark: '#047857',        // green-700
    },
    info: {
      primary: '#3b82f6',     // blue-500
      light: '#93c5fd',       // blue-300
      dark: '#1e40af',        // blue-700
    },
    purple: {
      primary: '#a855f7',     // purple-500
      light: '#d8b4fe',       // purple-300
      dark: '#7e22ce',        // purple-700
    },
  },

  // Background Colors
  backgrounds: {
    primary: '#09090b',       // zinc-950
    secondary: '#18181b',     // zinc-900
    tertiary: '#27272a',      // zinc-800
    hover: '#3f3f46',         // zinc-700
  },

  // Border Colors
  borders: {
    primary: '#27272a',       // zinc-800
    secondary: '#3f3f46',     // zinc-700
    accent: '#52525b',        // zinc-600
  },

  // Text Colors
  text: {
    primary: '#ffffff',       // white
    secondary: '#e4e4e7',     // zinc-200
    tertiary: '#a1a1aa',      // zinc-400
    muted: '#71717a',         // zinc-500
    disabled: '#52525b',      // zinc-600
  },

  // Dial Scoring Gradient Colors
  dial: {
    empty: '#3f3f46',         // zinc-700 - no points
    close: '#06b6d4',         // cyan-500 - 1 point
    good: '#eab308',          // yellow-500 - 2 points
    great: '#f97316',         // orange-500 - 3 points
    perfect: '#ef4444',       // red-500 - 4 points
  },

  // Spacing
  spacing: {
    card: '2rem',
    cornerAccent: '4rem',
  },

  // Border Widths
  borderWidth: {
    card: '2px',
    thick: '3px',
  },

  // Animation Durations
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
} as const;

/**
 * Tailwind class utilities for consistent styling
 */
export const themeClasses = {
  // Screens
  screen: 'min-h-screen bg-zinc-950 relative overflow-hidden',
  
  // Cards
  card: {
    base: 'bg-zinc-900 border-2 p-8 transition-all duration-300',
    psychic: 'border-fuchsia-600 shadow-[0_0_30px_rgba(236,72,153,0.2)]',
    player: 'border-teal-600 shadow-[0_0_30px_rgba(20,184,166,0.2)]',
    hover: 'hover:transform hover:scale-105',
  },

  // Headers
  header: {
    container: 'bg-zinc-900 border-b-2 border-zinc-700 px-6 py-4',
    title: 'text-xl font-bold text-white tracking-wider uppercase',
    subtitle: 'text-fuchsia-400 font-medium tracking-wide',
  },

  // Buttons
  button: {
    base: 'w-full py-4 px-6 text-xl font-bold uppercase tracking-widest transition-all duration-300',
    primary: 'bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 border-2 border-fuchsia-500 text-white hover:from-fuchsia-500 hover:to-fuchsia-600',
    secondary: 'border-2 border-teal-600 text-teal-400 hover:border-teal-500 hover:bg-teal-950',
    disabled: 'opacity-50 cursor-not-allowed',
  },

  // Inputs
  input: {
    base: 'w-full px-6 py-4 text-xl font-medium text-white bg-zinc-900 border-2 transition-all duration-300 focus:outline-none',
    focused: 'border-fuchsia-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]',
    default: 'border-zinc-700',
  },

  // Text Styles
  text: {
    title: 'text-3xl lg:text-4xl font-bold text-white tracking-widest uppercase',
    subtitle: 'text-xl lg:text-2xl font-bold tracking-wider uppercase',
    body: 'text-lg text-zinc-300 font-medium',
    muted: 'text-sm text-zinc-400',
    psychic: 'text-fuchsia-500 font-bold',
    player: 'text-teal-400 font-bold',
    accent: 'text-yellow-400 font-bold',
  },

  // Geometric Background
  geometricBg: 'absolute inset-0 opacity-10',

  // Corner Accents
  cornerAccent: {
    base: 'absolute w-16 h-16 border-2 opacity-30',
    topLeft: 'top-0 left-0 border-r-2 border-b-2',
    topRight: 'top-0 right-0 border-l-2 border-b-2',
    bottomLeft: 'bottom-0 left-0 border-r-2 border-t-2',
    bottomRight: 'bottom-0 right-0 border-l-2 border-t-2',
    psychic: 'border-fuchsia-500',
    player: 'border-teal-400',
  },

  // Status Indicators
  status: {
    waiting: 'text-teal-400 text-sm font-medium tracking-wide uppercase flex items-center space-x-2',
    loading: 'text-yellow-400 text-sm font-medium tracking-wide uppercase flex items-center space-x-2',
    pulse: 'w-2 h-2 rounded-full animate-pulse',
  },
} as const;

/**
 * Generate dial gradient for scoring visualization
 */
export function createDialGradient(targetPosition: number): string {
  const targetAngle = targetPosition * 1.8 - 90;
  
  console.log(
    "[createDialGradient] Input targetPosition:",
    targetPosition,
    "Calculated targetAngle:",
    targetAngle
  );
  
  return `conic-gradient(
    from -90deg at 50% 100%,
    ${theme.dial.empty} 0deg ${targetAngle - 22.5 + 90}deg,
    ${theme.dial.close} ${targetAngle - 22.5 + 90}deg ${targetAngle - 13.5 + 90}deg,
    ${theme.dial.good} ${targetAngle - 13.5 + 90}deg ${targetAngle - 4.5 + 90}deg,
    ${theme.dial.great} ${targetAngle - 4.5 + 90}deg ${targetAngle + 4.5 + 90}deg,
    ${theme.dial.perfect} ${targetAngle + 4.5 + 90}deg ${targetAngle + 13.5 + 90}deg,
    ${theme.dial.great} ${targetAngle + 13.5 + 90}deg ${targetAngle + 22.5 + 90}deg,
    ${theme.dial.empty} ${targetAngle + 22.5 + 90}deg 180deg
  )`;
}

/**
 * Calculate points based on distance from target
 */
export function calculatePoints(distance: number): number {
  if (distance <= 5) return 4;  // Perfect
  if (distance <= 10) return 3; // Great
  if (distance <= 20) return 2; // Good
  if (distance <= 30) return 1; // Close
  return 0;                     // No points
}

/**
 * Get border color class based on rank/position
 */
export function getRankBorderColor(index: number): string {
  const colors = [
    'border-fuchsia-500',
    'border-blue-500',
    'border-green-500',
    'border-purple-500',
  ];
  return colors[index % colors.length];
}

/**
 * Get player indicator color based on index
 */
export function getPlayerColor(index: number): string {
  const colors = [
    'rgb(236, 72, 153)',  // fuchsia
    'rgb(59, 130, 246)',  // blue
    'rgb(34, 197, 94)',   // green
    'rgb(168, 85, 247)',  // purple
  ];
  return colors[index % colors.length];
}
