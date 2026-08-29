import { Box, Group, Stack, Text, Title } from '@mantine/core';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSessionProfile } from '@/lib/auth/session';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { landingContainer } from '@/components/landing/landing-media';
import { colors } from '@/config/design-tokens';
import { appHrefForRole } from '@/lib/i18n/app-href';
import type { AppLocale } from '@/lib/i18n/routing';

export type LegalSlug = 'terms' | 'privacy' | 'cookies';

type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const locale = (await getLocale()) as AppLocale;
  const profile = await getSessionProfile();
  const t = await getTranslations(`legal.${slug}`);
  const tCommon = await getTranslations('common');
  const sections = t.raw('sections') as LegalSection[];

  return (
    <>
      <LandingHeader
        isLoggedIn={!!profile}
        appHref={appHrefForRole(profile?.role, locale)}
        solid
      />
      <Box
        component="main"
        style={{
          ...landingContainer,
          maxWidth: 760,
          paddingTop: 48,
          paddingBottom: 80,
        }}
      >
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <div>
              <Title order={1} fw={600} style={{ letterSpacing: '-0.03em' }}>
                {t('title')}
              </Title>
              <Text size="sm" c={colors.textMuted} mt={8}>
                {tCommon('updated')} {t('updated')}
              </Text>
            </div>
            <LanguageSwitcher />
          </Group>
          <Text c={colors.textSecondary} style={{ lineHeight: 1.7 }}>
            {t('intro')}
          </Text>
          {sections.map((section) => (
            <Stack key={section.heading} gap="sm">
              <Title order={3} fw={600}>
                {section.heading}
              </Title>
              {section.paragraphs.map((p) => (
                <Text
                  key={p.slice(0, 48)}
                  c={colors.textSecondary}
                  style={{ lineHeight: 1.7 }}
                >
                  {p}
                </Text>
              ))}
            </Stack>
          ))}
        </Stack>
      </Box>
      <LandingFooter />
    </>
  );
}
