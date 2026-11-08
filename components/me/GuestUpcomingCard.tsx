'use client';

import { Group, Stack, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useFormat } from '@/lib/i18n/use-format';
import type { GuestUpcomingBooking } from '@/lib/engines/guest-overview';

export function GuestUpcomingCard({
  upcoming,
}: {
  upcoming: GuestUpcomingBooking | null;
}) {
  const t = useTranslations('guest.upcoming');
  const { formatDateRange } = useFormat();

  return (
    <SurfaceCard>
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          {t('title')}
        </Text>
        {!upcoming ? (
          <>
            <Text size="sm">{t('empty')}</Text>
            <LinkAnchor href="/me/explore" size="sm" c="vbnbGreen.6">
              {t('explore')}
            </LinkAnchor>
          </>
        ) : (
          <>
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <div>
                <Text fw={600}>{upcoming.assetTitle}</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {formatDateRange(upcoming.checkIn, upcoming.checkOut)}
                </Text>
              </div>
              <BookingStatusBadge status={upcoming.status} />
            </Group>
            <LinkAnchor
              href={`/me/bookings/${upcoming.id}`}
              size="sm"
              c="vbnbGreen.6"
            >
              {t('viewDetail')}
            </LinkAnchor>
          </>
        )}
      </Stack>
    </SurfaceCard>
  );
}
