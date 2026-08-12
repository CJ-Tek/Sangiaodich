'use client';

import { Button, Group, Image, Paper, Stack, Text, CopyButton } from '@mantine/core';
import {
  buildTransferContent,
  hasPaymentInfo,
  type PlatformPaymentInfo,
} from '@/lib/platform/payment-info';
import { colors, radius } from '@/config/design-tokens';

export function PaymentInstructions({
  payment,
  amount,
  phone,
  email,
  compact,
}: {
  payment: PlatformPaymentInfo;
  amount?: number;
  phone?: string | null;
  email?: string | null;
  compact?: boolean;
}) {
  if (!hasPaymentInfo(payment)) {
    return (
      <Paper
        p={compact ? 'md' : 'lg'}
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Text size="sm" c="dimmed">
          Chưa có thông tin chuyển khoản — liên hệ Admin để được hướng dẫn
          thanh toán.
        </Text>
      </Paper>
    );
  }

  const transferContent = buildTransferContent({ phone, email });

  return (
    <Paper
      p={compact ? 'md' : 'lg'}
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Stack gap={compact ? 'xs' : 'sm'}>
        <Text size="sm" c="dimmed">
          Chuyển khoản offline
        </Text>
        {payment.bankName ? (
          <div>
            <Text size="xs" c="dimmed">
              Ngân hàng
            </Text>
            <Text fw={600} size="sm">
              {payment.bankName}
            </Text>
          </div>
        ) : null}
        {payment.accountName ? (
          <div>
            <Text size="xs" c="dimmed">
              Chủ tài khoản
            </Text>
            <Text fw={600} size="sm">
              {payment.accountName}
            </Text>
          </div>
        ) : null}
        {payment.accountNumber ? (
          <Group justify="space-between" align="flex-end" wrap="nowrap">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" c="dimmed">
                Số tài khoản
              </Text>
              <Text fw={600} size="sm" style={{ wordBreak: 'break-all' }}>
                {payment.accountNumber}
              </Text>
            </div>
            <CopyButton value={payment.accountNumber}>
              {({ copied, copy }) => (
                <Button size="xs" variant="light" color="vbnbGreen" onClick={copy}>
                  {copied ? 'Đã copy' : 'Sao chép'}
                </Button>
              )}
            </CopyButton>
          </Group>
        ) : null}
        {typeof amount === 'number' ? (
          <div>
            <Text size="xs" c="dimmed">
              Số tiền / tháng
            </Text>
            <Text fw={600} size="sm" c="vbnbGreen.6">
              {amount.toLocaleString('vi-VN')}đ
            </Text>
          </div>
        ) : null}
        <Group justify="space-between" align="flex-end" wrap="nowrap">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" c="dimmed">
              Nội dung chuyển khoản
            </Text>
            <Text fw={600} size="sm" style={{ wordBreak: 'break-all' }}>
              {transferContent}
            </Text>
          </div>
          <CopyButton value={transferContent}>
            {({ copied, copy }) => (
              <Button size="xs" variant="light" color="vbnbGreen" onClick={copy}>
                {copied ? 'Đã copy' : 'Sao chép'}
              </Button>
            )}
          </CopyButton>
        </Group>
        {payment.transferNote ? (
          <Text size="sm" c="dimmed">
            {payment.transferNote}
          </Text>
        ) : null}
        {payment.contact ? (
          <Text size="sm">
            Liên hệ:{' '}
            <Text span fw={500}>
              {payment.contact}
            </Text>
          </Text>
        ) : null}
        {!compact && payment.qrImageUrl ? (
          <Image
            src={payment.qrImageUrl}
            alt="QR thanh toán"
            maw={200}
            radius="md"
            mt="xs"
          />
        ) : null}
      </Stack>
    </Paper>
  );
}
