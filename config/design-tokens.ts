export const colors = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F0',
  surfaceElevated: '#FFFFFF',
  border: '#E8E8E2',
  borderStrong: '#DCDDD6',

  textPrimary: '#161616',
  textSecondary: '#5F625D',
  /** ≥ 4.5:1 on background, surface and surfaceMuted (WCAG AA body text). */
  textMuted: '#6B6E68',

  primary: '#10A18E',
  primaryDark: '#0D8777',
  primarySoft: '#ECF7F6',

  success: '#5B7A62',
  successSoft: '#EAF0E8',

  warning: '#A67C3D',
  warningSoft: '#F5EDE0',
  /** `warning` darkened for body text (≥ 4.5:1 on white). */
  warningText: '#8A6428',

  danger: '#A65D5D',
  dangerSoft: '#F5E8E8',

  info: '#6B7280',
  infoSoft: '#F3F3EF',
} as const;

export const fonts = {
  sans: 'var(--font-sans), "Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  mono: 'var(--font-mono), "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const typography = {
  display: {
    fontSize: 'clamp(2rem, 4vw, 2.75rem)',
    lineHeight: 1.12,
    letterSpacing: '-0.03em',
    fontWeight: 700,
  },
  title: {
    fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)',
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
    fontWeight: 700,
  },
  /** In-app block heading under the page title (h2). */
  section: {
    fontSize: '1.125rem',
    lineHeight: 1.35,
    letterSpacing: '-0.015em',
    fontWeight: 600,
  },
  /** Heading inside a card or list item (h3). */
  cardTitle: {
    fontSize: '1rem',
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
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
  sectionY: 96,
  sectionYLarge: 120,
} as const;

/** Tinted shadows — single light source from above */
export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(16, 161, 142, 0.04)',
  card: '0 1px 3px rgba(22, 22, 22, 0.04), 0 1px 2px rgba(16, 161, 142, 0.03)',
  cardHover:
    '0 8px 24px rgba(22, 22, 22, 0.06), 0 2px 8px rgba(16, 161, 142, 0.05)',
  dropdown:
    '0 12px 32px rgba(22, 22, 22, 0.08), 0 4px 12px rgba(16, 161, 142, 0.04)',
  float:
    '0 16px 40px rgba(22, 22, 22, 0.08), 0 6px 16px rgba(16, 161, 142, 0.05)',
  modal:
    '0 24px 48px rgba(22, 22, 22, 0.12), 0 8px 24px rgba(16, 161, 142, 0.06)',
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
  /** Role dashboards (beside the 228px sidebar). */
  appContentMax: 1120,
  proseMax: 42,
} as const;
