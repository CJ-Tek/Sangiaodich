import { Stack, Group, SimpleGrid, Alert } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { isSubscriptionActive } from '@/lib/engines/subscription';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/LinkButton';
import { StatCard } from '@/components/ui/StatCard';
import { SubscriptionStatusBanner } from '@/components/ui/SubscriptionStatusBanner';
import {
  hasOwnerPayoutInfo,
  mapOwnerPayoutInfo,
} from '@/lib/owner/payout-info';

export default async function OwnerDashboard() {
  const profile = await getSessionProfile();
  const admin = await createClient();

  const { data: assets } = await admin
    .from('assets')
    .select('id, title, status')
    .eq('owner_id', profile!.id);

  const { data: payoutRow } = await admin
    .from('profiles')
    .select(
      'payout_bank_name, payout_account_name, payout_account_number, payout_vietqr_bank, payout_note'
    )
    .eq('id', profile!.id)
    .maybeSingle();
  const payout = mapOwnerPayoutInfo(payoutRow);
  const hasPayout = hasOwnerPayoutInfo(payout);

  const ids = (assets || []).map((a) => a.id);
  let pnl = 0;
  let confirmedCount = 0;
  if (ids.length) {
    const { data: bookings } = await admin
      .from('bookings')
      .select('owner_earn_snapshot')
      .in('status', ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'])
      .in('asset_id', ids);
    confirmedCount = bookings?.length || 0;
    pnl = (bookings || []).reduce(
      (s, b) => s + Number(b.owner_earn_snapshot || 0),
      0
    );
  }

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

  return (
    <Stack gap={40}>
      <PageHeader
        title={`Hello, ${profile!.full_name?.split(' ')[0] || 'Owner'}`}
        description="Portfolio overview — P&L từ booking đã chốt."
        action={
          <Group gap="sm">
            <LinkButton href="/owner/bookings" variant="default">
              Settlements
            </LinkButton>
            <LinkButton href="/owner/assets/new" color="vbnbGreen">
              New asset
            </LinkButton>
          </Group>
        }
      />

      <SubscriptionStatusBanner
        active={active}
        periodEnd={sub?.period_end}
        href="/owner/subscription"
        activeDescription="Tài khoản Owner đã kích hoạt"
        inactiveDescription="Chưa có gói active — gia hạn để đăng listing"
        activeActionLabel="Subscription"
        inactiveActionLabel="Gia hạn"
      />

      {!hasPayout ? (
        <Alert color="yellow" title="Chưa cấu hình STK nhận tiền">
          Sale cần STK để CK phần cost. Không chặn listing — vào Profile để điền
          tài khoản ngân hàng.{' '}
          <LinkButton href="/owner/profile" variant="light" color="vbnbGreen" size="xs">
            Mở Profile
          </LinkButton>
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatCard
          label="Owner P&L"
          value={`${pnl.toLocaleString('vi-VN')}đ`}
          hint="Lifetime confirmed"
          emphasis="hero"
        />
        <StatCard label="Settled bookings" value={confirmedCount} hint="Đã chốt" />
        <StatCard
          label="Active listings"
          value={activeListings}
          hint="Đang hiển thị trên sàn"
        />
      </SimpleGrid>
    </Stack>
  );
}
