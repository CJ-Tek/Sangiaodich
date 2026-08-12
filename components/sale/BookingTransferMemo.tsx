'use client';

import { Button, Code, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ownerTransferMemo } from '@/lib/engines/booking-search';

function copyMemo(value: string) {
  void navigator.clipboard.writeText(value);
  notifications.show({
    color: 'vbnbGreen',
    message: 'Đã copy mã CK',
    autoClose: 1600,
  });
}

/** Mã CK chung Guest→Sale / Sale→Owner — luôn hiện để Sale tra cứu sao kê. */
export function BookingTransferMemo({
  bookingId,
  transferHint,
}: {
  bookingId: string;
  transferHint?: string;
}) {
  const memo = transferHint || ownerTransferMemo(bookingId);
  return (
    <Group gap="xs" wrap="wrap" align="center">
      <Code>{memo}</Code>
      <Button size="xs" variant="default" onClick={() => copyMemo(memo)}>
        Copy mã CK
      </Button>
    </Group>
  );
}
