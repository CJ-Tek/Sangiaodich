import type { useTranslations } from 'next-intl';
import {
  bookingStatusKeys,
  type BookingStatusLabelKey,
} from '@/config/booking-status';

type BookingStatusTranslator = ReturnType<
  typeof useTranslations<'bookingStatus'>
>;

function isBookingStatusKey(status: string): status is BookingStatusLabelKey {
  return (bookingStatusKeys as readonly string[]).includes(status);
}

export function getBookingStatusLabel(
  status: string,
  t: BookingStatusTranslator
): string {
  if (isBookingStatusKey(status)) {
    return t(status);
  }
  return status;
}
