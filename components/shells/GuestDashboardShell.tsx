'use client';

import {
  AppShell,
  Box,
  Divider,
  Group,
  NavLink,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { colors } from '@/config/design-tokens';
import { RoleTabBar } from '@/components/shells/RoleTabBar';
import { ShellContent } from '@/components/shells/ShellContent';
import { shellNavLinkClass } from '@/components/shells/shell-nav-link-styles';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { guestNav } from '@/components/shells/guest-nav';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { VbnbLogo } from '@/components/brand/VbnbLogo';
import { Guidebook } from '@/components/guide/Guidebook';
import { guideTargetForHref } from '@/lib/guide/chapters';

/**
 * Chrome for a signed-in guest: sidebar on desktop, tab bar on mobile.
 * Breakpoints are CSS-only (no useMediaQuery) so the layout does not flash
 * through the mobile variant while hydrating.
 */
export function GuestDashboardShell({
  children,
  guidebookCompleted,
}: {
  children: React.ReactNode;
  guidebookCompleted?: string[];
}) {
  const pathname = usePathname();
  const tNav = useTranslations('guest.nav');
  const tShell = useTranslations('guest.shell');

  // Longest match wins, otherwise `/me` would light up on `/me/bookings` too.
  const activeHref = guestNav
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)
    .at(0)?.href;

  return (
    <AppShell
      header={{ height: { base: 56, md: 64 } }}
      navbar={{ width: 228, breakpoint: 'md', collapsed: { mobile: true } }}
      footer={{ height: { base: 68, md: 0 } }}
      padding="lg"
    >
      <AppShell.Header data-guide-chrome="header">
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <UnstyledButton component={Link} href="/me">
              <VbnbLogo height={28} priority />
            </UnstyledButton>
            <Text size="sm" c="dimmed" visibleFrom="md">
              {tShell('roleLabel')}
            </Text>
          </Group>
          <Group gap="sm">
            <LanguageSwitcher compact />
            <UnstyledButton
              component={Link}
              href="/me/profile"
              className="vbnb-hit"
              visibleFrom="md"
            >
              <Text size="sm" c="dimmed">
                {tShell('account')}
              </Text>
            </UnstyledButton>
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
          <Stack gap={4}>
            {guestNav.map((item) => {
              const active = activeHref === item.href;
              return (
                <NavLink
                  key={item.href}
                  className={shellNavLinkClass}
                  component={Link}
                  href={item.href}
                  label={tNav(item.labelKey)}
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

      <AppShell.Main data-guide-view>
        <ShellContent>{children}</ShellContent>
      </AppShell.Main>

      <AppShell.Footer data-guide-chrome="footer" hiddenFrom="md">
        <RoleTabBar
          items={guestNav.map((item) => ({
            label: tNav(item.labelKey),
            href: item.href,
            Icon: item.Icon,
          }))}
          isActive={(href) => activeHref === href}
        />
      </AppShell.Footer>
      {guidebookCompleted ? (
        <Guidebook role="GUEST" completed={guidebookCompleted} />
      ) : null}
    </AppShell>
  );
}
