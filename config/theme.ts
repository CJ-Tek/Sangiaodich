'use client';

import { createTheme, MantineColorsTuple } from '@mantine/core';
import { colors, radius, shadows } from './design-tokens';

const primary: MantineColorsTuple = [
  colors.primarySoft,
  '#D5E0D6',
  '#B8C9BA',
  '#9BB29F',
  '#7E9A83',
  colors.primary,
  colors.primaryDark,
  '#2E3D32',
  '#1F2A23',
  '#141C17',
];

export const theme = createTheme({
  primaryColor: 'vbnbGreen',
  colors: {
    vbnbGreen: primary,
  },
  fontFamily: 'Montserrat, system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily: 'Montserrat, system-ui, -apple-system, sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  radius: {
    xs: `${radius.sm}`,
    sm: `${radius.md}`,
    md: `${radius.lg}`,
    lg: `${radius.xl}`,
    xl: `${radius.xl}`,
  },
  shadows: {
    xs: shadows.card,
    sm: shadows.card,
    md: shadows.cardHover,
    lg: shadows.float,
    xl: shadows.modal,
  },
  other: {
    background: colors.background,
    surface: colors.surface,
    surfaceMuted: colors.surfaceMuted,
    border: colors.border,
    borderStrong: colors.borderStrong,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
    primarySoft: colors.primarySoft,
  },
  components: {
    Button: {
      defaultProps: { radius: radius.sm },
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },
    Card: {
      defaultProps: { radius: radius.lg, shadow: 'none', padding: 'lg' },
      styles: {
        root: {
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
        },
      },
    },
    Paper: {
      defaultProps: { radius: radius.lg, shadow: 'none' },
      styles: {
        root: {
          backgroundColor: colors.surface,
        },
      },
    },
    TextInput: {
      defaultProps: { radius: radius.md },
    },
    Select: {
      defaultProps: { radius: radius.md },
    },
    NumberInput: {
      defaultProps: { radius: radius.md },
    },
    Textarea: {
      defaultProps: { radius: radius.md },
    },
    Modal: {
      defaultProps: { radius: radius.xl },
    },
    Badge: {
      defaultProps: { radius: radius.sm, size: 'sm' },
      styles: {
        root: {
          fontWeight: 500,
          textTransform: 'none',
        },
      },
    },
    NavLink: {
      styles: {
        root: {
          borderRadius: radius.md,
          fontWeight: 500,
        },
      },
    },
    AppShell: {
      styles: {
        main: {
          backgroundColor: colors.background,
        },
        header: {
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        },
        navbar: {
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.border}`,
        },
      },
    },
    Table: {
      styles: {
        th: {
          color: colors.textSecondary,
          fontWeight: 500,
          fontSize: 13,
        },
        td: {
          fontSize: 14,
        },
      },
    },
  },
});
