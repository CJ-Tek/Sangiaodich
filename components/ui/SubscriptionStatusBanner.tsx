'use client';

import { Group, Stack, Text, Box } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { LinkButton } from '@/components/ui/LinkButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { colors, motion, radius, shadows, typography } from '@/config/design-tokens';

export function SubscriptionStatusBanner({
  active,
  periodEnd,
  href,
  activeDescription,
  inactiveDescription,
  activeActionLabel,
  inactiveActionLabel,
}: {
  active: boolean;
  periodEnd?: string | null;
  href: string;
  activeDescription?: string;
  inactiveDescription?: string;
  activeActionLabel?: string;
  inactiveActionLabel?: string;
}) {
  const t = useTranslations('subscription.statusBanner');
  const bg = active ? colors.primarySoft : colors.dangerSoft;
  const accent = active ? colors.success : colors.danger;
  const title = active ? t('activeTitle') : t('inactiveTitle');
  const description = active
    ? activeDescription || t('defaultActiveDesc')
    : inactiveDescription || t('defaultInactiveDesc');

  return (
    <SurfaceCard
      p="md"
      style={{
        background: bg,
        borderColor: active ? colors.border : `${colors.danger}40`,
        boxShadow: active ? shadows.card : shadows.xs,
        transition: `box-shadow ${motion.normal}ms ${motion.easing}, border-color ${motion.normal}ms ${motion.easing}`,
      }}
    >
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Box
            style={{
              width: 10,
              height: 10,
              borderRadius: radius.full,
              background: accent,
              flexShrink: 0,
              boxShadow: `0 0 0 3px ${active ? colors.successSoft : colors.dangerSoft}`,
            }}
          />
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text
              fw={600}
              size="sm"
              style={{
                color: colors.textPrimary,
                letterSpacing: typography.subtitle.letterSpacing,
              }}
            >
              {title}
              <Text component="span" fw={500} c="dimmed" ml={8}>
                {active ? t('activeStatus') : t('inactiveStatus')}
              </Text>
            </Text>
            <Text
              size="sm"
              style={{
                color: colors.textSecondary,
                lineHeight: typography.body.lineHeight,
              }}
            >
              {description}
              {periodEnd ? ` · ${t('periodUntil', { date: periodEnd })}` : ''}
            </Text>
          </Stack>
        </Group>
        <LinkButton
          href={href}
          size="xs"
          variant={active ? 'default' : 'filled'}
          color={active ? undefined : 'vbnbGreen'}
        >
          {active
            ? activeActionLabel || t('defaultActiveAction')
            : inactiveActionLabel || t('defaultInactiveAction')}
        </LinkButton>
      </Group>
    </SurfaceCard>
  );
}
