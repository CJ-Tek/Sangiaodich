'use client';

import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
  UnstyledButton,
  Divider,
  Box,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { colors, radius } from '@/config/design-tokens';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import {
  IconCalendar,
  IconHome,
  IconStore,
  IconSettings,
  IconUsers,
} from '@/components/shells/NavIcons';
import type { UiMode } from '@/lib/engines/ui-mode';
import { isSimpleUi } from '@/lib/engines/ui-mode';
import type { ReactNode } from 'react';
import { isNavItemActive } from '@/components/shells/nav-active';
import { shellNavLinkClass } from '@/components/shells/shell-nav-link-styles';

export function SaleMobileShell({
  children,
  uiMode = 'expert',
  headerExtra,
}: {
  children: React.ReactNode;
  uiMode?: UiMode;
  headerExtra?: ReactNode;
}) {
  const t = useTranslations('sale.nav');
  const tShell = useTranslations('sale.shell');
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const simple = isSimpleUi(uiMode);

  const expertDesktop = [
    { label: t('home'), href: '/sale' },
    { label: t('marketplace'), href: '/sale/marketplace' },
    { label: t('bookings'), href: '/sale/bookings' },
    { label: t('customers'), href: '/sale/customers' },
    { label: t('leads'), href: '/sale/leads' },
    { label: t('settings'), href: '/sale/settings' },
  ];

  const simpleDesktop = [
    { label: t('calendar'), href: '/sale/calendar' },
    { label: t('holds'), href: '/sale/bookings' },
    { label: t('tier'), href: '/sale/settings?tab=membership' },
  ];

  const expertMobile = [
    { label: t('home'), href: '/sale', Icon: IconHome },
    { label: t('floor'), href: '/sale/marketplace', Icon: IconStore },
    { label: t('guestsShort'), href: '/sale/customers', Icon: IconUsers },
    { label: t('bookings'), href: '/sale/bookings', Icon: IconCalendar },
    { label: t('settings'), href: '/sale/settings', Icon: IconSettings },
  ];

  const simpleMobile = [
    { label: t('calendar'), href: '/sale/calendar', Icon: IconCalendar },
    { label: t('holdShort'), href: '/sale/bookings', Icon: IconHome },
    { label: t('tier'), href: '/sale/settings?tab=membership', Icon: IconSettings },
  ];

  const desktopItems = simple ? simpleDesktop : expertDesktop;
  const mobileItems = simple ? simpleMobile : expertMobile;
  const navHrefs = desktopItems.map((item) => item.href);

  function isActive(href: string) {
    return isNavItemActive(pathname, href, navHrefs, ['/sale']);
  }

  if (isDesktop) {
    return (
      <AppShell
        header={{ height: 64 }}
        navbar={{ width: 228, breakpoint: 'sm' }}
        padding="lg"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group gap="sm">
              <Title order={3} c="vbnbGreen.6" fw={700} style={{ letterSpacing: '-0.03em' }}>
                VBNB
              </Title>
              <Text size="sm" c="dimmed">
                {tShell('roleLabel')}
              </Text>
            </Group>
            <Group gap="md">
              <LanguageSwitcher compact />
              {headerExtra}
              {simple ? null : (
                <UnstyledButton component={Link} href="/sale/settings">
                  <Text size="sm" c="dimmed">
                    {tShell('setting')}
                  </Text>
                </UnstyledButton>
              )}
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar
          p="sm"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <Stack
            gap="xs"
            style={{ flex: 1, minHeight: 0 }}
            justify="space-between"
          >
            <Stack gap="xs">
              {desktopItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <NavLink
                    key={item.href}
                    className={shellNavLinkClass}
                    component={Link}
                    href={item.href}
                    label={item.label}
                    active={active}
                  />
                );
              })}
            </Stack>

            <Box pt="md">
              <Divider mb="sm" color={colors.border} />
              <LogoutButton fullWidth />
            </Box>
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    );
  }

  return (
    <AppShell header={{ height: 56 }} footer={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" style={{ display: 'none' }} />
            <Title order={4} c="vbnbGreen.6" fw={700} style={{ letterSpacing: '-0.03em' }}>
              VBNB
            </Title>
          </Group>
          <Group gap="md">
            <LanguageSwitcher compact />
            {headerExtra}
            {simple ? null : (
              <UnstyledButton component={Link} href="/sale/settings">
                <Text size="sm" c="dimmed">
                  {tShell('setting')}
                </Text>
              </UnstyledButton>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main pb={80}>{children}</AppShell.Main>

      <AppShell.Footer>
        <Group h="100%" px={4} grow gap={0}>
          {mobileItems.map((item) => {
            const active = isActive(item.href);
            const iconColor = active ? colors.primaryDark : colors.textSecondary;
            return (
              <UnstyledButton
                key={item.href}
                component={Link}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                style={{ textAlign: 'center', padding: 8, minHeight: 44 }}
              >
                <Box
                  style={{
                    borderRadius: radius.sm,
                    background: active ? colors.primarySoft : 'transparent',
                    padding: '8px 4px',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <item.Icon color={iconColor} />
                </Box>
              </UnstyledButton>
            );
          })}
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
