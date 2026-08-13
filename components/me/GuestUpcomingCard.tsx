import { Group, Paper, Stack, Text } from '@mantine/core';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { colors, radius } from '@/config/design-tokens';
import type { GuestUpcomingBooking } from '@/lib/engines/guest-overview';

export function GuestUpcomingCard({
  upcoming,
}: {
  upcoming: GuestUpcomingBooking | null;
}) {
  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          Chuyến sắp tới
        </Text>
        {!upcoming ? (
          <>
            <Text size="sm">Chưa có chuyến nào.</Text>
            <LinkAnchor href="/marketplace" size="sm" c="vbnbGreen.6">
              Khám phá villa
            </LinkAnchor>
          </>
        ) : (
          <>
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <div>
                <Text fw={600}>{upcoming.assetTitle}</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {upcoming.checkIn} → {upcoming.checkOut}
                </Text>
              </div>
              <BookingStatusBadge status={upcoming.status} />
            </Group>
            <LinkAnchor
              href={`/me/bookings/${upcoming.id}`}
              size="sm"
              c="vbnbGreen.6"
            >
              Xem chi tiết
            </LinkAnchor>
          </>
        )}
      </Stack>
    </Paper>
  );
}
