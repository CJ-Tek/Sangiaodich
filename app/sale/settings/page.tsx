import { Alert, Stack } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { SaleProfileForm } from '@/components/sale/SaleProfileForm';
import { OwnerPayoutForm } from '@/components/owner/OwnerPayoutForm';
import { SaleSettingsTabs } from '@/components/sale/SaleSettingsTabs';
import { parseSaleSettingTab } from '@/components/sale/sale-setting-tabs';
import { isSimpleUi } from '@/lib/engines/ui-mode';
import { SaleMembershipPanel } from '@/components/sale/SaleMembershipPanel';
import { SaleRatingsPanel } from '@/components/sale/SaleRatingsPanel';
import { SaleSubscriptionPanel } from '@/components/sale/SaleSubscriptionPanel';
import { signIdDocUrl } from '@/lib/profile/id-docs';
import {
  hasOwnerPayoutInfo,
  mapOwnerPayoutInfo,
} from '@/lib/owner/payout-info';
import { resolveSaleDiscountProgress } from '@/lib/engines/sale-pricing';
import {
  loadSaleRatingAggregates,
  loadSaleRatingComments,
} from '@/lib/engines/sale-ratings';
import {
  getPendingIntentForProfile,
  listActivePlansForRole,
} from '@/lib/engines/subscription-payment';
import { isSubscriptionActive } from '@/lib/engines/subscription';
import { todayDateOnly } from '@/lib/dates';

export default async function SaleSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const profile = await getSessionProfile();
  const hidePayout = isSimpleUi(profile!.uiMode);
  const tab = parseSaleSettingTab(tabParam, { hidePayout });
  const admin = await createClient();

  const [
    { data: row },
    progress,
    ratingMap,
    ratingComments,
    { data: sub },
    plans,
    pending,
  ] =
    await Promise.all([
      admin
        .from('profiles')
        .select(
          'full_name, phone, email, avatar_url, national_id, national_id_front_url, national_id_back_url, payout_bank_name, payout_account_name, payout_account_number, payout_vietqr_bank, payout_qr_image_url, payout_note'
        )
        .eq('id', profile!.id)
        .single(),
      resolveSaleDiscountProgress(profile!.id),
      loadSaleRatingAggregates([profile!.id]),
      loadSaleRatingComments({ saleIds: [profile!.id], limit: 30 }),
      admin
        .from('subscriptions')
        .select('*')
        .eq('profile_id', profile!.id)
        .order('period_end', { ascending: false })
        .limit(1)
        .maybeSingle(),
      listActivePlansForRole('SALE'),
      getPendingIntentForProfile(profile!.id),
    ]);

  const [frontPreview, backPreview] = await Promise.all([
    signIdDocUrl(row?.national_id_front_url),
    signIdDocUrl(row?.national_id_back_url),
  ]);

  const payout = mapOwnerPayoutInfo(row);
  const gatewayEnabled = Boolean(
    process.env.SEPAY_MERCHANT_ID && process.env.SEPAY_MERCHANT_SECRET_KEY
  );
  const subActive = Boolean(
    sub &&
      isSubscriptionActive({
        status: sub.status,
        periodEnd: sub.period_end,
        today: todayDateOnly(),
      })
  );

  return (
    <>
      <PageHeader
        title="Setting"
        description="Hồ sơ, STK nhận tiền, membership và subscription."
      />
      <Stack gap="md">
        <SaleSettingsTabs
          tab={tab}
          hidePayout={hidePayout}
          profile={
            <SaleProfileForm
              initial={{
                fullName: row?.full_name || profile!.full_name || '',
                phone: row?.phone || profile!.phone || '',
                email: row?.email || profile!.email || '',
                avatarUrl: row?.avatar_url || '',
                nationalId: row?.national_id || '',
                nationalIdFrontUrl: row?.national_id_front_url || '',
                nationalIdBackUrl: row?.national_id_back_url || '',
                nationalIdFrontPreview: frontPreview || '',
                nationalIdBackPreview: backPreview || '',
              }}
            />
          }
          payout={
            <Stack gap="md">
              {!hasOwnerPayoutInfo(payout) ? (
                <Alert color="yellow" title="Chưa có STK nhận tiền">
                  Cần STK để xuất invoice QR cho khách. Không hiện STK trên
                  card booking.
                </Alert>
              ) : null}
              <OwnerPayoutForm initial={payout} audience="sale" />
            </Stack>
          }
          membership={
            <Stack gap="md">
              <SaleMembershipPanel progress={progress} />
              <SaleRatingsPanel
                aggregate={ratingMap.get(profile!.id) ?? null}
                comments={ratingComments}
              />
            </Stack>
          }
          subscription={
            <SaleSubscriptionPanel
              status={sub?.status ?? null}
              periodStart={sub?.period_start ?? null}
              periodEnd={sub?.period_end ?? null}
              active={subActive}
              plans={plans}
              pending={pending}
              gatewayEnabled={gatewayEnabled}
            />
          }
        />
        <LogoutButton />
      </Stack>
    </>
  );
}
