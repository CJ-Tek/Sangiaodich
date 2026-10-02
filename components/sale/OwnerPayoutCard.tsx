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
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useEffect, useMemo, useState } from 'react';
import { colors, radius } from '@/config/design-tokens';
import { useFormat } from '@/lib/i18n/use-format';
import { BookingTransferMemo } from '@/components/sale/BookingTransferMemo';
import { ownerTransferMemo } from '@/lib/engines/booking-search';
import {
  guestPaysOwner,
  isGuestDepositCase,
  isGuestPaidInFull,
  saleDepositToOwner,
  saleMarginKept,
  saleOwnerPayoutSatisfied,
} from '@/lib/engines/guest-balance';
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

function copyText(message: string, value: string) {
  void navigator.clipboard.writeText(value);
  notifications.show({
    color: 'vbnbGreen',
    message,
    autoClose: 1600,
  });
}

type QrPreset = 'deposit' | 'remaining';

export function OwnerPayoutCard({
  bookingId,
  ownerEarn,
  ownerPaid,
  listPrice = 0,
  amountCollected = 0,
  guestPaidOwner = 0,
  payout,
  transferHint,
}: {
  bookingId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEarn: number;
  ownerPaid: number;
  listPrice?: number;
  amountCollected?: number;
  guestPaidOwner?: number;
  payout: OwnerPayoutInfo;
  transferHint?: string;
}) {
  const t = useTranslations('sale.ownerPayout');
  const { formatNumber } = useFormat();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const depositCase = isGuestDepositCase(listPrice, amountCollected);
  const depositTarget = saleDepositToOwner(listPrice, amountCollected, ownerEarn);
  const costRemaining = Math.max(0, ownerEarn - ownerPaid);
  const depositChunk = Math.max(0, depositTarget - ownerPaid);
  const remaining = depositCase ? depositChunk : costRemaining;
  const payoutCap = depositCase ? depositTarget : ownerEarn;
  const guestToOwner = guestPaysOwner({
    listPrice,
    amountCollected,
    ownerCost: ownerEarn,
    ownerPaid,
    guestPaidOwner,
  });
  const margin = saleMarginKept(listPrice, ownerEarn);
  const dutyDone = saleOwnerPayoutSatisfied({
    listPrice,
    amountCollected,
    ownerEarn,
    ownerPaid,
  });
  const guestSettled = isGuestPaidInFull(
    listPrice,
    amountCollected,
    guestPaidOwner
  );
  const depositStillNeeded = depositChunk > 0;

  const defaultPreset: QrPreset = depositStillNeeded ? 'deposit' : 'remaining';
  const [preset, setPreset] = useState<QrPreset>(defaultPreset);

  const qrChunk = depositCase
    ? depositChunk
    : preset === 'deposit' && depositChunk > 0
      ? depositChunk
      : remaining;

  const suggestedCumulative = Math.min(payoutCap, ownerPaid + qrChunk);

  const [amount, setAmount] = useState(suggestedCumulative);

  useEffect(() => {
    setPreset(depositStillNeeded ? 'deposit' : 'remaining');
  }, [depositStillNeeded, bookingId]);

  useEffect(() => {
    setAmount(Math.min(payoutCap, ownerPaid + qrChunk));
  }, [preset, ownerPaid, payoutCap, qrChunk]);

  const halfReached =
    depositTarget > 0 && ownerPaid >= depositTarget && ownerPaid < ownerEarn;
  const status = ownerPayoutStatus({ ownerEarn, ownerPaid });
  const statusMeta = {
    none: { label: t('notPaid'), color: 'red' as const },
    partial: {
      label: halfReached ? t('paidHalf') : t('partial'),
      color: 'yellow' as const,
    },
    full: { label: t('paidFull'), color: 'teal' as const },
  };
  const meta = statusMeta[status];
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
          message: json.error?.message || t('saveFailed'),
        });
        return;
      }
      notifications.show({
        color: 'vbnbGreen',
        message: t('saved'),
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
          {t('title')}
        </Text>
        <Group gap="md" wrap="wrap">
          <div>
            <Text size="xs" c="dimmed">
              {t('listPrice')}
            </Text>
            <Text size="sm" fw={600}>
              {formatNumber(listPrice)}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              {t('ownerCost')}
            </Text>
            <Text size="sm" fw={600}>
              {formatNumber(ownerEarn)}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              {t('margin')}
            </Text>
            <Text size="sm" fw={600}>
              {formatNumber(margin)}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              {t('guestPaidSale')}
            </Text>
            <Text size="sm" fw={600}>
              {formatNumber(amountCollected)}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              {t('sendOwner')}
            </Text>
            <Text size="sm" fw={600}>
              {formatNumber(depositTarget)}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              {t('guestToOwner')}
            </Text>
            <Text size="sm" fw={600}>
              {formatNumber(guestPaidOwner + guestToOwner)}
            </Text>
          </div>
        </Group>

        {dutyDone ? (
          <>
            <BookingTransferMemo bookingId={bookingId} transferHint={hint} />
            <Text size="sm" fw={600} c="vbnbGreen.6">
              {depositCase && !guestSettled ? t('paidHalfNote') : t('youPaidFull')}
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
                    {t('halfChunk', { amount: formatNumber(depositChunk) })}
                  </Button>
                  {depositCase ? null : (
                    <Button
                      size="xs"
                      color="vbnbGreen"
                      variant={preset === 'remaining' ? 'filled' : 'light'}
                      onClick={() => setPreset('remaining')}
                    >
                      {t('remainingChunk', { amount: formatNumber(remaining) })}
                    </Button>
                  )}
                </Group>

                {displayQrUrl ? (
                  <Image
                    src={displayQrUrl}
                    alt={t('qrTitle')}
                    maw={200}
                    radius="md"
                  />
                ) : (
                  <Badge size="sm" variant="light" color="yellow">
                    {t('noQr')}
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
                    onClick={() =>
                      copyText(t('copied', { label: 'STK' }), payout.accountNumber)
                    }
                  >
                    {t('copyAccount')}
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
                  {t('noAccount')}
                </Badge>
                <BookingTransferMemo bookingId={bookingId} transferHint={hint} />
              </Stack>
            )}

            <Group gap="md" wrap="wrap">
              <div>
                <Text size="xs" c="dimmed">
                  {t('needPay')}
                </Text>
                <Text size="sm" fw={600}>
                  {formatNumber(depositCase ? depositTarget : ownerEarn)}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  {t('paid')}
                </Text>
                <Text size="sm" fw={600}>
                  {formatNumber(ownerPaid)}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  {t('remaining')}
                </Text>
                <Text size="sm" fw={600} c="red">
                  {formatNumber(remaining)}
                </Text>
              </div>
            </Group>

            <Stack gap="xs">
              <Text size="sm" fw={500}>
                {t('totalPaid')}
              </Text>
              <NumberInput
                value={amount}
                onChange={(v) => setAmount(Number(v) || 0)}
                min={ownerPaid}
                max={payoutCap > 0 ? payoutCap : undefined}
                thousandSeparator="."
                decimalSeparator=","
              />
              <Button
                  size="xs"
                  color="vbnbGreen"
                  loading={loading}
                  disabled={
                    amount < ownerPaid ||
                    (payoutCap > 0 && amount > payoutCap) ||
                    amount === ownerPaid
                  }
                  onClick={() => markPaid(amount)}
                >
                  {t('confirmPaid')}
                </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
