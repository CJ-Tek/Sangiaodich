'use client';

import {
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core';
import { colors, fonts, motion, radius, shadows } from './design-tokens';

const primary: MantineColorsTuple = [
  colors.primarySoft,
  '#D4EEEB',
  '#A9DDD6',
  '#7ECCC2',
  '#53BBAE',
  '#2DAC9C',
  colors.primary,
  colors.primaryDark,
  '#0B6D61',
  '#08544A',
];

const transition = `${motion.normal}ms ${motion.easing}`;

/** Mantine's default dimmed gray (#868e96) is ~3.2:1 — below WCAG AA for body text. */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-dimmed': colors.textMuted,
  },
  dark: {},
});

export const theme = createTheme({
  primaryColor: 'vbnbGreen',
  colors: {
    vbnbGreen: primary,
  },
  fontFamily: fonts.sans,
  fontFamilyMonospace: fonts.mono,
  headings: {
    fontFamily: fonts.sans,
    fontWeight: '600',
  },
  defaultRadius: 'md',
  radius: {
    xs: `${radius.sm}px`,
    sm: `${radius.md}px`,
    md: `${radius.lg}px`,
    lg: `${radius.xl}px`,
    xl: `${radius['2xl']}px`,
  },
  shadows: {
    xs: shadows.xs,
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
          fontWeight: 600,
          transition: `transform ${transition}, box-shadow ${transition}, background-color ${transition}`,
          '&:hover:not(:disabled)': {
            transform: motion.hoverLift,
          },
          '&:active:not(:disabled)': {
            transform: motion.activePress,
          },
        },
      },
    },
    Card: {
      defaultProps: { radius: radius.lg, shadow: 'sm', padding: 'lg' },
      styles: {
        root: {
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          transition: `box-shadow ${transition}, border-color ${transition}`,
          '&:hover': {
            boxShadow: shadows.cardHover,
          },
        },
      },
    },
    Paper: {
      defaultProps: { radius: radius.lg, shadow: 'xs' },
      styles: {
        root: {
          backgroundColor: colors.surface,
        },
      },
    },
    TextInput: {
      defaultProps: { radius: radius.md },
      styles: {
        input: {
          transition: `border-color ${transition}, box-shadow ${transition}`,
        },
      },
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
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.01em',
        },
      },
    },
    NavLink: {
      styles: {
        root: {
          borderRadius: radius.md,
          fontWeight: 500,
          transition: `background-color ${transition}, color ${transition}`,
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
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        },
        td: {
          fontSize: 14,
        },
      },
    },
    Alert: {
      styles: {
        root: {
          borderRadius: radius.lg,
        },
      },
    },
  },
});
