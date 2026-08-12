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

export const bookingStatusLabels: Record<string, string> = {
  PENDING: 'Chờ Sale gửi Owner',
  AWAITING_OWNER: 'Chờ Owner xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã check-in',
  CHECKED_OUT: 'Đã check-out',
  CANCELLED: 'Đã hủy',
  available: 'Trống',
  confirmed: 'Đã book',
  selected: 'Đã chọn',
};
