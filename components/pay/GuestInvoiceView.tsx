'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Code,
  Group,
  Image,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import { ownerTransferMemo } from '@/lib/engines/booking-search';
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

export type GuestInvoiceViewProps = {
  bookingId: string;
  status: string;
  villaTitle: string;
  assetSlug: string | null;
  checkIn: string;
  checkOut: string;
  listPrice: number;
  amountCollected: number;
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
  const amounts = guestInvoiceAmounts({
    listPrice: props.listPrice,
    amountCollected: props.amountCollected,
  });
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
  const paidInFull = amounts.remainingFull <= 0;
  const memo = ownerTransferMemo(props.bookingId);
  const qrAmount = guestInvoiceQrAmount(preset, amounts);

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

  return (
    <Stack gap="md" maw={480} mx="auto">
      <div>
        <Title order={3}>{props.villaTitle}</Title>
        <Text size="sm" c="dimmed" mt={4}>
          {props.checkIn} → {props.checkOut}
        </Text>
        <Text size="sm" mt={4}>
          Sale: {props.saleName}
          {props.salePhone ? ` · ${props.salePhone}` : ''}
        </Text>
        <Group gap="xs" mt="sm">
          <Text size="xs" c="dimmed">
            Mã CK
          </Text>
          <Code>{memo}</Code>
        </Group>
      </div>

      {paidInFull ? (
        <Alert color="vbnbGreen" title="Đã ghi nhận đủ">
          Sale đã xác nhận thu đủ giá bán cho booking này.
        </Alert>
      ) : (
        <>
          {!expired ? (
            <Alert
              color={unlocked ? 'yellow' : 'vbnbGreen'}
              title={`Còn ${formatCountdown(leftMs)} để chuyển`}
            >
              {unlocked
                ? 'Chuyển nhanh để Sale gửi Owner giữ chỗ. Lịch chưa khóa — chậm có thể bị người khác book.'
                : 'Phòng đã được xác nhận. Chuyển nốt phần còn lại theo QR bên dưới.'}
            </Alert>
          ) : (
            <Alert color="red" title="Hết thời gian trên link này">
              {unlocked
                ? 'Booking này có thể đã bị người khác book. Hãy liên hệ lại Sale hoặc kiểm tra lịch trên trang.'
                : 'Link đã hết hạn. Liên hệ Sale nếu bạn vừa chuyển khoản.'}
              {props.assetSlug ? (
                <>
                  {' '}
                  <LinkAnchor href={`/a/${props.assetSlug}`} c="vbnbGreen.6">
                    Xem lịch villa
                  </LinkAnchor>
                </>
              ) : null}
            </Alert>
          )}

          <Paper
            p="md"
            radius={radius.lg}
            style={{
              border: `1px solid ${colors.border}`,
              opacity: expired ? 0.72 : 1,
            }}
          >
            <Stack gap="sm">
              <SegmentedControl
                value={preset}
                onChange={(v) => setPreset(v as GuestInvoicePreset)}
                data={[
                  {
                    value: 'deposit',
                    label: `Chuyển cọc (${amounts.depositChunk.toLocaleString('vi-VN')})`,
                    disabled: !amounts.canDeposit,
                  },
                  {
                    value: 'full',
                    label: `Chuyển full (${amounts.remainingFull.toLocaleString('vi-VN')})`,
                    disabled: !amounts.canFull,
                  },
                ]}
                color="vbnbGreen"
                fullWidth
              />

              {qrUrl && qrAmount > 0 ? (
                <Image src={qrUrl} alt="QR chuyển khoản" maw={220} mx="auto" radius="md" />
              ) : (
                <Text size="sm" c="dimmed" ta="center">
                  Chưa tạo được QR — dùng STK bên dưới và dán mã CK.
                </Text>
              )}

              <Text ta="center" fw={600}>
                {qrAmount.toLocaleString('vi-VN')}đ
              </Text>
              <Group justify="center" gap="xs">
                <Badge variant="light" color="vbnbGreen">
                  {dynamicQr ? 'VietQR' : 'QR tĩnh'}
                </Badge>
                <Code>{memo}</Code>
              </Group>
              <Text size="sm" ta="center">
                {props.payout.bankName ? `${props.payout.bankName} · ` : ''}
                {props.payout.accountNumber}
                {props.payout.accountName ? ` · ${props.payout.accountName}` : ''}
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                Nội dung CK phải có mã {memo} để Sale đối soát.
              </Text>
            </Stack>
          </Paper>
        </>
      )}
    </Stack>
  );
}
