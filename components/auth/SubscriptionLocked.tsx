'use client';

import { Button, Paper, Stack, Text, Title } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { colors, radius } from '@/config/design-tokens';
import { isSubscriptionActive } from '@/lib/engines/subscription';

export function SubscriptionLocked({
  role,
  status,
  periodEnd,
}: {
  role: 'SALE' | 'OWNER';
  status?: string | null;
  periodEnd?: string | null;
  payment?: unknown;
  phone?: string | null;
  email?: string | null;
}) {
  const t = useTranslations('subscriptionLocked');
  const coversToday =
    Boolean(status && periodEnd) &&
    isSubscriptionActive({ status: status!, periodEnd: periodEnd! });
  const periodLapsed = status === 'ACTIVE' && Boolean(periodEnd) && !coversToday;
  const isPending = (status === 'PENDING_PAYMENT' || !status) && !periodLapsed;
  const isExpired = status === 'EXPIRED' || periodLapsed;
  const subHref =
    role === 'SALE'
      ? '/sale/settings?tab=subscription'
      : '/owner/subscription';
  const profileHref =
    role === 'SALE' ? '/sale/settings?tab=profile' : '/owner/profile';

  return (
    <Stack gap="md" maw={480} mx="auto" mt={48}>
      <Paper
        p="xl"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Stack gap="md">
          <Title order={2} fw={600} style={{ letterSpacing: '-0.02em' }}>
            {isExpired ? t('expiredTitle') : t('pendingTitle')}
          </Title>
          <Text c="dimmed" size="sm">
            {isPending
              ? t('pendingDesc')
              : isExpired
                ? t('expiredDesc')
                : t('inactiveDesc')}
          </Text>
          <Text size="sm" fw={500} c="vbnbGreen.6">
            {periodLapsed && periodEnd
              ? t('lapsedLabel', { date: periodEnd })
              : t('statusLabel', { status: status || 'PENDING_PAYMENT' })}
          </Text>
          <Button component={Link} href={subHref} color="vbnbGreen">
            {t('choosePlan')}
          </Button>
          <Button
            component={Link}
            href={profileHref}
            variant="light"
            color="gray"
          >
            {t('profile')}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
