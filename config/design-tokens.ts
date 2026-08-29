export const colors = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F0',
  surfaceElevated: '#FFFFFF',
  border: '#E8E8E2',
  borderStrong: '#DCDDD6',

  textPrimary: '#161616',
  textSecondary: '#5F625D',
  textMuted: '#8B8D87',

  primary: '#536B58',
  primaryDark: '#3D5142',
  primarySoft: '#EAF0E8',

  success: '#5B7A62',
  successSoft: '#EAF0E8',

  warning: '#A67C3D',
  warningSoft: '#F5EDE0',

  danger: '#A65D5D',
  dangerSoft: '#F5E8E8',

  info: '#6B7280',
  infoSoft: '#F3F3EF',
} as const;

export const fonts = {
  sans: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const typography = {
  display: {
    fontSize: 'clamp(2rem, 4vw, 2.75rem)',
    lineHeight: 1.12,
    letterSpacing: '-0.03em',
    fontWeight: 600,
  },
  title: {
    fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)',
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
    fontWeight: 600,
  },
  subtitle: {
    fontSize: '1.0625rem',
    lineHeight: 1.45,
    letterSpacing: '-0.01em',
    fontWeight: 500,
  },
  body: {
    fontSize: '0.9375rem',
    lineHeight: 1.55,
    letterSpacing: '0',
    fontWeight: 400,
  },
  label: {
    fontSize: '0.6875rem',
    lineHeight: 1.4,
    letterSpacing: '0.08em',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  data: {
    fontSize: '1.75rem',
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums' as const,
  },
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
  sectionY: 56,
  sectionYLarge: 80,
} as const;

/** Tinted shadows — single light source from above */
export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(83, 107, 88, 0.04)',
  card: '0 1px 3px rgba(22, 22, 22, 0.04), 0 1px 2px rgba(83, 107, 88, 0.03)',
  cardHover:
    '0 8px 24px rgba(22, 22, 22, 0.06), 0 2px 8px rgba(83, 107, 88, 0.05)',
  dropdown:
    '0 12px 32px rgba(22, 22, 22, 0.08), 0 4px 12px rgba(83, 107, 88, 0.04)',
  float:
    '0 16px 40px rgba(22, 22, 22, 0.08), 0 6px 16px rgba(83, 107, 88, 0.05)',
  modal:
    '0 24px 48px rgba(22, 22, 22, 0.12), 0 8px 24px rgba(83, 107, 88, 0.06)',
} as const;

export const motion = {
  fast: 150,
  normal: 200,
  slow: 280,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  hoverLift: 'translateY(-1px)',
  activePress: 'translateY(1px) scale(0.99)',
} as const;

export const zIndex = {
  base: 0,
  sticky: 100,
  dropdown: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
} as const;

export const layout = {
  contentMax: 1200,
  contentWide: 1280,
  proseMax: 42,
} as const;
