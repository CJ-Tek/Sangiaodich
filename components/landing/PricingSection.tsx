'use client';

import { Badge, Box, Group, Stack, Text, Title } from '@mantine/core';
import { useLocale, useTranslations } from 'next-intl';
import { useState, type ComponentType } from 'react';
import { colors, typography } from '@/config/design-tokens';
import { LinkButton } from '@/components/ui/LinkButton';
import { Reveal } from '@/components/landing/Reveal';
import { SectionShell } from '@/components/ui/SectionShell';
import { IconBriefcase, IconHome } from '@/components/landing/LandingIcons';
import { planDiscount, type SubscriptionPlan } from '@/lib/engines/subscription-plans';
import { formatVnd, planDurationLabel } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';

type RoleTab = 'OWNER' | 'SALE';

const FEATURED_MONTHS = 3;

const roles: {
  id: RoleTab;
  labelKey: 'ownerTab' | 'saleTab';
  icon: ComponentType<{ size?: number }>;
}[] = [
  { id: 'OWNER', labelKey: 'ownerTab', icon: IconHome },
  { id: 'SALE', labelKey: 'saleTab', icon: IconBriefcase },
];

export function PricingSection({
  ownerPlans,
  salePlans,
}: {
  ownerPlans: SubscriptionPlan[];
  salePlans: SubscriptionPlan[];
}) {
  const t = useTranslations('landing.pricing');
  const locale = useLocale() as AppLocale;
  const [tab, setTab] = useState<RoleTab>('OWNER');
  const plans = tab === 'OWNER' ? ownerPlans : salePlans;
  const registerHref = `/login?mode=register&role=${tab}`;
  const benefits = t.raw(tab === 'OWNER' ? 'benefits.owner' : 'benefits.sale') as string[];

  return (
    <SectionShell
      id="pricing"
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('subtitle')}
      align="center"
      tone="surface"
    >
      <Stack gap={40} align="center">
        <Stack gap={12} align="center">
          <div className="vbnb-pricing__switch" role="tablist" aria-label={t('roleTabAria')}>
            {roles.map(({ id, labelKey, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className="vbnb-pricing__switch-btn"
                  data-active={active || undefined}
                  onClick={() => setTab(id)}
                >
                  <Icon size={18} />
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
          <Text key={tab} size="sm" c={colors.textSecondary} ta="center" className="vbnb-pricing__swap">
            {t(tab === 'OWNER' ? 'ownerTagline' : 'saleTagline')}
          </Text>
        </Stack>

        {!plans.length ? (
          <Text ta="center" c={colors.textMuted} size="sm">
            {tab === 'OWNER' ? t('emptyOwner') : t('emptySale')}
          </Text>
        ) : (
          <div key={tab} className="vbnb-grid vbnb-grid-4 vbnb-pricing__grid vbnb-pricing__swap">
            {plans.map((plan, index) => (
              <Reveal key={plan.id} delay={index * 70} className="vbnb-pricing__cell">
                <PlanCard
                  plan={plan}
                  locale={locale}
                  featured={plan.months === FEATURED_MONTHS}
                  href={registerHref}
                />
              </Reveal>
            ))}
          </div>
        )}

        <Reveal className="vbnb-pricing__benefits">
          <div key={tab} className="vbnb-pricing__swap vbnb-pricing__benefits-inner">
            <div>
              <Title
                order={3}
                fw={700}
                mb={16}
                style={{ fontSize: '1.125rem', letterSpacing: '-0.01em' }}
              >
                {t(tab === 'OWNER' ? 'benefitsTitleOwner' : 'benefitsTitleSale')}
              </Title>
              <ul className="vbnb-pricing__benefit-list">
                {benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <ul className="vbnb-pricing__notes">
              <li>{t('notes.payment')}</li>
              <li>{t('notes.guestFree')}</li>
            </ul>
          </div>
        </Reveal>
      </Stack>
    </SectionShell>
  );
}

function PlanCard({
  plan,
  locale,
  featured,
  href,
}: {
  plan: SubscriptionPlan;
  locale: AppLocale;
  featured: boolean;
  href: string;
}) {
  const t = useTranslations('landing.pricing');
  const discount = planDiscount(plan);
  const title = locale === 'vi' && plan.label ? plan.label : planDurationLabel(plan.months, locale);
  const perMonth = Math.round(plan.amount / plan.months);

  return (
    <Box className="vbnb-pricing__card" data-featured={featured || undefined}>
      {featured ? <span className="vbnb-pricing__ribbon">{t('recommended')}</span> : null}

      <Group justify="space-between" align="center" wrap="nowrap">
        <Text fw={700} c={colors.textPrimary} style={{ fontSize: '1.0625rem' }}>
          {title}
        </Text>
        {discount ? (
          <Badge size="md" color="red" variant="light">
            −{discount.percent}%
          </Badge>
        ) : null}
      </Group>

      <Stack gap={4}>
        <Text
          fw={700}
          c={colors.textPrimary}
          className="vbnb-tabular-nums"
          style={{
            fontSize: 'clamp(1.75rem, 2.4vw, 2.125rem)',
            letterSpacing: typography.data.letterSpacing,
            lineHeight: 1.1,
          }}
        >
          {formatVnd(plan.amount, locale)}
        </Text>
        {discount ? (
          <Text size="sm" c="dimmed" td="line-through" className="vbnb-tabular-nums">
            {formatVnd(discount.compareAt, locale)}
          </Text>
        ) : null}
        <Text size="sm" c={colors.textSecondary} className="vbnb-tabular-nums">
          {t('perMonth', { amount: formatVnd(perMonth, locale) })}
        </Text>
        {discount ? (
          <Text size="sm" fw={600} c="vbnbGreen.6" className="vbnb-tabular-nums">
            {t('save', { amount: formatVnd(discount.saveAmount, locale) })}
          </Text>
        ) : null}
      </Stack>

      <LinkButton
        href={href}
        color="vbnbGreen"
        variant={featured ? 'filled' : 'default'}
        fullWidth
        size="md"
        h={46}
        mt="auto"
        style={featured ? undefined : { borderColor: colors.borderStrong, color: colors.textPrimary }}
      >
        {t('choosePlan')}
      </LinkButton>
    </Box>
  );
}
