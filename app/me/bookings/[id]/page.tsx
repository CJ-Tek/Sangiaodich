import { notFound, redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { GuestShell } from '@/components/shells/GuestShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { GuestBookingDetailCard } from '@/components/me/GuestBookingDetailCard';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { loadGuestBookingDetail } from '@/lib/engines/guest-bookings';

export default async function GuestBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getSessionProfile();
  if (!profile) redirect(`/login?next=/me/bookings/${id}`);
  if (profile.role === 'SALE') redirect('/sale/bookings');

  const booking = await loadGuestBookingDetail(profile.id, id);
  if (!booking) notFound();

  return (
    <GuestShell isLoggedIn>
      <PageHeader
        title="Chi tiết booking"
        description={booking.assetTitle}
        action={
          <LinkAnchor href="/me/bookings" size="sm" c="vbnbGreen.6">
            ← Tất cả booking
          </LinkAnchor>
        }
      />
      <GuestBookingDetailCard booking={booking} />
    </GuestShell>
  );
}
