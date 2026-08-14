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
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ExportGuestInvoiceButton } from '@/components/sale/ExportGuestInvoiceButton';
import { minOwnerDepositToConfirm } from '@/lib/engines/pricing';
import { computeCancelRefund } from '@/lib/engines/cancellation';
import { FIRM_POLICY_SUMMARY } from '@/config/cancellation-policy';

type BookingAction =
  | 'submit_to_owner'
  | 'cancel'
  | 'check_in'
  | 'check_out';

export function BookingActions({
  bookingId,
  status,
  listPrice,
  amountCollected,
  ownerEarn,
  ownerPaid,
  checkIn,
  salePayoutReady,
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
}) {
  const router = useRouter();
  const minOwnerPayout = minOwnerDepositToConfirm(ownerEarn);
  const [loading, setLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [goodwill, setGoodwill] = useState(false);

  const canSubmit =
    ownerEarn > 0 && Number(ownerPaid || 0) >= minOwnerPayout;
  const submitBlockedReason =
    ownerEarn <= 0
      ? 'Chưa có giá gốc — không gửi Owner được'
      : `Cần xác nhận CK Owner tối thiểu ${minOwnerPayout.toLocaleString('vi-VN')} (50% giá gốc)`;

  const collected = Number(amountCollected || 0);
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
          message: `Đã hủy · hoàn ${Number(r.refundAmount).toLocaleString('vi-VN')} · giữ ${Number(r.keptAmount).toLocaleString('vi-VN')}`,
        });
      } else {
        const messages: Record<BookingAction, string> = {
          submit_to_owner: 'Đã gửi Owner — chờ xác nhận (chưa khóa lịch)',
          cancel: 'Đã hủy booking',
          check_in: 'Đã check-in',
          check_out: 'Đã check-out',
        };
        notifications.show({
          color: 'vbnbGreen',
          message: messages[action] || 'OK',
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
      title="Hủy booking?"
      centered
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Policy {refundPreview.policyCode}: {FIRM_POLICY_SUMMARY}
        </Text>
        <Text size="sm">
          Còn{' '}
          <Text span fw={600}>
            {refundPreview.daysUntilCheckIn}
          </Text>{' '}
          ngày đến check-in · đã thu{' '}
          <Text span fw={600}>
            {refundPreview.amountCollected.toLocaleString('vi-VN')}
          </Text>
        </Text>
        <Group grow>
          <div>
            <Text size="xs" c="dimmed">
              Hoàn khách
            </Text>
            <Text fw={600} c="vbnbGreen.6">
              {refundPreview.refundAmount.toLocaleString('vi-VN')}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Giữ lại
            </Text>
            <Text fw={600}>
              {refundPreview.keptAmount.toLocaleString('vi-VN')}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              % hoàn
            </Text>
            <Text fw={600}>{refundPreview.refundPercent}%</Text>
          </div>
        </Group>
        <Checkbox
          label="Goodwill — hoàn 100% cọc (ngoại lệ ngoài policy)"
          checked={goodwill}
          onChange={(e) => setGoodwill(e.currentTarget.checked)}
        />
        <Text size="xs" c="dimmed">
          Tiền offline: sale tự chuyển lại khách theo số hoàn. Lịch sẽ được nhả.
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
            Đóng
          </Button>
          <Button
            color="red"
            loading={loading}
            onClick={() =>
              patch('cancel', undefined, { goodwillFullRefund: goodwill })
            }
          >
            Xác nhận hủy
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
            <Tooltip
              label="Ngày chưa khóa — Sale khác vẫn có thể book trùng đến khi Owner confirm"
              multiline
              w={260}
            >
              <Badge size="sm" variant="light" color="yellow" style={{ cursor: 'help' }}>
                Chưa khóa lịch
              </Badge>
            </Tooltip>
            <Badge size="sm" variant="light" color="vbnbGreen">
              Đã gửi Owner
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
              Hủy (hoàn 100% cọc)
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
            <ExportGuestInvoiceButton
              bookingId={bookingId}
              salePayoutReady={Boolean(salePayoutReady)}
              remaining={Math.max(0, listPrice - collected)}
            />
            {status === 'CONFIRMED' ? (
              <Button
                size="xs"
                color="vbnbGreen"
                loading={loading}
                onClick={() => patch('check_in')}
              >
                Check-in
              </Button>
            ) : null}
            {status === 'CHECKED_IN' ? (
              <Button
                size="xs"
                color="vbnbGreen"
                loading={loading}
                onClick={() => patch('check_out')}
              >
                Check-out
              </Button>
            ) : null}
            <Button
              size="xs"
              color="red"
              variant="light"
              loading={loading}
              onClick={() => setCancelOpen(true)}
            >
              Cancel
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
              Gửi Owner xác nhận
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
          Cancel
        </Button>
      </Group>
    </>
  );
}
