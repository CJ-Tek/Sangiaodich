'use client';

import { Button, Group, NumberInput, Paper, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { colors, radius } from '@/config/design-tokens';
import { BookingTransferMemo } from '@/components/sale/BookingTransferMemo';
import { minDepositToConfirm } from '@/lib/engines/pricing';

/** Cập nhật amount_collected Guest — đặt cạnh CK Owner, tách khỏi Check-in/Cancel. */
export function GuestCollectedUpdate({
  bookingId,
  listPrice,
  amountCollected,
}: {
  bookingId: string;
  listPrice: number;
  amountCollected: number;
}) {
  const router = useRouter();
  const collected = Number(amountCollected || 0);
  const left = Math.max(0, listPrice - collected);
  const minDeposit = minDepositToConfirm(listPrice);
  const [settleAmount, setSettleAmount] = useState(
    collected > 0 ? listPrice : minDeposit
  );
  const [loading, setLoading] = useState(false);

  async function save(next: number) {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          action: 'record_payment',
          amountCollected: next,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || 'Không lưu được',
        });
        return;
      }
      notifications.show({
        color: 'vbnbGreen',
        message: 'Đã cập nhật số tiền thu',
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper
      p="md"
      radius={radius.md}
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.surface,
      }}
    >
      <Stack gap="sm">
        <Text size="xs" c="dimmed">
          Thu từ khách
        </Text>
        <BookingTransferMemo bookingId={bookingId} />
        {left <= 0 ? (
          <Text size="sm" fw={600} c="vbnbGreen.6">
            Bạn đã thu đủ tiền
          </Text>
        ) : (
          <>
        <Text size="sm" fw={600}>
          Đã thu {collected.toLocaleString('vi-VN')}
          <Text span c="dimmed" fw={400}>
            {' '}
            · còn {left.toLocaleString('vi-VN')}
          </Text>
        </Text>
        <Group align="flex-end" gap="sm" wrap="wrap">
          <NumberInput
            label="Cập nhật đã thu"
            value={settleAmount}
            onChange={(v) => setSettleAmount(Number(v) || 0)}
            min={collected}
            max={listPrice}
            thousandSeparator="."
            decimalSeparator=","
            w={200}
          />
        </Group>
        <Group gap="xs">
          <Button
            size="xs"
            variant={settleAmount === minDeposit ? 'filled' : 'light'}
            color="vbnbGreen"
            onClick={() => setSettleAmount(minDeposit)}
          >
            50% cọc
          </Button>
          <Button
            size="xs"
            variant={settleAmount === listPrice ? 'filled' : 'light'}
            color="vbnbGreen"
            onClick={() => setSettleAmount(listPrice)}
          >
            Đủ giá bán
          </Button>
          <Button
            size="xs"
            variant="light"
            color="vbnbGreen"
            loading={loading}
            disabled={settleAmount < collected || settleAmount > listPrice}
            onClick={() => save(settleAmount)}
          >
            Lưu đã thu
          </Button>
        </Group>
          </>
        )}
      </Stack>
    </Paper>
  );
}
