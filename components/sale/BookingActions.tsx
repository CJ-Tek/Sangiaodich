'use client';

import {
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useMemo, useState } from 'react';
import { ExportGuestInvoiceButton } from '@/components/sale/ExportGuestInvoiceButton';
import { minOwnerDepositToConfirm, minDepositToConfirm } from '@/lib/engines/pricing';
import { computeCancelRefund } from '@/lib/engines/cancellation';
import { FIRM_POLICY_SUMMARY } from '@/config/cancellation-policy';
import { useFormat } from '@/lib/i18n/use-format';

type BookingAction = 'submit_to_owner' | 'cancel';

export function BookingActions({
  bookingId,
  status,
  listPrice,
  amountCollected,
  ownerEarn,
  ownerPaid,
  checkIn,
  salePayoutReady,
  simpleUi = false,
}: {
  bookingId: string;
  status: string;
  listPrice: number;
  suggestedFloor?: number;
  amountCollected?: number | null;
  ownerEarn: number;
  ownerPaid: number;
  checkIn: string;
  salePayoutReady?: boolean;
  simpleUi?: boolean;
}) {
  const t = useTranslations('sale.bookingActions');
  const { formatNumber } = useFormat();
  const router = useRouter();
  const minOwnerPayout = minOwnerDepositToConfirm(ownerEarn);
  const minGuestDeposit = minDepositToConfirm(listPrice);
  const collected = Number(amountCollected || 0);
  const [loading, setLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [goodwill, setGoodwill] = useState(false);

  const canSubmit = simpleUi
    ? ownerEarn > 0
    : ownerEarn > 0 &&
      Number(ownerPaid || 0) >= minOwnerPayout &&
      collected >= minGuestDeposit;
  const submitBlockedReason = simpleUi
    ? ownerEarn <= 0
      ? t('noFloor')
      : ''
    : ownerEarn <= 0
      ? t('noFloor')
      : collected < minGuestDeposit
        ? t('needGuestDeposit', { amount: formatNumber(minGuestDeposit) })
        : t('needOwnerPayout', { amount: formatNumber(minOwnerPayout) });

  const refundPreview = useMemo(
    () =>
      computeCancelRefund({
        status,
        checkIn,
        amountCollected: collected,
        goodwillFullRefund: goodwill,
      }),
    [status, checkIn, collected, goodwill]
  );

  async function patch(
    action: BookingAction,
    amountCollectedValue?: number,
    extras?: { goodwillFullRefund?: boolean }
  ) {
    if (action === 'submit_to_owner' && !canSubmit) {
      notifications.show({
        color: 'red',
        message: submitBlockedReason,
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          action,
          amountCollected: amountCollectedValue ?? collected,
          goodwillFullRefund: extras?.goodwillFullRefund,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
        return;
      }
      if (action === 'cancel' && json.data?.refund) {
        const r = json.data.refund;
        notifications.show({
          color: 'vbnbGreen',
          message: t('cancelledRefund', {
            refund: formatNumber(Number(r.refundAmount)),
            kept: formatNumber(Number(r.keptAmount)),
          }),
        });
      } else {
        const messages: Record<BookingAction, string> = {
          submit_to_owner: t('submittedOwner'),
          cancel: t('cancelled'),
        };
        notifications.show({
          color: 'vbnbGreen',
          message: messages[action] || t('ok'),
        });
      }
      setCancelOpen(false);
      setGoodwill(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const cancelModal = (
    <Modal
      opened={cancelOpen}
      onClose={() => {
        if (!loading) {
          setCancelOpen(false);
          setGoodwill(false);
        }
      }}
      title={t('cancelTitle')}
      centered
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          {t('policyLine', {
            code: refundPreview.policyCode,
            summary: FIRM_POLICY_SUMMARY,
          })}
        </Text>
        <Text size="sm">
          {t('daysUntilCheckIn', {
            days: refundPreview.daysUntilCheckIn,
            amount: formatNumber(refundPreview.amountCollected),
          })}
        </Text>
        <Group grow>
          <div>
            <Text size="xs" c="dimmed">
              {t('refundGuest')}
            </Text>
            <Text fw={600} c="vbnbGreen.6">
              {formatNumber(refundPreview.refundAmount)}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              {t('refundKept')}
            </Text>
            <Text fw={600}>{formatNumber(refundPreview.keptAmount)}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              {t('refundPercent')}
            </Text>
            <Text fw={600}>{refundPreview.refundPercent}%</Text>
          </div>
        </Group>
        <Checkbox
          label={t('goodwill')}
          checked={goodwill}
          onChange={(e) => setGoodwill(e.currentTarget.checked)}
        />
        <Text size="xs" c="dimmed">
          {t('offlineNote')}
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button
            variant="default"
            disabled={loading}
            onClick={() => {
              setCancelOpen(false);
              setGoodwill(false);
            }}
          >
            {t('close')}
          </Button>
          <Button
            color="red"
            loading={loading}
            onClick={() =>
              patch('cancel', undefined, { goodwillFullRefund: goodwill })
            }
          >
            {t('confirmCancel')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );

  if (status === 'CANCELLED' || status === 'CHECKED_OUT') {
    return null;
  }

  if (status === 'AWAITING_OWNER') {
    return (
      <>
        {cancelModal}
        <Stack gap="sm">
          <Group gap="xs" wrap="wrap">
            <Tooltip label={t('notLockedTooltip')} multiline w={260}>
              <Badge size="sm" variant="light" color="yellow" style={{ cursor: 'help' }}>
                {t('notLocked')}
              </Badge>
            </Tooltip>
            <Badge size="sm" variant="light" color="vbnbGreen">
              {t('sentOwner')}
            </Badge>
          </Group>
          <Group gap="xs" wrap="wrap">
            <ExportGuestInvoiceButton
              bookingId={bookingId}
              salePayoutReady={Boolean(salePayoutReady)}
              remaining={Math.max(0, listPrice - collected)}
            />
            <Button
              size="xs"
              color="red"
              variant="light"
              loading={loading}
              onClick={() => setCancelOpen(true)}
            >
              {t('cancelFullRefund')}
            </Button>
          </Group>
        </Stack>
      </>
    );
  }

  if (status === 'CONFIRMED' || status === 'CHECKED_IN') {
    return (
      <>
        {cancelModal}
        <Stack gap="sm">
          <Group gap="xs" wrap="wrap">
            <Button
              size="xs"
              color="red"
              variant="light"
              loading={loading}
              onClick={() => setCancelOpen(true)}
            >
              {t('cancel')}
            </Button>
          </Group>
        </Stack>
      </>
    );
  }

  return (
    <>
      {cancelModal}
      <Group gap="xs" wrap="wrap">
        <Tooltip label={submitBlockedReason} disabled={canSubmit}>
          <span>
            <Button
              size="xs"
              color="vbnbGreen"
              loading={loading}
              disabled={!canSubmit}
              onClick={() => patch('submit_to_owner')}
            >
              {t('submitOwner')}
            </Button>
          </span>
        </Tooltip>
        <ExportGuestInvoiceButton
          bookingId={bookingId}
          salePayoutReady={Boolean(salePayoutReady)}
          remaining={Math.max(0, listPrice - collected)}
        />
        <Button
          size="xs"
          color="red"
          variant="light"
          loading={loading}
          onClick={() => setCancelOpen(true)}
        >
          {t('cancel')}
        </Button>
      </Group>
    </>
  );
}
