'use client';

import { useState, type ReactNode } from 'react';
import {
  SimpleGrid,
  Text,
  Stack,
  Group,
  Box,
  Title,
  UnstyledButton,
} from '@mantine/core';
import dayjs from 'dayjs';
import { bookingStatusColors } from '@/config/booking-status';
import { colors, radius } from '@/config/design-tokens';
import { todayDateOnly } from '@/lib/dates';
import {
  nightStatus,
  type AssetNightBoard,
  type NightStatus,
} from '@/lib/engines/inventory';

const BOOKED_TONE = {
  bg: colors.dangerSoft,
  text: colors.danger,
  border: '#E8D0D0',
} as const;

const CLOSED_TONE = bookingStatusColors.blocked;

export type CalendarVariant = 'guest' | 'sale' | 'owner';

function toneForStatus(
  status: NightStatus,
  variant: CalendarVariant
): { bg: string; text: string; border: string } {
  if (status === 'locked') return BOOKED_TONE;
  if (status === 'closed') return CLOSED_TONE;
  if (status === 'hold' && variant !== 'guest') {
    return bookingStatusColors.hold;
  }
  return bookingStatusColors.available;
}

export function MarketplaceCalendar({
  month,
  board,
  variant = 'guest',
}: {
  month: Date;
  board: AssetNightBoard;
  /** Guest paints hold as empty (PENDING does not occupy public free/busy). */
  variant?: CalendarVariant;
}) {
  const [viewMonth, setViewMonth] = useState(() =>
    dayjs(month).startOf('month')
  );
  const start = viewMonth;
  const today = todayDateOnly();
  const minMonth = dayjs(month).startOf('month');
  const canGoPrev = start.isAfter(minMonth, 'month');
  const daysInMonth = start.daysInMonth();
  const startWeekday = (start.day() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const showHold = variant !== 'guest';

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap={4} align="center">
          <MonthNavButton
            label="Tháng trước"
            disabled={!canGoPrev}
            onClick={() => setViewMonth((m) => m.subtract(1, 'month'))}
          >
            ‹
          </MonthNavButton>
          <Title
            order={5}
            fw={600}
            tt="uppercase"
            style={{ letterSpacing: '0.04em', minWidth: '9.5rem' }}
            ta="center"
          >
            {start.format('MMMM YYYY')}
          </Title>
          <MonthNavButton
            label="Tháng sau"
            onClick={() => setViewMonth((m) => m.add(1, 'month'))}
          >
            ›
          </MonthNavButton>
        </Group>
        <Group gap="md">
          <Legend color={bookingStatusColors.available} label="Trống" />
          {showHold ? (
            <Legend color={bookingStatusColors.hold} label="Đang giữ" />
          ) : null}
          <Legend color={CLOSED_TONE} label="Đóng" />
          <Legend color={BOOKED_TONE} label="Đã book" />
        </Group>
      </Group>
      <SimpleGrid cols={7} spacing={8}>
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <Text key={d} size="xs" ta="center" c="dimmed" fw={500}>
            {d}
          </Text>
        ))}
        {cells.map((day, idx) => {
          const monthKey = start.format('YYYY-MM');
          if (!day) return <Box key={`${monthKey}-e-${idx}`} h={44} />;
          const dateStr = start.date(day).format('YYYY-MM-DD');
          const status = nightStatus(dateStr, board);
          const past = dateStr < today;
          const tone = toneForStatus(status, variant);
          return (
            <Box
              key={dateStr}
              h={44}
              style={{
                borderRadius: radius.md,
                background: past ? colors.surfaceMuted : tone.bg,
                border: `1px solid ${past ? colors.border : tone.border}`,
                color: past ? colors.textSecondary : tone.text,
                opacity: past ? 0.45 : 1,
                display: 'grid',
                placeItems: 'center',
                fontSize: 13,
                fontWeight: 500,
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

function MonthNavButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        display: 'grid',
        placeItems: 'center',
        borderRadius: radius.md,
        border: `1px solid ${colors.border}`,
        color: disabled ? colors.textSecondary : colors.textPrimary,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 18,
        lineHeight: 1,
      }}
    >
      {children}
    </UnstyledButton>
  );
}

function Legend({
  color,
  label,
}: {
  color: { bg: string; border: string; text: string };
  label: string;
}) {
  return (
    <Group gap={6}>
      <Box
        w={12}
        h={12}
        style={{
          background: color.bg,
          border: `1px solid ${color.border}`,
          borderRadius: 4,
        }}
      />
      <Text size="xs" c={colors.textSecondary}>
        {label}
      </Text>
    </Group>
  );
}
