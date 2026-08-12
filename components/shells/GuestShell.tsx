'use client';

import {
  AppShell,
  Box,
  Group,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors, radius } from '@/config/design-tokens';
import { IconCalendar, IconCompass, IconUser } from '@/components/shells/NavIcons';

const topNav = [
  { label: 'Explore', href: '/marketplace' },
  { label: 'Bookings', href: '/me/bookings' },
];

const mobileNav = [
  { label: 'Explore', href: '/marketplace', Icon: IconCompass },
  { label: 'Bookings', href: '/me/bookings', Icon: IconCalendar },
  { label: 'Profile', href: '/me/membership', Icon: IconUser },
];

export function GuestShell({
  children,
  isLoggedIn,
}: {
  children: React.ReactNode;
  isLoggedIn?: boolean;
}) {
  const pathname = usePathname();
  const isCompact = useMediaQuery('(max-width: 1023px)');
  const isLoginPage = pathname === '/login' || pathname.startsWith('/login/');

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <AppShell
      header={{ height: 64 }}
      footer={isCompact && !isLoginPage ? { height: 64 } : undefined}
      padding="md"
    >
      <AppShell.Header>
        <Group
          h="100%"
          px="md"
          justify="space-between"
          maw={1200}
          mx="auto"
          w="100%"
        >
          <Group gap="xl">
            <UnstyledButton component={Link} href="/">
              <Title order={3} c="vbnbGreen.6" fw={600}>
                VBNB
              </Title>
            </UnstyledButton>
            {!isCompact && !isLoginPage ? (
            <Group gap="md">
              {topNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <UnstyledButton key={item.href} component={Link} href={item.href}>
                    <Text
                      size="sm"
                      fw={active ? 600 : 500}
                      c={active ? colors.primaryDark : colors.textSecondary}
                    >
                      {item.label}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </Group>
            ) : null}
          </Group>
          <Group gap="sm">
            {isLoggedIn ? (
              <UnstyledButton component={Link} href="/me/membership">
                <Text size="sm" c="dimmed">
                  Profile
                </Text>
              </UnstyledButton>
            ) : (
              <UnstyledButton
                component={Link}
                href="/login"
                style={{
                  background: colors.primary,
                  color: '#fff',
                  borderRadius: radius.sm,
                  padding: '8px 14px',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Đăng nhập
              </UnstyledButton>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main pb={isCompact && !isLoginPage ? 80 : 24}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>{children}</div>
      </AppShell.Main>

      {isCompact && !isLoginPage ? (
        <AppShell.Footer>
          <Group h="100%" px={4} grow gap={0}>
            {mobileNav.map((item) => {
              const active = isActive(item.href);
              const href =
                !isLoggedIn && item.href.startsWith('/me')
                  ? `/login?next=${item.href}`
                  : item.href;
              const iconColor = active ? colors.primaryDark : colors.textSecondary;
              return (
                <UnstyledButton
                  key={item.href}
                  component={Link}
                  href={href}
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
      ) : null}
    </AppShell>
  );
}
