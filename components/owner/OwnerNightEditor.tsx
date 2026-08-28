'use client';

import { Box, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
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
        message: 'Đêm đã khóa booking — không đóng được',
      });
      return;
    }
    if (status === 'hold') {
      notifications.show({
        color: 'yellow',
        message: 'Đêm đang giữ chỗ — xác nhận hoặc từ chối ở Chờ xác nhận',
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
          message: json.error?.message || 'Không cập nhật được',
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
          Đêm đóng / mở
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
        Bấm ngày trống để đóng (không nhận khách). Bấm ngày xám để mở lại. Đỏ =
        đã book.
      </Text>
      <SimpleGrid cols={7} spacing={6}>
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
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
