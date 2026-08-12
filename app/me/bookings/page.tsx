import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { GuestShell } from '@/components/shells/GuestShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Paper, Stack, Text, Group } from '@mantine/core';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { colors, radius } from '@/config/design-tokens';

export default async function MyBookingsPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login?next=/me/bookings');
  if (profile.role === 'SALE') redirect('/sale/bookings');

  const admin = await createClient();
  const { data: bookings } = await admin
    .from('bookings')
    .select('id, status, check_in, check_out, assets(title, slug)')
    .eq('guest_id', profile.id)
    .order('created_at', { ascending: false });

  return (
    <GuestShell isLoggedIn>
      <PageHeader
        title="Bookings"
        description="Booking do sale tạo hộ — không tự book trên sàn."
      />
      {!bookings?.length ? (
        <EmptyState
          title="No upcoming bookings"
          description="Your confirmed bookings will appear here."
          actionLabel="Explore marketplace"
          href="/marketplace"
        />
      ) : (
        <Stack gap="sm">
          {bookings.map((b) => {
            const asset = b.assets as unknown as { title: string; slug: string };
            return (
              <Paper
                key={b.id}
                p="lg"
                radius={radius.lg}
                style={{ border: `1px solid ${colors.border}` }}
              >
                <Group justify="space-between" wrap="wrap">
                  <div>
                    <Text fw={600}>{asset?.title}</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {b.check_in} → {b.check_out}
                    </Text>
                    {asset?.slug ? (
                      <LinkAnchor
                        href={`/a/${asset.slug}`}
                        size="sm"
                        c="vbnbGreen.6"
                        mt={6}
                        display="inline-block"
                      >
                        View property
                      </LinkAnchor>
                    ) : null}
                  </div>
                  <BookingStatusBadge status={b.status} />
                </Group>
              </Paper>
            );
          })}
        </Stack>
      )}
    </GuestShell>
  );
}
