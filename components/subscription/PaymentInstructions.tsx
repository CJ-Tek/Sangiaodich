'use client';

import { Button, Group, Image, Stack, Text, CopyButton } from '@mantine/core';
import { useTranslations } from 'next-intl';
import {
  buildTransferContent,
  hasPaymentInfo,
  type PlatformPaymentInfo,
} from '@/lib/platform/payment-info';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useFormat } from '@/lib/i18n/use-format';

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
  const t = useTranslations('subscription.paymentInstructions');
  const tCommon = useTranslations('common');
  const { formatVnd } = useFormat();

  if (!hasPaymentInfo(payment)) {
    return (
      <SurfaceCard p={compact ? 'md' : 'lg'}>
        <Text size="sm" c="dimmed">
          {t('noPaymentInfo')}
        </Text>
      </SurfaceCard>
    );
  }

  const transferContent = buildTransferContent({ phone, email });

  return (
    <SurfaceCard p={compact ? 'md' : 'lg'}>
      <Stack gap={compact ? 'xs' : 'sm'}>
        <Text size="sm" c="dimmed">
          {t('offlineTransfer')}
        </Text>
        {payment.bankName ? (
          <div>
            <Text size="xs" c="dimmed">
              {t('bank')}
            </Text>
            <Text fw={600} size="sm">
              {payment.bankName}
            </Text>
          </div>
        ) : null}
        {payment.accountName ? (
          <div>
            <Text size="xs" c="dimmed">
              {t('accountName')}
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
                {t('accountNumber')}
              </Text>
              <Text fw={600} size="sm" style={{ wordBreak: 'break-all' }}>
                {payment.accountNumber}
              </Text>
            </div>
            <CopyButton value={payment.accountNumber}>
              {({ copied, copy }) => (
                <Button size="xs" variant="light" color="vbnbGreen" onClick={copy}>
                  {copied ? tCommon('copied') : tCommon('copy')}
                </Button>
              )}
            </CopyButton>
          </Group>
        ) : null}
        {typeof amount === 'number' ? (
          <div>
            <Text size="xs" c="dimmed">
              {t('amountPerMonth')}
            </Text>
            <Text fw={600} size="sm" c="vbnbGreen.6">
              {formatVnd(amount)}
            </Text>
          </div>
        ) : null}
        <Group justify="space-between" align="flex-end" wrap="nowrap">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" c="dimmed">
              {t('transferContent')}
            </Text>
            <Text fw={600} size="sm" style={{ wordBreak: 'break-all' }}>
              {transferContent}
            </Text>
          </div>
          <CopyButton value={transferContent}>
            {({ copied, copy }) => (
              <Button size="xs" variant="light" color="vbnbGreen" onClick={copy}>
                {copied ? tCommon('copied') : tCommon('copy')}
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
            {t('contact')}{' '}
            <Text span fw={500}>
              {payment.contact}
            </Text>
          </Text>
        ) : null}
        {!compact && payment.qrImageUrl ? (
          <Image
            src={payment.qrImageUrl}
            alt={t('qrAlt')}
            maw={200}
            radius="md"
            mt="xs"
          />
        ) : null}
      </Stack>
    </SurfaceCard>
  );
}
