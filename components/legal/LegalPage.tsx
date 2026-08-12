import { Box, Stack, Text, Title } from '@mantine/core';
import { getSessionProfile } from '@/lib/auth/session';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { landingContainer } from '@/components/landing/landing-media';
import { colors } from '@/config/design-tokens';
import { LEGAL_PAGES, type LegalSlug } from '@/config/legal-pages';

function appHrefForRole(role?: string) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'OWNER') return '/owner';
  if (role === 'SALE') return '/sale';
  return '/marketplace';
}

export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const profile = await getSessionProfile();
  const doc = LEGAL_PAGES[slug];

  return (
    <>
      <LandingHeader
        isLoggedIn={!!profile}
        appHref={appHrefForRole(profile?.role)}
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
          <div>
            <Title order={1} fw={600} style={{ letterSpacing: '-0.03em' }}>
              {doc.title}
            </Title>
            <Text size="sm" c={colors.textMuted} mt={8}>
              Cập nhật {doc.updated}
            </Text>
          </div>
          <Text c={colors.textSecondary} style={{ lineHeight: 1.7 }}>
            {doc.intro}
          </Text>
          {doc.sections.map((section) => (
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
