import { Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { colors, radius } from '@/config/design-tokens';
import type { GuestBookingDetail } from '@/lib/engines/guest-bookings';

function money(n: number) {
  return `${Number(n || 0).toLocaleString('vi-VN')} ₫`;
}

function moment(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('vi-VN');
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500} ta="right">
        {value}
      </Text>
    </Group>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      {children}
    </Paper>
  );
}

export function GuestBookingDetailCard({
  booking,
}: {
  booking: GuestBookingDetail;
}) {
  return (
    <Stack gap="md">
      <Card>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Title order={4} fw={600}>
              {booking.assetTitle}
            </Title>
            <Text size="sm" c="dimmed" mt={4}>
              {booking.checkIn} → {booking.checkOut}
            </Text>
            {booking.assetSlug ? (
              <LinkAnchor
                href={`/a/${booking.assetSlug}`}
                size="sm"
                c="vbnbGreen.6"
                mt={6}
                display="inline-block"
              >
                Xem villa
              </LinkAnchor>
            ) : null}
          </div>
          <BookingStatusBadge status={booking.status} />
        </Group>
      </Card>

      <Card>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            Thanh toán
          </Text>
          <Row label="Giá booking" value={money(booking.listPrice)} />
          <Row label="Đã thanh toán" value={money(booking.amountCollected)} />
          <Divider my={4} />
          <Row label="Còn lại" value={money(booking.remaining)} />
          {booking.refundAmount > 0 ? (
            <Row label="Đã hoàn" value={money(booking.refundAmount)} />
          ) : null}
          <Text size="xs" c="dimmed" mt={4}>
            Thanh toán offline qua sale phụ trách. Số liệu trên do sale ghi nhận
            khi nhận tiền.
          </Text>
        </Stack>
      </Card>

      <Card>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            Tiến trình
          </Text>
          {booking.timeline.map((step) => (
            <Row
              key={step.label}
              label={step.label}
              value={moment(step.at) || 'Chưa'}
            />
          ))}
        </Stack>
      </Card>

      <Card>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            Sale phụ trách
          </Text>
          {booking.saleName || booking.salePhone ? (
            <>
              <Row label="Tên" value={booking.saleName || '—'} />
              <Row label="SĐT" value={booking.salePhone || '—'} />
            </>
          ) : (
            <Text size="sm" c="dimmed">
              Chưa có thông tin sale.
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
