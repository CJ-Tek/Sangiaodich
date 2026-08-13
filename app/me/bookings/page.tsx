import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Paper, Stack, Text, Group } from '@mantine/core';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { colors, radius } from '@/config/design-tokens';
import { loadGuestBookings } from '@/lib/engines/guest-bookings';

export default async function MyBookingsPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login?next=/me/bookings');
  if (profile.role === 'SALE') redirect('/sale/bookings');

  const bookings = await loadGuestBookings(profile.id);

  return (
    <>
      <PageHeader
        title="Booking"
        description="Booking do sale tạo hộ — không tự book trên sàn."
      />
      {!bookings.length ? (
        <EmptyState
          title="Chưa có booking nào"
          description="Booking sale tạo cho bạn sẽ hiện ở đây."
          actionLabel="Khám phá villa"
          href="/me/explore"
        />
      ) : (
        <Stack gap="sm">
          {bookings.map((b) => (
            <Paper
              key={b.id}
              p="lg"
              radius={radius.lg}
              style={{ border: `1px solid ${colors.border}` }}
            >
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <div>
                  <Text fw={600}>{b.assetTitle}</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {b.checkIn} → {b.checkOut}
                  </Text>
                  <LinkAnchor
                    href={`/me/bookings/${b.id}`}
                    size="sm"
                    c="vbnbGreen.6"
                    mt={6}
                    display="inline-block"
                  >
                    Xem chi tiết
                  </LinkAnchor>
                </div>
                <Stack gap={2} align="flex-end">
                  <BookingStatusBadge status={b.status} />
                  <Text size="sm" fw={600} mt={6}>
                    {b.listPrice.toLocaleString('vi-VN')} ₫
                  </Text>
                  <Text size="xs" c="dimmed">
                    {b.remaining > 0
                      ? `Còn ${b.remaining.toLocaleString('vi-VN')} ₫`
                      : 'Đã thanh toán đủ'}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </>
  );
}
