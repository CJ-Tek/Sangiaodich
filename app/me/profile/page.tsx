import { redirect } from 'next/navigation';
import { Stack } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { GuestShell } from '@/components/shells/GuestShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { GuestProfileForm } from '@/components/me/GuestProfileForm';

export default async function GuestProfilePage() {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login?next=/me/profile');
  if (profile.role === 'SALE') redirect('/sale/settings?tab=profile');
  if (profile.role === 'OWNER') redirect('/owner/profile');

  const admin = await createClient();
  const { data: row } = await admin
    .from('profiles')
    .select('full_name, phone, email, avatar_url')
    .eq('id', profile.id)
    .single();

  return (
    <GuestShell isLoggedIn>
      <PageHeader
        title="Tài khoản"
        description="Cập nhật tên, ảnh đại diện và email."
      />
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
    </GuestShell>
  );
}
