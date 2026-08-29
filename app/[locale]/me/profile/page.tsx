import { getTranslations } from 'next-intl/server';
import { localeRedirect } from '@/lib/i18n/navigation';
import { Stack } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { GuestProfileForm } from '@/components/me/GuestProfileForm';

export default async function GuestProfilePage() {
  const t = await getTranslations('guest.profile');
  const profile = await getSessionProfile();
  if (!profile) return await localeRedirect('/login?next=/me/profile');
  if (profile.role === 'SALE') return await localeRedirect('/sale/settings?tab=profile');
  if (profile.role === 'OWNER') return await localeRedirect('/owner/profile');

  const admin = await createClient();
  const { data: row } = await admin
    .from('profiles')
    .select('full_name, phone, email, avatar_url')
    .eq('id', profile.id)
    .single();

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <Stack gap="md">
        <GuestProfileForm
          initial={{
            fullName: row?.full_name || profile.full_name || '',
            phone: row?.phone || profile.phone || '',
            email: row?.email || profile.email || '',
            avatarUrl: row?.avatar_url || '',
          }}
        />
        <LogoutButton />
      </Stack>
    </>
  );
}
