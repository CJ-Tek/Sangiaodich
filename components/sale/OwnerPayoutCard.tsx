'use client';

import {
  Badge,
  Button,
  Group,
  Image,
  NumberInput,
  Stack,
  Text,
  Paper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { colors, radius } from '@/config/design-tokens';
import { BookingTransferMemo } from '@/components/sale/BookingTransferMemo';
import { ownerTransferMemo } from '@/lib/engines/booking-search';
import { minOwnerDepositToConfirm } from '@/lib/engines/pricing';
import {
  hasOwnerPayoutInfo,
  ownerPayoutStatus,
  type OwnerPayoutInfo,
} from '@/lib/owner/payout-info';
import {
  buildVietQrUrl,
  canBuildOwnerVietQr,
  resolveOwnerVietQrBank,
} from '@/lib/sepay/vietqr';

function copyText(label: string, value: string) {
  void navigator.clipboard.writeText(value);
  notifications.show({
    color: 'vbnbGreen',
    message: `Đã copy ${label}`,
    autoClose: 1600,
  });
}

const STATUS_META = {
  none: { label: 'Chưa CK Owner', color: 'red' as const },
  partial: { label: 'CK một phần', color: 'yellow' as const },
  full: { label: 'Đã CK đủ', color: 'vbnbGreen' as const },
};

type QrPreset = 'deposit' | 'remaining';

export function OwnerPayoutCard({
  bookingId,
  ownerEarn,
  ownerPaid,
  payout,
  transferHint,
}: {
  bookingId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEarn: number;
  ownerPaid: number;
  payout: OwnerPayoutInfo;
  transferHint?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const remaining = Math.max(0, ownerEarn - ownerPaid);
  const halfCost = minOwnerDepositToConfirm(ownerEarn);
  const depositChunk = Math.min(
    Math.max(0, halfCost - ownerPaid),
    remaining
  );
  const depositStillNeeded = depositChunk > 0;

  const defaultPreset: QrPreset = depositStillNeeded ? 'deposit' : 'remaining';
  const [preset, setPreset] = useState<QrPreset>(defaultPreset);

  const qrChunk =
    preset === 'deposit' && depositChunk > 0 ? depositChunk : remaining;

  const suggestedCumulative = Math.min(ownerEarn, ownerPaid + qrChunk);

  const [amount, setAmount] = useState(suggestedCumulative);

  useEffect(() => {
    setPreset(depositStillNeeded ? 'deposit' : 'remaining');
  }, [depositStillNeeded, bookingId]);

  useEffect(() => {
    setAmount(Math.min(ownerEarn, ownerPaid + qrChunk));
  }, [preset, ownerPaid, ownerEarn, qrChunk]);

  const status = ownerPayoutStatus({ ownerEarn, ownerPaid });
  const meta = STATUS_META[status];
  const hasBank = hasOwnerPayoutInfo(payout);

  const hint = useMemo(
    () => transferHint || ownerTransferMemo(bookingId),
    [bookingId, transferHint]
  );

  const dynamicQrUrl = useMemo(() => {
    if (!canBuildOwnerVietQr(payout) || qrChunk <= 0) return null;
    return buildVietQrUrl({
      accountNumber: payout.accountNumber,
      bank: resolveOwnerVietQrBank(payout),
      amount: qrChunk,
      description: hint,
    });
  }, [payout, qrChunk, hint]);

  const displayQrUrl = dynamicQrUrl || payout.qrImageUrl || null;
  const qrIsDynamic = Boolean(dynamicQrUrl);

  async function markPaid(next: number) {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          action: 'record_owner_payout',
          ownerPaidAmount: next,
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
        message: 'Đã cập nhật CK Owner',
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
          Chủ nhà / CK Owner
        </Text>

        {remaining <= 0 ? (
          <>
            <BookingTransferMemo bookingId={bookingId} transferHint={hint} />
            <Text size="sm" fw={600} c="vbnbGreen.6">
              Bạn đã chuyển đủ tiền
            </Text>
          </>
        ) : (
          <>
            <Badge color={meta.color} variant="light" w="fit-content">
              {meta.label}
            </Badge>
            {hasBank ? (
              <Stack gap="sm">
                <Group gap="xs" wrap="wrap">
                  <Button
                    size="xs"
                    color="vbnbGreen"
                    variant={preset === 'deposit' ? 'filled' : 'light'}
                    disabled={!depositStillNeeded}
                    onClick={() => setPreset('deposit')}
                  >
                    50% ({depositChunk.toLocaleString('vi-VN')})
                  </Button>
                  <Button
                    size="xs"
                    color="vbnbGreen"
                    variant={preset === 'remaining' ? 'filled' : 'light'}
                    onClick={() => setPreset('remaining')}
                  >
                    Còn lại ({remaining.toLocaleString('vi-VN')})
                  </Button>
                </Group>

                {displayQrUrl ? (
                  <Image
                    src={displayQrUrl}
                    alt="QR CK Owner"
                    maw={200}
                    radius="md"
                  />
                ) : (
                  <Badge size="sm" variant="light" color="yellow">
                    Chưa có QR
                  </Badge>
                )}

                <Text size="sm">
                  {payout.bankName ? `${payout.bankName} · ` : ''}
                  {payout.accountNumber}
                  {payout.accountName ? ` · ${payout.accountName}` : ''}
                </Text>

                <Group gap="xs" wrap="wrap" align="center">
                  <BookingTransferMemo
                    bookingId={bookingId}
                    transferHint={hint}
                  />
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => copyText('STK', payout.accountNumber)}
                  >
                    Copy STK
                  </Button>
                </Group>

                {payout.note ? (
                  <Text size="xs" c="dimmed">
                    {payout.note}
                  </Text>
                ) : null}
              </Stack>
            ) : (
              <Stack gap="sm">
                <Badge size="sm" variant="light" color="yellow">
                  Owner chưa cấu hình STK
                </Badge>
                <BookingTransferMemo bookingId={bookingId} transferHint={hint} />
              </Stack>
            )}

            <Group gap="md" wrap="wrap">
              <div>
                <Text size="xs" c="dimmed">
                  Cần CK
                </Text>
                <Text size="sm" fw={600}>
                  {ownerEarn.toLocaleString('vi-VN')}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Đã CK
                </Text>
                <Text size="sm" fw={600}>
                  {ownerPaid.toLocaleString('vi-VN')}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Còn lại
                </Text>
                <Text size="sm" fw={600} c="red">
                  {remaining.toLocaleString('vi-VN')}
                </Text>
              </div>
            </Group>

            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Tổng đã CK
              </Text>
              <NumberInput
                value={amount}
                onChange={(v) => setAmount(Number(v) || 0)}
                min={ownerPaid}
                max={ownerEarn > 0 ? ownerEarn : undefined}
                thousandSeparator="."
                decimalSeparator=","
              />
              <Group gap="xs">
                <Button
                  size="xs"
                  color="vbnbGreen"
                  loading={loading}
                  disabled={
                    amount < ownerPaid ||
                    (ownerEarn > 0 && amount > ownerEarn) ||
                    amount === ownerPaid
                  }
                  onClick={() => markPaid(amount)}
                >
                  Lưu số đã CK
                </Button>
                <Button
                  size="xs"
                  variant="default"
                  loading={loading}
                  disabled={ownerEarn <= 0 || ownerPaid >= ownerEarn}
                  onClick={() => markPaid(ownerEarn)}
                >
                  Đánh dấu đủ
                </Button>
              </Group>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
