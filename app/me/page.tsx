import { redirect } from 'next/navigation';
import { Stack } from '@mantine/core';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { GuestLifetimeStats } from '@/components/me/GuestLifetimeStats';
import { GuestTierCard } from '@/components/me/GuestTierCard';
import { GuestUpcomingCard } from '@/components/me/GuestUpcomingCard';
import { loadGuestOverview } from '@/lib/engines/guest-overview';

export default async function GuestHomePage() {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login?next=/me');
  if (profile.role === 'SALE') redirect('/sale');
  if (profile.role === 'OWNER') redirect('/owner');
  if (profile.role === 'ADMIN') redirect('/admin');

  const overview = await loadGuestOverview(profile.id);

  return (
    <>
      <PageHeader
        title={`Xin chào ${profile.full_name || 'bạn'}`}
        description="Tổng quan booking và hạng thành viên của bạn."
      />
      <Stack gap="md">
        <GuestLifetimeStats
          lifetimeBooks={overview.lifetimeBooks}
          lifetimeGmv={overview.lifetimeGmv}
        />
        <GuestUpcomingCard upcoming={overview.upcoming} />
        <GuestTierCard tier={overview.tier} />
      </Stack>
    </>
  );
}
