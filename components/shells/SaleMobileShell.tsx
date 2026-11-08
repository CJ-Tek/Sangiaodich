'use client';

import {
  AppShell,
  Group,
  NavLink,
  Stack,
  Text,
  UnstyledButton,
  Divider,
  Box,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { colors } from '@/config/design-tokens';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { VbnbLogo } from '@/components/brand/VbnbLogo';
import { RoleTabBar } from '@/components/shells/RoleTabBar';
import { ShellContent } from '@/components/shells/ShellContent';
import {
  IconCalendar,
  IconClipboard,
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
  uiMode = 'simple',
  headerExtra,
}: {
  children: React.ReactNode;
  uiMode?: UiMode;
  headerExtra?: ReactNode;
}) {
  const t = useTranslations('sale.nav');
  const tShell = useTranslations('sale.shell');
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
    { label: t('home'), href: '/sale' },
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
    { label: t('home'), href: '/sale', Icon: IconHome },
    { label: t('calendar'), href: '/sale/calendar', Icon: IconCalendar },
    { label: t('holdShort'), href: '/sale/bookings', Icon: IconClipboard },
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
              <VbnbLogo height={28} priority />
              <Text size="sm" c="dimmed">
                {tShell('roleLabel')}
              </Text>
            </Group>
            <Group gap="md">
              <LanguageSwitcher compact />
              {headerExtra}
              {simple ? null : (
                <UnstyledButton
                  component={Link}
                  href="/sale/settings"
                  className="vbnb-hit"
                >
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

        <AppShell.Main style={{ minWidth: 0, overflowX: 'clip' }}>
          <ShellContent>{children}</ShellContent>
        </AppShell.Main>
      </AppShell>
    );
  }

  return (
    <AppShell header={{ height: 56 }} footer={{ height: 68 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <VbnbLogo height={24} priority />
          <Group gap={4} wrap="nowrap">
            <LanguageSwitcher compact />
            {headerExtra}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main pb={84} style={{ minWidth: 0, overflowX: 'clip' }}>
        {children}
      </AppShell.Main>

      <AppShell.Footer>
        <RoleTabBar items={mobileItems} isActive={isActive} />
      </AppShell.Footer>
    </AppShell>
  );
}
