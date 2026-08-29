'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Code,
  Group,
  Image,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ownerTransferMemo } from '@/lib/engines/booking-search';
import { guestRemaining } from '@/lib/engines/guest-balance';
import {
  calendarUnlockedForInvoice,
  guestInvoiceAmounts,
  guestInvoiceQrAmount,
  isGuestInvoiceExpired,
  type GuestInvoicePreset,
} from '@/lib/engines/guest-invoice';
import {
  buildVietQrUrl,
  canBuildOwnerVietQr,
  resolveOwnerVietQrBank,
} from '@/lib/sepay/vietqr';
import type { OwnerPayoutInfo } from '@/lib/owner/payout-info';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { useFormat } from '@/lib/i18n/use-format';

export type GuestInvoiceViewProps = {
  bookingId: string;
  status: string;
  villaTitle: string;
  assetSlug: string | null;
  checkIn: string;
  checkOut: string;
  listPrice: number;
  amountCollected: number;
  guestPaidOwner?: number;
  payee?: 'SALE' | 'OWNER';
  saleName: string;
  salePhone: string;
  expiresAt: string;
  payout: OwnerPayoutInfo;
};

function formatCountdown(ms: number) {
  if (ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GuestInvoiceView(props: GuestInvoiceViewProps) {
  const t = useTranslations('pay.invoice');
  const { formatNumber, formatVnd } = useFormat();
  const payee = props.payee === 'OWNER' ? 'OWNER' : 'SALE';
  const amounts = guestInvoiceAmounts({
    listPrice: props.listPrice,
    amountCollected: props.amountCollected,
  });
  const ownerRemainder = guestRemaining(
    props.listPrice,
    props.amountCollected,
    props.guestPaidOwner
  );
  const defaultPreset: GuestInvoicePreset = amounts.canDeposit
    ? 'deposit'
    : 'full';
  const [preset, setPreset] = useState<GuestInvoicePreset>(defaultPreset);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const expired = isGuestInvoiceExpired(props.expiresAt, now);
  const leftMs = Math.max(0, new Date(props.expiresAt).getTime() - now);
  const unlocked = calendarUnlockedForInvoice(props.status);
  const paidInFull =
    payee === 'OWNER' ? ownerRemainder <= 0 : amounts.remainingFull <= 0;
  const memo = ownerTransferMemo(props.bookingId);
  const qrAmount =
    payee === 'OWNER' ? ownerRemainder : guestInvoiceQrAmount(preset, amounts);

  const dynamicQr = useMemo(() => {
    if (!canBuildOwnerVietQr(props.payout) || qrAmount <= 0) return null;
    return buildVietQrUrl({
      accountNumber: props.payout.accountNumber,
      bank: resolveOwnerVietQrBank(props.payout),
      amount: qrAmount,
      description: memo,
    });
  }, [props.payout, qrAmount, memo]);

  const qrUrl = dynamicQr || props.payout.qrImageUrl || null;
  const payeeLabel = payee === 'OWNER' ? t('payeeOwner') : t('payeeSale');

  return (
    <Stack gap="md" maw={480} mx="auto">
      <div>
        <Title order={3}>{props.villaTitle}</Title>
        <Text size="sm" c="dimmed" mt={4}>
          {props.checkIn} → {props.checkOut}
        </Text>
        <Text size="sm" mt={4}>
          {payee === 'OWNER'
            ? t('payOwnerAtCheckIn')
            : t('saleContact', {
                name: props.saleName,
                phone: props.salePhone ? ` · ${props.salePhone}` : '',
              })}
        </Text>
        <Group gap="xs" mt="sm">
          <Text size="xs" c="dimmed">
            {t('memoLabel')}
          </Text>
          <Code>{memo}</Code>
        </Group>
      </div>

      {paidInFull ? (
        <Alert color="vbnbGreen" title={t('paidFull')}>
          {payee === 'OWNER' ? t('ownerPaidNote') : t('salePaidNote')}
        </Alert>
      ) : (
        <>
          {!expired ? (
            <Alert
              color={unlocked && payee === 'SALE' ? 'yellow' : 'vbnbGreen'}
              title={t('countdown', { time: formatCountdown(leftMs) })}
            >
              {payee === 'OWNER'
                ? t('ownerRemainderHint')
                : unlocked
                  ? t('saleDepositHint')
                  : t('confirmedRemainder')}
            </Alert>
          ) : (
            <Alert color="red" title={t('expiredTitle')}>
              {t('expiredBody')}
              {unlocked && payee === 'SALE' ? ` ${t('mayBeTaken')}` : null}
              {props.assetSlug ? (
                <>
                  {' '}
                  <LinkAnchor href={`/a/${props.assetSlug}`} c="vbnbGreen.6">
                    {t('viewCalendar')}
                  </LinkAnchor>
                </>
              ) : null}
            </Alert>
          )}

          <SurfaceCard
            p="md"
            style={{
              opacity: expired ? 0.72 : 1,
            }}
          >
            <Stack gap="sm">
              {payee === 'SALE' ? (
                <SegmentedControl
                  value={preset}
                  onChange={(v) => setPreset(v as GuestInvoicePreset)}
                  data={[
                    {
                      value: 'deposit',
                      label: t('depositPreset', {
                        amount: formatNumber(amounts.depositChunk),
                      }),
                      disabled: !amounts.canDeposit,
                    },
                    {
                      value: 'full',
                      label: t('fullPreset', {
                        amount: formatNumber(amounts.remainingFull),
                      }),
                      disabled: !amounts.canFull,
                    },
                  ]}
                  color="vbnbGreen"
                  fullWidth
                />
              ) : (
                <Text size="sm" ta="center" c="dimmed">
                  {t('remainderAtCheckIn')}
                </Text>
              )}

              {qrUrl && qrAmount > 0 ? (
                <Image src={qrUrl} alt={t('qrTitle')} maw={220} mx="auto" radius="md" />
              ) : (
                <Text size="sm" c="dimmed" ta="center">
                  {t('qrFailed')}
                </Text>
              )}

              <Text ta="center" fw={600}>
                {formatVnd(qrAmount)}
              </Text>
              <Group justify="center" gap="xs">
                <Badge variant="light" color="vbnbGreen">
                  {dynamicQr ? t('vietQr') : t('staticQr')}
                </Badge>
                <Code>{memo}</Code>
              </Group>
              <Text size="sm" ta="center">
                {props.payout.bankName ? `${props.payout.bankName} · ` : ''}
                {props.payout.accountNumber}
                {props.payout.accountName ? ` · ${props.payout.accountName}` : ''}
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                {t('memoRequired', { memo, payee: payeeLabel })}
              </Text>
            </Stack>
          </SurfaceCard>
        </>
      )}
    </Stack>
  );
}
