import { colors } from './design-tokens';

export const bookingStatusColors = {
  available: {
    bg: colors.surface,
    text: colors.textSecondary,
    border: colors.border,
  },
  hold: {
    bg: colors.warningSoft,
    text: colors.warning,
    border: '#E8D9C0',
  },
  confirmed: {
    bg: colors.primarySoft,
    text: colors.primaryDark,
    border: '#D5E0D6',
  },
  selected: {
    bg: colors.primary,
    text: '#FFFFFF',
    border: colors.primaryDark,
  },
  depositPending: {
    bg: colors.warningSoft,
    text: colors.warning,
    border: '#E8D9C0',
  },
  blocked: {
    bg: colors.surfaceMuted,
    text: colors.textMuted,
    border: colors.border,
  },
  maintenance: {
    bg: colors.dangerSoft,
    text: colors.danger,
    border: '#E8D0D0',
  },
  cancelled: {
    bg: colors.surfaceMuted,
    text: colors.textMuted,
    border: colors.border,
  },
} as const;

export type BookingStatusKey = keyof typeof bookingStatusColors;

export const bookingStatusKeys = [
  'PENDING',
  'AWAITING_OWNER',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'available',
  'confirmed',
  'selected',
] as const;

export type BookingStatusLabelKey = typeof bookingStatusKeys[number];
