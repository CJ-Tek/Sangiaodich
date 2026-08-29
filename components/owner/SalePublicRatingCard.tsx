'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors, radius } from '@/config/design-tokens';
import type {
  SaleRatingAggregate,
  SaleRatingComment,
} from '@/lib/engines/sale-ratings';
import { useFormat } from '@/lib/i18n/use-format';

export function SalePublicRatingCard({
  aggregate,
  comments,
}: {
  aggregate: SaleRatingAggregate | null;
  comments: SaleRatingComment[];
}) {
  const t = useTranslations('owner.publicRating');
  const { formatDecimal, formatDateTime } = useFormat();
  const formatAvg = (n: number) =>
    formatDecimal(n, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const [open, setOpen] = useState(false);
  const hasRatings = Boolean(aggregate && aggregate.ratingCount > 0);

  if (!hasRatings || !aggregate) {
    return (
      <Text size="xs" c="dimmed">
        {t('empty')}
      </Text>
    );
  }

  return (
    <>
      <UnstyledButton onClick={() => setOpen(true)}>
        <Badge color="vbnbGreen" variant="light" size="sm">
          {t('summary', {
            avg: formatAvg(aggregate.avgOverall),
            count: aggregate.ratingCount,
          })}
        </Badge>
      </UnstyledButton>
      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title={t('title')}
        centered
      >
        <Stack gap="md">
          <div>
            <Text size="xl" fw={600}>
              {formatAvg(aggregate.avgOverall)}/10
            </Text>
            <Text size="sm" c="dimmed">
              {t('subtitle', { count: aggregate.ratingCount })}
            </Text>
          </div>
          <Group gap="lg">
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
          {comments.length ? (
            <Stack gap="sm">
              {comments.map((c, i) => (
                <div
                  key={`${c.createdAt}-${i}`}
                  style={{
                    borderTop: `1px solid ${colors.border}`,
                    paddingTop: 8,
                    borderRadius: radius.sm,
                  }}
                >
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
          ) : (
            <Text size="sm" c="dimmed">
              {t('noComments')}
            </Text>
          )}
          <Button variant="default" onClick={() => setOpen(false)}>
            {t('close')}
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
