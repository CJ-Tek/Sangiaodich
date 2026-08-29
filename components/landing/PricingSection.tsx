'use client';

import { Badge, Box, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { colors, radius, shadows, spacing, typography } from '@/config/design-tokens';
import { LinkButton } from '@/components/ui/LinkButton';
import { SectionShell } from '@/components/ui/SectionShell';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import {
  formatVnd,
  planDiscount,
  planDurationLabel,
  type SubscriptionPlan,
} from '@/lib/engines/subscription-plans';

type RoleTab = 'OWNER' | 'SALE';

export function PricingSection({
  ownerPlans,
  salePlans,
}: {
  ownerPlans: SubscriptionPlan[];
  salePlans: SubscriptionPlan[];
}) {
  const t = useTranslations('landing.pricing');
  const [tab, setTab] = useState<RoleTab>('OWNER');
  const plans = tab === 'OWNER' ? ownerPlans : salePlans;
  const ctaHref =
    tab === 'OWNER'
      ? '/login?mode=register&role=OWNER'
      : '/login?mode=register&role=SALE';
  const ctaLabel = tab === 'OWNER' ? t('ctaOwner') : t('ctaSale');

  return (
    <SectionShell id="pricing" large>
      <Stack gap={spacing['3xl']} align="center">
        <Stack gap="sm" align="center" maw={480}>
          <span className="vbnb-eyebrow">{t('eyebrow')}</span>
          <Title
            id="pricing-heading"
            order={2}
            ta="center"
            fw={typography.title.fontWeight}
            className="vbnb-text-balance"
            style={{
              fontSize: typography.title.fontSize,
              letterSpacing: typography.title.letterSpacing,
              lineHeight: typography.title.lineHeight,
              color: colors.textPrimary,
            }}
          >
            {t('title')}
          </Title>
          <Text
            ta="center"
            c={colors.textSecondary}
            style={{ lineHeight: typography.body.lineHeight }}
          >
            {t('subtitle')}
          </Text>
        </Stack>

        <Group justify="center">
          <Box
            role="tablist"
            aria-label={t('roleTabAria')}
            style={{
              display: 'inline-flex',
              background: colors.surfaceMuted,
              borderRadius: radius.lg,
              padding: spacing.xs,
              border: `1px solid ${colors.border}`,
            }}
          >
            {(
              [
                { id: 'OWNER' as const, label: t('ownerTab') },
                { id: 'SALE' as const, label: t('saleTab') },
              ] as const
            ).map((item) => {
              const active = tab === item.id;
              return (
                <Box
                  key={item.id}
                  component="button"
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                  style={{
                    border: 0,
                    cursor: 'pointer',
                    background: active ? colors.surface : 'transparent',
                    color: active ? colors.primaryDark : colors.textSecondary,
                    fontWeight: active ? 600 : 500,
                    fontSize: typography.body.fontSize,
                    fontFamily: 'inherit',
                    padding: `${spacing.sm + 2}px ${spacing.xl}px`,
                    borderRadius: radius.md,
                    boxShadow: active ? shadows.card : 'none',
                  }}
                >
                  {item.label}
                </Box>
              );
            })}
          </Box>
        </Group>

        {!plans.length ? (
          <Text ta="center" c={colors.textMuted} size="sm">
            {tab === 'OWNER' ? t('emptyOwner') : t('emptySale')}
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" w="100%">
            {plans.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} featured={index === 1 && plans.length > 2} />
            ))}
          </SimpleGrid>
        )}

        <LinkButton href={ctaHref} color="vbnbGreen" h={46} px={22} fw={600}>
          {ctaLabel}
        </LinkButton>
      </Stack>
    </SectionShell>
  );
}

function PlanCard({ plan, featured }: { plan: SubscriptionPlan; featured?: boolean }) {
  const discount = planDiscount(plan);
  const title = plan.label || planDurationLabel(plan.months);

  return (
    <SurfaceCard
      p="lg"
      style={{
        minHeight: 168,
        ...(featured
          ? {
              borderColor: colors.primary,
              boxShadow: shadows.cardHover,
            }
          : {}),
      }}
    >
      <Stack gap="sm">
        <Text size="sm" fw={600}>
          {title}
        </Text>
        {discount ? (
          <Badge size="sm" color="red" variant="light" w="fit-content">
            −{discount.percent}%
          </Badge>
        ) : null}
        <Text
          fw={typography.data.fontWeight}
          c="vbnbGreen.6"
          className="vbnb-tabular-nums"
          style={{
            fontSize: typography.data.fontSize,
            letterSpacing: typography.data.letterSpacing,
            lineHeight: typography.data.lineHeight,
          }}
        >
          {formatVnd(plan.amount)}
        </Text>
        {discount ? (
          <Text size="xs" c="dimmed" td="line-through" className="vbnb-tabular-nums">
            {formatVnd(discount.compareAt)}
          </Text>
        ) : null}
      </Stack>
    </SurfaceCard>
  );
}
