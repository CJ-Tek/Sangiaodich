'use client';

import { Button, Paper, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { colors, radius } from '@/config/design-tokens';

export function SubscriptionLocked({
  role,
  status,
}: {
  role: 'SALE' | 'OWNER';
  status?: string | null;
  payment?: unknown;
  phone?: string | null;
  email?: string | null;
}) {
  const isPending = status === 'PENDING_PAYMENT' || !status;
  const isExpired = status === 'EXPIRED';
  const subHref =
    role === 'SALE'
      ? '/sale/settings?tab=subscription'
      : '/owner/subscription';

  return (
    <Stack gap="md" maw={480} mx="auto" mt={48}>
      <Paper
        p="xl"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Stack gap="md">
          <Title order={2} fw={600} style={{ letterSpacing: '-0.02em' }}>
            {isExpired ? 'Subscription hết hạn' : 'Chờ kích hoạt'}
          </Title>
          <Text c="dimmed" size="sm">
            {isPending
              ? 'Chọn gói trên trang Subscription, quét QR (nội dung CK đã sẵn) để kích hoạt.'
              : isExpired
                ? 'Kỳ phí đã hết. Chọn gói và thanh toán để mở lại.'
                : 'Subscription chưa ACTIVE. Vào Subscription để chọn gói.'}
          </Text>
          <Text size="sm" fw={500} c="vbnbGreen.6">
            Trạng thái: {status || 'PENDING_PAYMENT'}
          </Text>
          <Button component={Link} href={subHref} color="vbnbGreen">
            Chọn gói & thanh toán
          </Button>
          {role === 'SALE' ? (
            <Button
              component={Link}
              href="/sale/settings?tab=profile"
              variant="light"
              color="gray"
            >
              Hồ sơ cá nhân
            </Button>
          ) : (
            <Button
              component={Link}
              href="/owner/profile"
              variant="light"
              color="gray"
            >
              Hồ sơ cá nhân
            </Button>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
