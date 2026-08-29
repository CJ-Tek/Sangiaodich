import { getLocale, getTranslations } from 'next-intl/server';
import { localeRedirect } from '@/lib/i18n/navigation';
import { Stack, Group, SimpleGrid, Alert } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { fetchAllPages } from '@/lib/supabase/query-guard';
import { getSessionProfile } from '@/lib/auth/session';
import { isSimpleUi } from '@/lib/engines/ui-mode';
import { isSubscriptionActive } from '@/lib/engines/subscription';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/LinkButton';
import { StatCard } from '@/components/ui/StatCard';
import { SubscriptionStatusBanner } from '@/components/ui/SubscriptionStatusBanner';
import {
  hasOwnerPayoutInfo,
  mapOwnerPayoutInfo,
} from '@/lib/owner/payout-info';
import { formatVnd } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';

export default async function OwnerDashboard() {
  const t = await getTranslations('owner.home');
  const locale = (await getLocale()) as AppLocale;
  const profile = await getSessionProfile();
  if (isSimpleUi(profile?.uiMode)) return await localeRedirect('/owner/calendar');
  const admin = await createClient();

  const assets = await fetchAllPages((from, to) =>
    admin
      .from('assets')
      .select('id, title, status')
      .eq('owner_id', profile!.id)
      .order('id', { ascending: true })
      .range(from, to)
  );

  const { data: payoutRow } = await admin
    .from('profiles')
    .select(
      'payout_bank_name, payout_account_name, payout_account_number, payout_vietqr_bank, payout_note'
    )
    .eq('id', profile!.id)
    .maybeSingle();
  const payout = mapOwnerPayoutInfo(payoutRow);
  const hasPayout = hasOwnerPayoutInfo(payout);

  const { data: earnings } = await admin
    .rpc('owner_earnings_summary', { p_owner_id: profile!.id })
    .maybeSingle<{ confirmed_bookings: number; owner_earn_total: number }>();

  const confirmedCount = Number(earnings?.confirmed_bookings || 0);
  const pnl = Number(earnings?.owner_earn_total || 0);

  const { data: sub } = await admin
    .from('subscriptions')
    .select('*')
    .eq('profile_id', profile!.id)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  const active = sub
    ? isSubscriptionActive({ status: sub.status, periodEnd: sub.period_end })
    : false;
  const activeListings = (assets || []).filter((a) => a.status === 'ACTIVE').length;
  const firstName =
    profile!.full_name?.split(' ')[0] || t('greetingFallback');

  return (
    <Stack gap={40}>
      <PageHeader
        title={t('greeting', { name: firstName })}
        description={t('description')}
        action={
          <Group gap="sm">
            <LinkButton href="/owner/bookings" variant="default">
              {t('settlements')}
            </LinkButton>
            <LinkButton href="/owner/assets/new" color="vbnbGreen">
              {t('newAsset')}
            </LinkButton>
          </Group>
        }
      />

      <SubscriptionStatusBanner
        active={active}
        periodEnd={sub?.period_end}
        href="/owner/subscription"
        activeDescription={t('subActiveDesc')}
        inactiveDescription={t('subInactiveDesc')}
        activeActionLabel={t('subActiveAction')}
        inactiveActionLabel={t('subInactiveAction')}
      />

      {!hasPayout ? (
        <Alert color="yellow" title={t('noPayoutTitle')}>
          {t('noPayoutDesc')}{' '}
          <LinkButton href="/owner/profile" variant="light" color="vbnbGreen" size="xs">
            {t('openProfile')}
          </LinkButton>
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatCard
          label={t('pnl')}
          value={formatVnd(pnl, locale)}
          hint={t('lifetimeHint')}
          emphasis="hero"
        />
        <StatCard
          label={t('settledBookings')}
          value={confirmedCount}
          hint={t('settledHint')}
        />
        <StatCard
          label={t('activeListings')}
          value={activeListings}
          hint={t('activeHint')}
        />
      </SimpleGrid>
    </Stack>
  );
}
