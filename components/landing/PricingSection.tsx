'use client';

import { Badge, Box, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { colors, radius, shadows } from '@/config/design-tokens';
import { landingContainer } from '@/components/landing/landing-media';
import { LinkButton } from '@/components/ui/LinkButton';
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
  const [tab, setTab] = useState<RoleTab>('OWNER');
  const plans = tab === 'OWNER' ? ownerPlans : salePlans;
  const ctaHref =
    tab === 'OWNER'
      ? '/login?mode=register&role=OWNER'
      : '/login?mode=register&role=SALE';
  const ctaLabel =
    tab === 'OWNER' ? 'Đăng ký Chủ villa' : 'Đăng ký Sale';

  return (
    <Box
      id="pricing"
      component="section"
      className="vbnb-landing-section"
      aria-labelledby="pricing-heading"
      style={{
        ...landingContainer,
        paddingTop: 'clamp(64px, 10vw, 120px)',
        paddingBottom: 'clamp(64px, 10vw, 120px)',
      }}
    >
      <Stack gap={8} align="center" mb={28}>
        <Text
          fw={600}
          c="vbnbGreen.6"
          style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          Bảng giá
        </Text>
        <Title
          id="pricing-heading"
          order={2}
          ta="center"
          fw={700}
          style={{
            fontSize: 'clamp(1.75rem, 3.4vw, 2.5rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
          }}
        >
          Rõ ràng từ đầu.
        </Title>
        <Text ta="center" c={colors.textSecondary} maw={480} style={{ lineHeight: 1.65 }}>
          Phí để vào sàn VBNB. Gói càng dài, ưu đãi càng nhiều.
        </Text>
      </Stack>

      <Group justify="center" mb={32}>
        <Box
          role="tablist"
          aria-label="Chọn vai trò"
          style={{
            display: 'inline-flex',
            background: colors.surfaceMuted,
            borderRadius: radius.lg,
            padding: 4,
            border: `1px solid ${colors.border}`,
          }}
        >
          {(
            [
              { id: 'OWNER' as const, label: 'Chủ villa' },
              { id: 'SALE' as const, label: 'Sale' },
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
                  fontSize: 14,
                  fontFamily: 'inherit',
                  padding: '10px 22px',
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
          Chưa có gói {tab === 'OWNER' ? 'Chủ villa' : 'Sale'} đang bật.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </SimpleGrid>
      )}

      <Group justify="center" mt={32}>
        <LinkButton href={ctaHref} color="vbnbGreen" h={46} px={22} fw={600}>
          {ctaLabel}
        </LinkButton>
      </Group>
    </Box>
  );
}

function PlanCard({ plan }: { plan: SubscriptionPlan }) {
  const discount = planDiscount(plan);
  const title = plan.label || planDurationLabel(plan.months);

  return (
    <Box
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        padding: 20,
        minHeight: 168,
      }}
    >
      <Stack gap={8}>
        <Text size="sm" fw={600}>
          {title}
        </Text>
        {discount ? (
          <Badge size="sm" color="red" variant="light" w="fit-content">
            −{discount.percent}%
          </Badge>
        ) : null}
        <Text fw={700} c="vbnbGreen.6" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
          {formatVnd(plan.amount)}
        </Text>
        {discount ? (
          <Text size="xs" c="dimmed" td="line-through">
            {formatVnd(discount.compareAt)}
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
}
