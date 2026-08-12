export const colors = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F0',
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

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 16,
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
} as const;

export const shadows = {
  none: 'none',
  card: '0 1px 2px rgba(22, 22, 22, 0.04)',
  cardHover: '0 4px 16px rgba(22, 22, 22, 0.06)',
  dropdown: '0 8px 24px rgba(22, 22, 22, 0.08)',
  float: '0 8px 30px rgba(22, 22, 22, 0.08)',
  modal: '0 12px 40px rgba(22, 22, 22, 0.1)',
} as const;

export const motion = {
  fast: 150,
  normal: 200,
  slow: 250,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;
