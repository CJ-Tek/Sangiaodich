'use client';

import {
  AppShell,
  Box,
  Divider,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { colors, radius } from '@/config/design-tokens';
import { shellNavLinkClass } from '@/components/shells/shell-nav-link-styles';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { guestNav } from '@/components/shells/guest-nav';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';

/**
 * Chrome for a signed-in guest: sidebar on desktop, tab bar on mobile.
 * Breakpoints are CSS-only (no useMediaQuery) so the layout does not flash
 * through the mobile variant while hydrating.
 */
export function GuestDashboardShell({
  children,
}: {
  children: React.ReactNode;
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
      footer={{ height: { base: 64, md: 0 } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <UnstyledButton component={Link} href="/me">
              <Title order={3} c="vbnbGreen.6" fw={700} style={{ letterSpacing: '-0.03em' }}>
                VBNB
              </Title>
            </UnstyledButton>
            <Text size="sm" c="dimmed" visibleFrom="md">
              {tShell('roleLabel')}
            </Text>
          </Group>
          <Group gap="sm">
            <LanguageSwitcher compact />
            <UnstyledButton component={Link} href="/me/profile">
              <Text size="sm" c="dimmed">
                {tShell('account')}
              </Text>
            </UnstyledButton>
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

      <AppShell.Footer hiddenFrom="md">
        <Group h="100%" px={4} grow gap={0}>
          {guestNav.map((item) => {
            const active = activeHref === item.href;
            const iconColor = active
              ? colors.primaryDark
              : colors.textSecondary;
            return (
              <UnstyledButton
                key={item.href}
                component={Link}
                href={item.href}
                title={tNav(item.labelKey)}
                aria-label={tNav(item.labelKey)}
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
