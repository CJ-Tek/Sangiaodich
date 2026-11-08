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
import { RoleTabBar } from '@/components/shells/RoleTabBar';
import { ShellContent } from '@/components/shells/ShellContent';
import { ShellLogo } from '@/components/shells/ShellLogo';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { VbnbLogo } from '@/components/brand/VbnbLogo';
import {
  IconCalendar,
  IconClipboard,
  IconHome,
  IconInbox,
  IconSettings,
  IconStore,
  IconUser,
} from '@/components/shells/NavIcons';
import type { UiMode } from '@/lib/engines/ui-mode';
import { isSimpleUi } from '@/lib/engines/ui-mode';
import type { ReactNode } from 'react';
import { isNavItemActive } from '@/components/shells/nav-active';
import { shellNavLinkClass } from '@/components/shells/shell-nav-link-styles';
import { Guidebook } from '@/components/guide/Guidebook';
import { guideTargetForHref } from '@/lib/guide/chapters';

export function OwnerMobileShell({
  children,
  uiMode = 'simple',
  headerExtra,
  guidebookCompleted,
}: {
  children: React.ReactNode;
  uiMode?: UiMode;
  headerExtra?: ReactNode;
  guidebookCompleted?: string[];
}) {
  const t = useTranslations('owner.nav');
  const tShell = useTranslations('owner.shell');
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const simple = isSimpleUi(uiMode);

  const expertDesktop = [
    { label: t('properties'), href: '/owner' },
    { label: t('assets'), href: '/owner/assets' },
    { label: t('pending'), href: '/owner/pending' },
    { label: t('settlements'), href: '/owner/bookings' },
    { label: t('subscription'), href: '/owner/subscription' },
    { label: t('profile'), href: '/owner/profile' },
  ];

  const simpleDesktop = [
    { label: t('properties'), href: '/owner' },
    { label: t('calendar'), href: '/owner/calendar' },
    { label: t('assets'), href: '/owner/assets' },
    { label: t('pending'), href: '/owner/pending' },
    { label: t('platformFee'), href: '/owner/subscription' },
  ];

  const expertMobile = [
    { label: t('home'), href: '/owner', Icon: IconHome },
    { label: t('assetsShort'), href: '/owner/assets', Icon: IconStore },
    { label: t('pendingShort'), href: '/owner/pending', Icon: IconInbox },
    { label: t('settlementsShort'), href: '/owner/bookings', Icon: IconClipboard },
    { label: t('account'), href: '/owner/profile', Icon: IconUser },
  ];

  const simpleMobile = [
    { label: t('properties'), href: '/owner', Icon: IconHome },
    { label: t('calendar'), href: '/owner/calendar', Icon: IconCalendar },
    { label: t('assetsShort'), href: '/owner/assets', Icon: IconStore },
    { label: t('pending'), href: '/owner/pending', Icon: IconInbox },
    { label: t('platformFee'), href: '/owner/subscription', Icon: IconSettings },
  ];

  const desktopItems = simple ? simpleDesktop : expertDesktop;
  const mobileItems = simple ? simpleMobile : expertMobile;
  const navHrefs = desktopItems.map((item) => item.href);

  function isActive(href: string) {
    return isNavItemActive(pathname, href, navHrefs, ['/owner']);
  }

  if (isDesktop) {
    return (
      <AppShell
        header={{ height: 64 }}
        navbar={{ width: 228, breakpoint: 'sm' }}
        padding="lg"
      >
        <AppShell.Header data-guide-chrome="header">
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
                  href="/owner/profile"
                  className="vbnb-hit"
                >
                  <Text size="sm" c="dimmed">
                    {tShell('account')}
                  </Text>
                </UnstyledButton>
              )}
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar
          data-guide-chrome="nav"
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
                    data-guide={guideTargetForHref(item.href)}
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

        <AppShell.Main data-guide-view style={{ minWidth: 0, overflowX: 'clip' }}>
          <ShellContent>{children}</ShellContent>
        </AppShell.Main>
        {guidebookCompleted ? (
          <Guidebook role="OWNER" completed={guidebookCompleted} />
        ) : null}
      </AppShell>
    );
  }

  return (
    <AppShell header={{ height: 56 }} footer={{ height: 68 }} padding="md">
      <AppShell.Header data-guide-chrome="header">
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <ShellLogo />
          <Group gap={4} wrap="nowrap">
            <LanguageSwitcher compact />
            {headerExtra}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main data-guide-view pb={84} style={{ minWidth: 0, overflowX: 'clip' }}>
        {children}
      </AppShell.Main>

      <AppShell.Footer data-guide-chrome="footer">
        <RoleTabBar items={mobileItems} isActive={isActive} />
      </AppShell.Footer>
      {guidebookCompleted ? (
        <Guidebook role="OWNER" completed={guidebookCompleted} />
      ) : null}
    </AppShell>
  );
}
