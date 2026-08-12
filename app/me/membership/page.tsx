import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { GuestShell } from '@/components/shells/GuestShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Paper, Text, Stack, Progress, Title } from '@mantine/core';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { colors, radius } from '@/config/design-tokens';

export default async function MembershipPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login?next=/me/membership');
  if (profile.role === 'SALE') redirect('/sale/settings?tab=membership');

  const admin = await createClient();
  const { data: state } = await admin
    .from('guest_membership_states')
    .select('*, guest_membership_tiers(*)')
    .eq('guest_id', profile.id)
    .maybeSingle();

  const { data: tiers } = await admin
    .from('guest_membership_tiers')
    .select('*')
    .order('sort');

  const current =
    (state?.guest_membership_tiers as {
      label?: string;
      discount_percent?: number;
      sort?: number;
    }) || null;
  const next = tiers?.find((t) => t.sort === (current?.sort ?? 0) + 1);

  return (
    <GuestShell isLoggedIn>
      <PageHeader
        title="Profile"
        description={`${profile.full_name || 'Guest'} · Cộng khi confirm; hủy booking đã chốt có thể hạ hạng.`}
      />
      <Stack gap="md">
        <Paper p="lg" radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed">
                Current tier
              </Text>
              <Title order={3} fw={600} mt={4}>
                {current?.label || 'Tier 0'}
              </Title>
            </div>
            <Text size="sm" c="dimmed">
              Ưu đãi áp dụng khi sale tính giá — sàn không hiện số tiền.
            </Text>
            <Text size="sm">
              Lifetime: {state?.lifetime_books || 0} booking ·{' '}
              {Number(state?.lifetime_gmv || 0).toLocaleString('vi-VN')} VND
            </Text>
            {next ? (
              <>
                <Text size="sm">
                  Tiến độ tới {next.label}: {state?.progress_books || 0}/{next.min_books}{' '}
                  books · {Number(state?.progress_gmv || 0).toLocaleString('vi-VN')}/
                  {Number(next.min_gmv).toLocaleString('vi-VN')} GMV
                </Text>
                <Progress
                  value={Math.min(
                    100,
                    ((state?.progress_books || 0) / Math.max(1, next.min_books)) * 100
                  )}
                  color="vbnbGreen"
                  radius="sm"
                />
              </>
            ) : (
              <Text size="sm" c="dimmed">
                Đã ở hạng cao nhất.
              </Text>
            )}
          </Stack>
        </Paper>
        <LogoutButton />
      </Stack>
    </GuestShell>
  );
}
