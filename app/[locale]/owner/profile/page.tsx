import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { SaleProfileForm } from '@/components/sale/SaleProfileForm';
import { OwnerPayoutForm } from '@/components/owner/OwnerPayoutForm';
import { Alert, Stack, Text } from '@mantine/core';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { signIdDocUrl } from '@/lib/profile/id-docs';
import { isSimpleUi } from '@/lib/engines/ui-mode';
import {
  hasOwnerPayoutInfo,
  mapOwnerPayoutInfo,
} from '@/lib/owner/payout-info';

export default async function OwnerProfilePage() {
  const t = await getTranslations('owner.profile');
  const profile = await getSessionProfile();
  const admin = await createClient();

  const { data: row } = await admin
    .from('profiles')
    .select(
      'full_name, phone, email, avatar_url, national_id, national_id_front_url, national_id_back_url, payout_bank_name, payout_account_name, payout_account_number, payout_vietqr_bank, payout_qr_image_url, payout_note'
    )
    .eq('id', profile!.id)
    .single();

  const [frontPreview, backPreview] = await Promise.all([
    signIdDocUrl(row?.national_id_front_url),
    signIdDocUrl(row?.national_id_back_url),
  ]);

  const payout = mapOwnerPayoutInfo(row);
  const simple = isSimpleUi(profile!.uiMode);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <Stack gap="md" maw={560}>
        {!simple && !hasOwnerPayoutInfo(payout) ? (
          <Alert color="yellow" title={t('noPayoutTitle')}>
            {t('noPayoutDesc')}
          </Alert>
        ) : null}
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
        {simple ? null : <OwnerPayoutForm initial={payout} />}
        <Text size="sm" c="dimmed">
          {t('seeAlso')}{' '}
          <LinkAnchor href="/owner/subscription" c="vbnbGreen.6">
            {t('subscription')}
          </LinkAnchor>
        </Text>
        <LogoutButton />
      </Stack>
    </>
  );
}
