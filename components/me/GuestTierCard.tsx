'use client';

import { Badge, Group, Progress, Stack, Text, Title } from '@mantine/core';
import { useLocale, useTranslations } from 'next-intl';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { formatCurrency } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';
import type { GuestTierProgress } from '@/lib/engines/guest-overview';

export function GuestTierCard({ tier }: { tier: GuestTierProgress }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('guest.tier');

  return (
    <SurfaceCard>
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="sm" c="dimmed">
              {t('currentLabel')}
            </Text>
            <Title order={3} fw={600} mt={4}>
              {tier.currentLabel}
            </Title>
          </div>
          {tier.atMaxTier ? (
            <Badge color="vbnbGreen" variant="light">
              {t('maxBadge')}
            </Badge>
          ) : null}
        </Group>

        {tier.atMaxTier ? (
          <Text size="sm" c="dimmed">
            {t('atMax')}
          </Text>
        ) : (
          <>
            <Text size="sm">
              {t('progress', {
                nextLabel: tier.nextLabel ?? '',
                progressBooks: tier.progressBooks,
                neededBooks: tier.neededBooks,
                progressGmv: formatCurrency(tier.progressGmv, locale),
                neededGmv: formatCurrency(tier.neededGmv, locale),
              })}
            </Text>
            <Progress value={tier.percent} color="vbnbGreen" radius="sm" />
            <Text size="xs" c="dimmed">
              {t('remaining', {
                remainingBooks: tier.remainingBooks,
                remainingGmv: formatCurrency(tier.remainingGmv, locale),
              })}
            </Text>
          </>
        )}

        <Text size="xs" c="dimmed">
          {t('note')}
        </Text>
      </Stack>
    </SurfaceCard>
  );
}
