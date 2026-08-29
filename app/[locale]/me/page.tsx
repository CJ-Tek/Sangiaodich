import { getTranslations } from 'next-intl/server';
import { localeRedirect } from '@/lib/i18n/navigation';
import { Stack } from '@mantine/core';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { GuestLifetimeStats } from '@/components/me/GuestLifetimeStats';
import { GuestTierCard } from '@/components/me/GuestTierCard';
import { GuestUpcomingCard } from '@/components/me/GuestUpcomingCard';
import { loadGuestOverview } from '@/lib/engines/guest-overview';

export default async function GuestHomePage() {
  const t = await getTranslations('guest.home');
  const profile = await getSessionProfile();
  if (!profile) return await localeRedirect('/login?next=/me');
  if (profile.role === 'SALE') return await localeRedirect('/sale');
  if (profile.role === 'OWNER') return await localeRedirect('/owner');
  if (profile.role === 'ADMIN') return await localeRedirect('/admin');

  const overview = await loadGuestOverview(profile.id);
  const name = profile.full_name || t('greetingFallback');

  return (
    <>
      <PageHeader
        title={t('greeting', { name })}
        description={t('description')}
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
