'use client';

import { Box, SimpleGrid, Stack, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors, spacing, typography } from '@/config/design-tokens';
import { containerClassName } from '@/components/landing/landing-media';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { VbnbLogo } from '@/components/brand/VbnbLogo';

export function LandingFooter() {
  const t = useTranslations('landing.footer');
  const tCommon = useTranslations('common');

  const columns = [
    {
      title: t('columns.platform.title'),
      links: [
        { label: t('columns.platform.exploreVillas'), href: '/marketplace' },
        { label: t('columns.platform.howItWorks'), href: '/#how' },
        { label: t('columns.platform.pricing'), href: '/#pricing' },
        { label: t('columns.platform.membership'), href: '/login?mode=register' },
      ],
    },
    {
      title: t('columns.owner.title'),
      links: [
        { label: t('columns.owner.listVilla'), href: '/login?mode=register&role=OWNER' },
        { label: t('columns.owner.guide'), href: '/#owner' },
        { label: t('columns.owner.policy'), href: '/terms' },
        { label: t('columns.owner.faq'), href: '/#faq' },
      ],
    },
    {
      title: t('columns.sale.title'),
      links: [
        { label: t('columns.sale.forSales'), href: '/login?mode=register&role=SALE' },
        { label: t('columns.sale.benefits'), href: '/#sale' },
        { label: t('columns.sale.membership'), href: '/#sale' },
        { label: t('columns.sale.resources'), href: '/#sale' },
      ],
    },
    {
      title: t('columns.about.title'),
      links: [
        { label: t('columns.about.intro'), href: '/#how' },
        { label: t('columns.about.careers'), href: '#' },
        { label: t('columns.about.news'), href: '#' },
        { label: t('columns.about.contact'), href: '/login' },
      ],
    },
    {
      title: t('columns.legal.title'),
      links: [
        { label: t('columns.legal.terms'), href: '/terms' },
        { label: t('columns.legal.privacy'), href: '/privacy' },
        { label: t('columns.legal.cookies'), href: '/cookies' },
      ],
    },
  ];

  return (
    <Box
      component="footer"
      style={{
        borderTop: `1px solid ${colors.border}`,
        background: colors.background,
      }}
    >
      <Box className={containerClassName} pt={spacing['5xl']} pb={spacing['2xl']}>
        <SimpleGrid
          cols={{ base: 2, sm: 3, md: 7 }}
          spacing={{ base: spacing['2xl'], md: spacing.xl }}
          verticalSpacing={spacing['2xl']}
        >
          <Stack gap={spacing.md} style={{ gridColumn: 'span 2' }} maw={300}>
            <VbnbLogo height={28} alt={tCommon('appName')} />
            <Text size="sm" c={colors.textSecondary} style={{ lineHeight: typography.body.lineHeight }}>
              {t('tagline')}
            </Text>
          </Stack>
          {columns.map((col) => (
            <Stack key={col.title} gap={spacing.sm}>
              <Text size="sm" fw={600}>
                {col.title}
              </Text>
              {col.links.map((link) => (
                <LinkAnchor
                  key={link.label}
                  href={link.href}
                  size="sm"
                  c={colors.textSecondary}
                  underline="never"
                  style={{ lineHeight: typography.body.lineHeight }}
                >
                  {link.label}
                </LinkAnchor>
              ))}
            </Stack>
          ))}
        </SimpleGrid>
        <Text
          size="xs"
          c={colors.textSecondary}
          mt={spacing['4xl']}
          pt={spacing.xl}
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          {tCommon('copyright', { year: new Date().getFullYear() })}
        </Text>
      </Box>
    </Box>
  );
}
