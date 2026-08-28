'use client';

import {
  AppShell,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
  UnstyledButton,
  Divider,
  Box,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors, radius } from '@/config/design-tokens';
import { LogoutButton } from '@/components/auth/LogoutButton';
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

const expertDesktop = [
  { label: 'Properties', href: '/owner' },
  { label: 'Assets', href: '/owner/assets' },
  { label: 'Chờ xác nhận', href: '/owner/pending' },
  { label: 'Settlements', href: '/owner/bookings' },
  { label: 'New asset', href: '/owner/assets/new' },
  { label: 'Subscription', href: '/owner/subscription' },
  { label: 'Profile', href: '/owner/profile' },
];

const simpleDesktop = [
  { label: 'Lịch', href: '/owner/calendar' },
  { label: 'Chờ xác nhận', href: '/owner/pending' },
  { label: 'Phí sàn', href: '/owner/subscription' },
];

const expertMobile = [
  { label: 'Home', href: '/owner', Icon: IconHome },
  { label: 'Căn', href: '/owner/assets', Icon: IconStore },
  { label: 'Chờ', href: '/owner/pending', Icon: IconInbox },
  { label: 'Quyết toán', href: '/owner/bookings', Icon: IconClipboard },
  { label: 'Tài khoản', href: '/owner/profile', Icon: IconUser },
];

const simpleMobile = [
  { label: 'Lịch', href: '/owner/calendar', Icon: IconCalendar },
  { label: 'Chờ xác nhận', href: '/owner/pending', Icon: IconInbox },
  { label: 'Phí sàn', href: '/owner/subscription', Icon: IconSettings },
];

export function OwnerMobileShell({
  children,
  uiMode = 'expert',
  headerExtra,
}: {
  children: React.ReactNode;
  uiMode?: UiMode;
  headerExtra?: ReactNode;
}) {
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const simple = isSimpleUi(uiMode);
  const desktopItems = simple ? simpleDesktop : expertDesktop;
  const mobileItems = simple ? simpleMobile : expertMobile;

  function isActive(href: string) {
    const path = href.split('?')[0];
    if (path === '/owner') return pathname === '/owner';
    return pathname === path || pathname.startsWith(`${path}/`);
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
              <Title order={3} c="vbnbGreen.6" fw={600}>
                VBNB
              </Title>
              <Text size="sm" c="dimmed">
                Owner
              </Text>
            </Group>
            <Group gap="md">
              {headerExtra}
              {simple ? null : (
                <UnstyledButton component={Link} href="/owner/profile">
                  <Text size="sm" c="dimmed">
                    Tài khoản
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
                    component={Link}
                    href={item.href}
                    label={item.label}
                    active={active}
                    styles={{
                      root: {
                        borderRadius: radius.md,
                        backgroundColor: active
                          ? colors.primarySoft
                          : 'transparent',
                        color: active
                          ? colors.primaryDark
                          : colors.textPrimary,
                        fontWeight: active ? 600 : 500,
                      },
                    }}
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
          <Title order={4} c="vbnbGreen.6" fw={600}>
            VBNB
          </Title>
          <Group gap="md">{headerExtra}</Group>
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
