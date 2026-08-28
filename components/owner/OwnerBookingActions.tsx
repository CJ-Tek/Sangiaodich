'use client';

import { Button, Checkbox, Group, Stack, Textarea, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function OwnerBookingActions({
  bookingId,
  requireStkCheck = true,
}: {
  bookingId: string;
  /** Simple mode skips the STK checkbox — owners check the bank app themselves. */
  requireStkCheck?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [stkChecked, setStkChecked] = useState(false);

  async function act(action: 'confirm' | 'reject') {
    if (action === 'confirm' && requireStkCheck && !stkChecked) {
      notifications.show({
        color: 'yellow',
        message: 'Hãy đối chiếu STK / mã CK trước khi xác nhận',
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
          message: json.error?.message || 'Lỗi',
        });
        return;
      }
      notifications.show({
        color: 'vbnbGreen',
        message:
          action === 'confirm'
            ? 'Đã xác nhận — lịch đã khóa'
            : 'Đã từ chối — hoàn 100% cọc Guest',
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
            label="Đã đối chiếu STK / mã CK từ Sale (tự check app NH)"
            size="sm"
          />
          <Text size="xs" c="dimmed">
            Confirm = bạn xác nhận đã nhận tiền — không dựa vào tick “đã CK” của
            Sale.
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
          Xác nhận (khóa lịch)
        </Button>
        <Button
          size="xs"
          color="red"
          variant="light"
          loading={loading}
          onClick={() => setShowReject((v) => !v)}
        >
          Từ chối
        </Button>
      </Group>
      {showReject ? (
        <Stack gap="xs">
          <Textarea
            label="Lý do (tuỳ chọn)"
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            minRows={2}
            placeholder="VD: Chưa nhận đủ tiền / trùng lịch cá nhân..."
          />
          <Button
            size="xs"
            color="red"
            loading={loading}
            onClick={() => act('reject')}
          >
            Xác nhận từ chối
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
