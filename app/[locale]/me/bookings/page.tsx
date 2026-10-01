import { getTranslations } from 'next-intl/server';
import { localeRedirect } from '@/lib/i18n/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { GuestBookingsList } from '@/components/me/GuestBookingsList';
import { loadGuestBookings } from '@/lib/engines/guest-bookings';

export default async function MyBookingsPage() {
  const t = await getTranslations('guest.bookings');
  const profile = await getSessionProfile();
  if (!profile) return await localeRedirect('/login?next=/me/bookings');
  if (profile.role === 'SALE') return await localeRedirect('/sale/bookings');

  const bookings = await loadGuestBookings(profile.id);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <GuestBookingsList rows={bookings} />
    </>
  );
}
