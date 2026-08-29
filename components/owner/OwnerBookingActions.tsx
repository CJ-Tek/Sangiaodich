'use client';

import { Button, Checkbox, Group, Stack, Textarea, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useState } from 'react';

export function OwnerBookingActions({
  bookingId,
  requireStkCheck = true,
}: {
  bookingId: string;
  /** Simple mode skips the STK checkbox — owners check the bank app themselves. */
  requireStkCheck?: boolean;
}) {
  const t = useTranslations('owner.bookingActions');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [stkChecked, setStkChecked] = useState(false);

  async function act(action: 'confirm' | 'reject') {
    if (action === 'confirm' && requireStkCheck && !stkChecked) {
      notifications.show({
        color: 'yellow',
        message: t('reconcileHint'),
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/owner/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          action,
          reason: action === 'reject' ? reason : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || t('error'),
        });
        return;
      }
      notifications.show({
        color: 'vbnbGreen',
        message: action === 'confirm' ? t('confirmed') : t('rejected'),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="xs">
      {requireStkCheck ? (
        <>
          <Checkbox
            checked={stkChecked}
            onChange={(e) => setStkChecked(e.currentTarget.checked)}
            label={t('reconciled')}
            size="sm"
          />
          <Text size="xs" c="dimmed">
            {t('confirmNote')}
          </Text>
        </>
      ) : null}
      <Group gap="xs">
        <Button
          size="xs"
          color="vbnbGreen"
          loading={loading}
          disabled={requireStkCheck && !stkChecked}
          onClick={() => act('confirm')}
        >
          {t('confirm')}
        </Button>
        <Button
          size="xs"
          color="red"
          variant="light"
          loading={loading}
          onClick={() => setShowReject((v) => !v)}
        >
          {t('reject')}
        </Button>
      </Group>
      {showReject ? (
        <Stack gap="xs">
          <Textarea
            label={t('reasonOptional')}
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            minRows={2}
            placeholder={t('reasonPlaceholder')}
          />
          <Button
            size="xs"
            color="red"
            loading={loading}
            onClick={() => act('reject')}
          >
            {t('confirmReject')}
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
