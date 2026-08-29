'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Group,
  NumberInput,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import type { SaleRatingRecord } from '@/lib/engines/sale-ratings';

export function OwnerSaleRatingForm({
  bookingId,
  rating,
}: {
  bookingId: string;
  rating: SaleRatingRecord | null;
}) {
  const t = useTranslations('owner.ratingForm');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scorePayment, setScorePayment] = useState(8);
  const [scoreHandling, setScoreHandling] = useState(8);
  const [scoreCommunication, setScoreCommunication] = useState(8);
  const [comment, setComment] = useState('');

  async function save() {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/sale-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          scorePayment,
          scoreHandling,
          scoreCommunication,
          comment,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || t('saveFailed'),
        });
      } else {
        notifications.show({
          color: 'vbnbGreen',
          message: t('saved'),
        });
        router.refresh();
      }
    } catch {
      notifications.show({
        color: 'red',
        message: t('connectionFailed'),
      });
    } finally {
      setLoading(false);
    }
  }

  if (rating) {
    return (
      <Stack gap="xs" mt="md">
        <Group gap="xs">
          <Text size="sm" fw={600}>
            {t('title')}
          </Text>
          <Badge color="gray" variant="light">
            {t('locked')}
          </Badge>
        </Group>
        <Text size="sm">
          {t('payment')} {rating.scorePayment} · {t('handling')}{' '}
          {rating.scoreHandling} · {t('communication')}{' '}
          {rating.scoreCommunication} ·{' '}
          {t('overall', { score: rating.overall })}
        </Text>
        {rating.comment ? (
          <Text size="sm" c="dimmed">
            {rating.comment}
          </Text>
        ) : null}
        <Text size="xs" c="dimmed">
          {t('submittedLocked')}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm" mt="md">
      <Group gap="xs">
        <Text size="sm" fw={600}>
          {t('title')}
        </Text>
        <Badge color="yellow" variant="light">
          {t('notRated')}
        </Badge>
      </Group>
      <Group grow align="flex-start">
        <NumberInput
          label={t('paymentLabel')}
          min={1}
          max={10}
          clampBehavior="strict"
          value={scorePayment}
          onChange={(v) => setScorePayment(Number(v) || 1)}
        />
        <NumberInput
          label={t('handlingLabel')}
          min={1}
          max={10}
          clampBehavior="strict"
          value={scoreHandling}
          onChange={(v) => setScoreHandling(Number(v) || 1)}
        />
        <NumberInput
          label={t('communicationLabel')}
          min={1}
          max={10}
          clampBehavior="strict"
          value={scoreCommunication}
          onChange={(v) => setScoreCommunication(Number(v) || 1)}
        />
      </Group>
      <Textarea
        label={t('commentLabel')}
        minRows={2}
        value={comment}
        onChange={(e) => setComment(e.currentTarget.value)}
        maxLength={1000}
      />
      <Button
        color="vbnbGreen"
        size="sm"
        w="fit-content"
        loading={loading}
        onClick={save}
      >
        {t('submit')}
      </Button>
    </Stack>
  );
}
