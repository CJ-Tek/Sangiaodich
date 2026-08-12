import { bookingStatusColors } from '@/config/booking-status';

export function adminAssetStatusTone(status: string) {
  if (status === 'ACTIVE') return bookingStatusColors.confirmed;
  if (status === 'PENDING_REVIEW') return bookingStatusColors.hold;
  return bookingStatusColors.blocked;
}
