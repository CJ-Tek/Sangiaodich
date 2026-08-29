'use client';

import { Box, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useState } from 'react';
import dayjs from 'dayjs';
import { bookingStatusColors } from '@/config/booking-status';
import { colors, radius } from '@/config/design-tokens';
import { todayDateOnly } from '@/lib/dates';
import {
  nightStatus,
  type AssetNightBoard,
} from '@/lib/engines/inventory';

const BOOKED = {
  bg: colors.dangerSoft,
  text: colors.danger,
  border: '#E8D0D0',
};

export function OwnerNightEditor({
  assetId,
  board,
}: {
  assetId: string;
  board: AssetNightBoard;
}) {
  const t = useTranslations('owner.nightEditor');
  const weekdays = t.raw('weekdays') as string[];
  const router = useRouter();
  const [viewMonth, setViewMonth] = useState(() => dayjs().startOf('month'));
  const [pending, setPending] = useState<string | null>(null);
  const today = todayDateOnly();
  const daysInMonth = viewMonth.daysInMonth();
  const startWeekday = (viewMonth.day() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  async function toggle(dateStr: string) {
    if (dateStr < today) return;
    const status = nightStatus(dateStr, board);
    if (status === 'locked') {
      notifications.show({
        color: 'red',
        message: t('locked'),
      });
      return;
    }
    if (status === 'hold') {
      notifications.show({
        color: 'yellow',
        message: t('pending'),
      });
      return;
    }
    setPending(dateStr);
    try {
      const res = await fetch('/api/owner/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          night: dateStr,
          action: status === 'closed' ? 'open' : 'close',
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || t('updateFailed'),
        });
        return;
      }
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Title order={5} fw={600}>
          {t('title')}
        </Title>
        <Group gap="xs">
          <Text
            size="sm"
            c="dimmed"
            style={{ cursor: 'pointer' }}
            onClick={() => setViewMonth((m) => m.subtract(1, 'month'))}
          >
            ‹
          </Text>
          <Text size="sm" fw={600}>
            {viewMonth.format('MM/YYYY')}
          </Text>
          <Text
            size="sm"
            c="dimmed"
            style={{ cursor: 'pointer' }}
            onClick={() => setViewMonth((m) => m.add(1, 'month'))}
          >
            ›
          </Text>
        </Group>
      </Group>
      <Text size="xs" c="dimmed">
        {t('hint')}
      </Text>
      <SimpleGrid cols={7} spacing={6}>
        {weekdays.map((d) => (
          <Text key={d} size="xs" ta="center" c="dimmed">
            {d}
          </Text>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <Box key={`e-${idx}`} h={36} />;
          const dateStr = viewMonth.date(day).format('YYYY-MM-DD');
          const status = nightStatus(dateStr, board);
          const past = dateStr < today;
          const tone =
            status === 'locked'
              ? BOOKED
              : status === 'closed'
                ? bookingStatusColors.blocked
                : status === 'hold'
                  ? bookingStatusColors.hold
                  : bookingStatusColors.available;
          return (
            <Box
              key={dateStr}
              h={36}
              onClick={() => !past && pending !== dateStr && toggle(dateStr)}
              style={{
                borderRadius: radius.sm,
                background: past ? colors.surfaceMuted : tone.bg,
                border: `1px solid ${tone.border}`,
                color: past ? colors.textMuted : tone.text,
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                cursor: past ? 'default' : 'pointer',
                opacity: pending === dateStr ? 0.6 : 1,
              }}
            >
              {day}
            </Box>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
