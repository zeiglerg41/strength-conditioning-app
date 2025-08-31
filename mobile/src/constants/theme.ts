// Dark Theme configuration for the S&C app - Inspired by Supabase
export const theme = {
  colors: {
    // Neon Green - Supabase inspired primary
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#3ECF8E', // Supabase brand green
      500: '#249361', // Supabase gradient green
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    // Neon Purple - Secondary accent
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7', // Main neon purple
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    // Neon Blue - Tertiary accent
    accent: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main neon blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#3ECF8E',
      500: '#249361', // Using Supabase green for success
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Main warning
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Main error
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    // Dark theme neutrals
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
    },
    // Dark semantic colors
    background: '#09090b', // Deep black background
    surface: '#11181c', // Supabase Bunker color for surfaces
    surfaceElevated: '#18181b', // Slightly elevated surfaces
    text: '#fafafa', // Light text
    textSecondary: '#a1a1aa', // Muted text
    textMuted: '#71717a', // Very muted text
    border: '#27272a', // Dark borders
    borderMuted: '#18181b', // Very subtle borders
    overlay: 'rgba(0, 0, 0, 0.8)', // Dark overlay
    // Special neon glow effects
    glow: {
      primary: 'rgba(62, 207, 142, 0.3)', // Green glow
      secondary: 'rgba(168, 85, 247, 0.3)', // Purple glow
      accent: 'rgba(59, 130, 246, 0.3)', // Blue glow
    },
  },
  typography: {
    heading: {
      h1: {
        fontSize: 36,
        fontWeight: '700' as const,
        lineHeight: 40,
        letterSpacing: -0.5,
      },
      h2: {
        fontSize: 30,
        fontWeight: '700' as const,
        lineHeight: 36,
        letterSpacing: -0.25,
      },
      h3: {
        fontSize: 24,
        fontWeight: '600' as const,
        lineHeight: 32,
        letterSpacing: 0,
      },
      h4: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
        letterSpacing: 0,
      },
      h5: {
        fontSize: 18,
        fontWeight: '600' as const,
        lineHeight: 24,
        letterSpacing: 0,
      },
      h6: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
        letterSpacing: 0,
      },
    },
    body: {
      large: {
        fontSize: 18,
        fontWeight: '400' as const,
        lineHeight: 28,
      },
      medium: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
      },
      small: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
      },
      xs: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
      },
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    xxxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 1,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.4,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.7,
      shadowRadius: 16,
      elevation: 5,
    },
    // Neon glow shadows
    neon: {
      primary: {
        shadowColor: '#3ECF8E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
      },
      secondary: {
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
      },
      accent: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
      },
    },
  },
};

export type Theme = typeof theme;