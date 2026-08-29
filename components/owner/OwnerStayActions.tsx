'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Group,
  Image,
  Stack,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { ExportGuestInvoiceButton } from '@/components/sale/ExportGuestInvoiceButton';
import {
  guestRemaining,
  isGuestDepositCase,
  isGuestPaidInFull,
} from '@/lib/engines/guest-balance';
import { ownerTransferMemo } from '@/lib/engines/booking-search';
import {
  hasOwnerPayoutInfo,
  type OwnerPayoutInfo,
} from '@/lib/owner/payout-info';
import {
  buildVietQrUrl,
  canBuildOwnerVietQr,
  resolveOwnerVietQrBank,
} from '@/lib/sepay/vietqr';
import { useFormat } from '@/lib/i18n/use-format';

export function OwnerStayActions({
  bookingId,
  status,
  listPrice,
  amountCollected,
  guestPaidOwner,
  payout,
}: {
  bookingId: string;
  status: string;
  listPrice: number;
  amountCollected: number;
  guestPaidOwner: number;
  payout: OwnerPayoutInfo;
}) {
  const t = useTranslations('owner.stayActions');
  const router = useRouter();
  const { formatNumber } = useFormat();
  const [loading, setLoading] = useState(false);
  const [received, setReceived] = useState(false);

  const remaining = guestRemaining(listPrice, amountCollected, guestPaidOwner);
  const caseA = isGuestDepositCase(listPrice, amountCollected);
  const paidInFull = isGuestPaidInFull(
    listPrice,
    amountCollected,
    guestPaidOwner
  );
  const remainderTarget = Math.max(0, listPrice - amountCollected);
  const memo = ownerTransferMemo(bookingId);
  const payoutReady = hasOwnerPayoutInfo(payout);

  const qrUrl = useMemo(() => {
    if (!canBuildOwnerVietQr(payout) || remaining <= 0) {
      return payout.qrImageUrl || null;
    }
    return buildVietQrUrl({
      accountNumber: payout.accountNumber,
      bank: resolveOwnerVietQrBank(payout),
      amount: remaining,
      description: memo,
    });
  }, [payout, remaining, memo]);

  async function patch(
    action: 'check_in' | 'check_out',
    guestPaidOwnerAmount?: number
  ) {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          action,
          guestPaidOwnerAmount,
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
        message: action === 'check_in' ? t('checkedIn') : t('checkedOut'),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === 'CHECKED_OUT' || status === 'CANCELLED') return null;

  if (status === 'CHECKED_IN') {
    return (
      <Button
        size="xs"
        color="vbnbGreen"
        loading={loading}
        onClick={() => patch('check_out')}
      >
        {t('checkOut')}
      </Button>
    );
  }

  if (status !== 'CONFIRMED') return null;

  return (
    <Stack gap="sm">
      {caseA && remaining > 0 ? (
        <Stack gap="xs">
          <Text size="xs" c="dimmed">
            {t('guestRemaining', { amount: formatNumber(remaining) })}
          </Text>
          {qrUrl ? (
            <Image src={qrUrl} alt={t('qrRemainder')} maw={200} radius="md" />
          ) : (
            <Text size="sm" c="dimmed">
              {t('qrFailed')}
            </Text>
          )}
          <Text size="sm">
            {payout.bankName ? `${payout.bankName} · ` : ''}
            {payout.accountNumber}
            {payout.accountName ? ` · ${payout.accountName}` : ''}
          </Text>
          <ExportGuestInvoiceButton
            bookingId={bookingId}
            salePayoutReady={payoutReady}
            remaining={remaining}
            settingsHref="/owner/profile"
          />
        </Stack>
      ) : null}

      {caseA && remaining > 0 ? (
        <Checkbox
          checked={received}
          onChange={(e) => setReceived(e.currentTarget.checked)}
          label={t('receivedRemainder')}
          size="sm"
        />
      ) : null}

      <Button
        size="xs"
        color="vbnbGreen"
        loading={loading}
        disabled={caseA && remaining > 0 && !received}
        onClick={() => {
          if (caseA && remaining > 0 && !received) {
            notifications.show({
              color: 'yellow',
              message: t('confirmRemainder'),
            });
            return;
          }
          if (!paidInFull && caseA) {
            void patch('check_in', remainderTarget);
            return;
          }
          void patch('check_in');
        }}
      >
        {t('checkIn')}
      </Button>
    </Stack>
  );
}
