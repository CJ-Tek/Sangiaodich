'use client';

import { Button, Code, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { ownerTransferMemo } from '@/lib/engines/booking-search';

/** Mã CK chung Guest→Sale / Sale→Owner — luôn hiện để Sale tra cứu sao kê. */
export function BookingTransferMemo({
  bookingId,
  transferHint,
}: {
  bookingId: string;
  transferHint?: string;
}) {
  const t = useTranslations('sale.transferMemo');
  const memo = transferHint || ownerTransferMemo(bookingId);

  function copyMemo(value: string) {
    void navigator.clipboard.writeText(value);
    notifications.show({
      color: 'vbnbGreen',
      message: t('copied'),
      autoClose: 1600,
    });
  }

  return (
    <Group gap="xs" wrap="wrap" align="center">
      <Code>{memo}</Code>
      <Button size="xs" variant="default" onClick={() => copyMemo(memo)}>
        {t('copy')}
      </Button>
    </Group>
  );
}
