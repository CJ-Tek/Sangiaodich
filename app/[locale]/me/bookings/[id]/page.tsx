import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { localeRedirect } from '@/lib/i18n/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { GuestBookingDetailCard } from '@/components/me/GuestBookingDetailCard';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { loadGuestBookingDetail } from '@/lib/engines/guest-bookings';

export default async function GuestBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations('guest.bookingDetail');
  const { id } = await params;
  const profile = await getSessionProfile();
  if (!profile) return await localeRedirect(`/login?next=/me/bookings/${id}`);
  if (profile.role === 'SALE') return await localeRedirect('/sale/bookings');

  const booking = await loadGuestBookingDetail(profile.id, id);
  if (!booking) notFound();

  return (
    <>
      <PageHeader
        title={t('title')}
        description={booking.assetTitle}
        action={
          <LinkAnchor href="/me/bookings" size="sm" c="vbnbGreen.6">
            {t('backToAll')}
          </LinkAnchor>
        }
      />
      <GuestBookingDetailCard booking={booking} />
    </>
  );
}
