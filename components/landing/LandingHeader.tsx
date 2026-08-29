'use client';

import {
  Box,
  Burger,
  Drawer,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure, useWindowScroll } from '@mantine/hooks';
import { useTranslations } from 'next-intl';
import { colors, motion, zIndex } from '@/config/design-tokens';
import { goToLandingSection } from '@/components/landing/landing-nav';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { LinkButton } from '@/components/ui/LinkButton';

const navItems = [
  { labelKey: 'exploreVillas' as const, href: '/marketplace' },
  { labelKey: 'forOwners' as const, href: '/#owner' },
  { labelKey: 'forSales' as const, href: '/#sale' },
  { labelKey: 'pricing' as const, href: '/#pricing' },
  { labelKey: 'aboutUs' as const, href: '/#how' },
];

export function LandingHeader({
  isLoggedIn,
  appHref = '/marketplace',
  solid = false,
}: {
  isLoggedIn?: boolean;
  appHref?: string;
  solid?: boolean;
}) {
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [{ y }] = useWindowScroll();
  const scrolled = solid || y > 12;
  const [opened, { toggle, close }] = useDisclosure(false);

  function isActive(href: string) {
    return href === '/marketplace' && pathname === '/marketplace';
  }

  function onNavClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    if (!href.startsWith('/#')) {
      close();
      return;
    }
    event.preventDefault();
    goToLandingSection(href.slice(2));
    close();
  }

  return (
    <Box
      component="header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: zIndex.sticky,
        height: 64,
        background: scrolled ? 'rgba(250, 250, 248, 0.94)' : 'transparent',
        borderBottom: scrolled ? `1px solid ${colors.border}` : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        transition: `background ${motion.normal}ms ${motion.easing}, border-color ${motion.normal}ms ${motion.easing}`,
      }}
    >
      <Group h="100%" justify="space-between" wrap="nowrap" className="vbnb-landing-container">
        <UnstyledButton component={Link} href="/" aria-label={tCommon('homeAriaLabel')}>
          <Text fw={700} c="vbnbGreen.6" style={{ letterSpacing: '-0.04em', fontSize: 22 }}>
            {tCommon('appName')}
          </Text>
        </UnstyledButton>

        <Group gap={22} visibleFrom="md">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <UnstyledButton
                key={item.labelKey}
                component={Link}
                href={item.href}
                onClick={(event) => onNavClick(event, item.href)}
              >
                <Text
                  size="sm"
                  fw={active ? 600 : 500}
                  c={active ? colors.primaryDark : colors.textSecondary}
                  style={{
                    transition: `color ${motion.fast}ms ${motion.easing}`,
                  }}
                >
                  {tNav(item.labelKey)}
                </Text>
              </UnstyledButton>
            );
          })}
        </Group>

        <Group gap="sm" visibleFrom="md">
          <LanguageSwitcher />
          {isLoggedIn ? (
            <LinkButton href={appHref} color="vbnbGreen" size="sm">
              {tCommon('enterApp')}
            </LinkButton>
          ) : (
            <>
              <UnstyledButton component={Link} href="/login">
                <Text size="sm" fw={500} c={colors.textPrimary}>
                  {tCommon('login')}
                </Text>
              </UnstyledButton>
              <LinkButton href="/login?mode=register" color="vbnbGreen" size="sm">
                {tCommon('getStarted')}
              </LinkButton>
            </>
          )}
        </Group>

        <Burger
          opened={opened}
          onClick={toggle}
          hiddenFrom="md"
          size="sm"
          color={colors.textPrimary}
          aria-label={tCommon('openMenu')}
        />
      </Group>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="xs"
        hiddenFrom="md"
        title={
          <Text fw={700} c="vbnbGreen.6">
            {tCommon('appName')}
          </Text>
        }
      >
        <Stack gap="lg" pt="md">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <UnstyledButton
                key={item.labelKey}
                component={Link}
                href={item.href}
                onClick={(event) => onNavClick(event, item.href)}
              >
                <Text size="md" fw={active ? 600 : 500}>
                  {tNav(item.labelKey)}
                </Text>
              </UnstyledButton>
            );
          })}
          <LanguageSwitcher />
          {isLoggedIn ? (
            <LinkButton href={appHref} color="vbnbGreen">
              {tCommon('enterApp')}
            </LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="default">
                {tCommon('login')}
              </LinkButton>
              <LinkButton href="/login?mode=register" color="vbnbGreen">
                {tCommon('getStarted')}
              </LinkButton>
            </>
          )}
        </Stack>
      </Drawer>
    </Box>
  );
}
