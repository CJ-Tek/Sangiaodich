'use client';

import { Badge, Box, Group, Stack, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { colors, radius, shadows, spacing, typography } from '@/config/design-tokens';
import { LinkButton } from '@/components/ui/LinkButton';
import { Reveal } from '@/components/landing/Reveal';
import { SectionShell } from '@/components/ui/SectionShell';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import {
  formatVnd,
  planDiscount,
  planDurationLabel,
  type SubscriptionPlan,
} from '@/lib/engines/subscription-plans';

type RoleTab = 'OWNER' | 'SALE';

function featuredPlanId(plans: SubscriptionPlan[]): string | undefined {
  let best: { id: string; percent: number } | undefined;
  for (const plan of plans) {
    const discount = planDiscount(plan);
    if (discount && (!best || discount.percent > best.percent)) {
      best = { id: plan.id, percent: discount.percent };
    }
  }
  if (best) return best.id;
  return plans.length > 2 ? plans[1].id : undefined;
}

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
  const featuredId = featuredPlanId(plans);
  const ctaHref =
    tab === 'OWNER'
      ? '/login?mode=register&role=OWNER'
      : '/login?mode=register&role=SALE';
  const ctaLabel = tab === 'OWNER' ? t('ctaOwner') : t('ctaSale');

  return (
    <SectionShell
      id="pricing"
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('subtitle')}
      align="center"
      tone="surface"
    >
      <Stack gap={spacing['3xl']} align="center">
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
                    color: active ? colors.primary : colors.textSecondary,
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
          <div className="vbnb-grid vbnb-grid-4" style={{ width: '100%' }}>
            {plans.map((plan, index) => (
              <Reveal key={plan.id} delay={index * 70}>
                <PlanCard plan={plan} featured={plan.id === featuredId} />
              </Reveal>
            ))}
          </div>
        )}

        <LinkButton href={ctaHref} color="vbnbGreen" size="md" h={48} px={28}>
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
      p="xl"
      h="100%"
      style={{
        ...(featured
          ? {
              borderColor: colors.primary,
              boxShadow: `0 0 0 1px ${colors.primary}, ${shadows.cardHover}`,
            }
          : {}),
      }}
    >
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text fw={600} c={colors.textPrimary}>
            {title}
          </Text>
          {discount ? (
            <Badge size="sm" color="red" variant="light">
              −{discount.percent}%
            </Badge>
          ) : null}
        </Group>
        <Stack gap={4} mt="auto">
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
            <Text size="sm" c="dimmed" td="line-through" className="vbnb-tabular-nums">
              {formatVnd(discount.compareAt)}
            </Text>
          ) : null}
        </Stack>
      </Stack>
    </SurfaceCard>
  );
}
