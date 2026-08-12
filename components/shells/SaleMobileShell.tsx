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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors, radius } from '@/config/design-tokens';
import { LogoutButton } from '@/components/auth/LogoutButton';
import {
  IconCalendar,
  IconHome,
  IconStore,
  IconSettings,
  IconUsers,
} from '@/components/shells/NavIcons';

const desktopSections = [
  {
    items: [
      { label: 'Home', href: '/sale' },
      { label: 'Marketplace', href: '/sale/marketplace' },
      { label: 'Bookings', href: '/sale/bookings' },
      { label: 'Customers', href: '/sale/customers' },
      { label: 'Leads', href: '/sale/leads' },
      { label: 'Setting', href: '/sale/settings' },
    ],
  },
];

const mobileItems = [
  { label: 'Home', href: '/sale', Icon: IconHome },
  { label: 'Sàn', href: '/sale/marketplace', Icon: IconStore },
  { label: 'KH', href: '/sale/customers', Icon: IconUsers },
  { label: 'Bookings', href: '/sale/bookings', Icon: IconCalendar },
  { label: 'Setting', href: '/sale/settings', Icon: IconSettings },
];

export function SaleMobileShell({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  function isActive(href: string) {
    if (href === '/sale') return pathname === '/sale';
    return pathname === href || pathname.startsWith(`${href}/`);
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
                Sale
              </Text>
            </Group>
            <UnstyledButton component={Link} href="/sale/settings">
              <Text size="sm" c="dimmed">
                Setting
              </Text>
            </UnstyledButton>
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
              {desktopSections.map((section, idx) => (
                <Stack key={idx} gap={4}>
                  {section.label ? (
                    <>
                      <Divider my={4} color={colors.border} />
                      <Text
                        size="xs"
                        c="dimmed"
                        px="sm"
                        tt="uppercase"
                        style={{ letterSpacing: '0.04em' }}
                      >
                        {section.label}
                      </Text>
                    </>
                  ) : null}
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <NavLink
                        key={`${section.label}-${item.label}-${item.href}`}
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
              ))}
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
            <Title order={4} c="vbnbGreen.6" fw={600}>
              VBNB
            </Title>
          </Group>
          <UnstyledButton component={Link} href="/sale/settings">
            <Text size="sm" c="dimmed">
              Setting
            </Text>
          </UnstyledButton>
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
