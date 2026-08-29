'use client';

import { Group, Paper, Stack, Text } from '@mantine/core';
import { useLocale, useTranslations } from 'next-intl';
import { colors, radius } from '@/config/design-tokens';
import { formatCurrency } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2} style={{ flex: 1, minWidth: 120 }}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={600} size="lg">
        {value}
      </Text>
    </Stack>
  );
}

export function GuestLifetimeStats({
  lifetimeBooks,
  lifetimeGmv,
}: {
  lifetimeBooks: number;
  lifetimeGmv: number;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('guest.stats');

  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Group gap="lg" wrap="wrap">
        <Stat label={t('totalBookings')} value={String(lifetimeBooks)} />
        <Stat
          label={t('totalSpend')}
          value={formatCurrency(lifetimeGmv, locale)}
        />
      </Group>
    </Paper>
  );
}
