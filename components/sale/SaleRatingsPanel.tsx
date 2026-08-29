'use client';

import { Paper, Stack, Text, Group } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import type {
  SaleRatingAggregate,
  SaleRatingComment,
} from '@/lib/engines/sale-ratings';
import { useTranslations } from 'next-intl';
import { useFormat } from '@/lib/i18n/use-format';

export function SaleRatingsPanel({
  aggregate,
  comments,
}: {
  aggregate: SaleRatingAggregate | null;
  comments: SaleRatingComment[];
}) {
  const t = useTranslations('sale.ratings');
  const { formatDecimal, formatDateTime } = useFormat();
  const formatAvg = (n: number) =>
    formatDecimal(n, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  return (
    <Stack gap="md">
      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Text size="sm" c="dimmed">
          {t('title')}
        </Text>
        {!aggregate || aggregate.ratingCount <= 0 ? (
          <Text size="sm" mt="sm" c="dimmed">
            {t('empty')}
          </Text>
        ) : (
          <>
            <Text size="xl" fw={600} mt={6}>
              {t('avg', { avg: formatAvg(aggregate.avgOverall) })}
            </Text>
            <Text size="sm" c="dimmed">
              {t('count', { count: aggregate.ratingCount })}
            </Text>
            <Group gap="lg" mt="sm">
              <Text size="sm">
                {t('payment')} {formatAvg(aggregate.avgPayment)}
              </Text>
              <Text size="sm">
                {t('handling')} {formatAvg(aggregate.avgHandling)}
              </Text>
              <Text size="sm">
                {t('communication')} {formatAvg(aggregate.avgCommunication)}
              </Text>
            </Group>
          </>
        )}
      </Paper>
      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Text size="sm" c="dimmed" mb="md">
          {t('comments')}
        </Text>
        {!comments.length ? (
          <Text size="sm" c="dimmed">
            {t('noComments')}
          </Text>
        ) : (
          <Stack gap="sm">
            {comments.map((c, i) => (
              <div key={`${c.createdAt}-${i}`}>
                <Text size="sm" fw={500}>
                  {c.ownerName} · {formatAvg(c.overall)}/10
                </Text>
                <Text size="sm">{c.comment}</Text>
                <Text size="xs" c="dimmed">
                  {formatDateTime(c.createdAt)}
                </Text>
              </div>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
