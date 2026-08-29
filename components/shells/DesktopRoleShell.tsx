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
import { useDisclosure } from '@mantine/hooks';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { colors, radius } from '@/config/design-tokens';
import { shellNavLinkClass } from '@/components/shells/shell-nav-link-styles';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import type { ReactNode } from 'react';

export type NavItem = {
  label: string;
  href: string;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

export function DesktopRoleShell({
  title,
  nav,
  sections,
  accountHref,
  headerExtra,
  children,
}: {
  title: string;
  nav?: NavItem[];
  sections?: NavSection[];
  /** When set, header "Tài khoản" links here. Omit for Admin (no profile). */
  accountHref?: string;
  headerExtra?: ReactNode;
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  const resolvedSections: NavSection[] =
    sections ?? (nav ? [{ items: nav }] : []);

  function isActive(href: string) {
    if (href === '/sale' || href === '/owner' || href === '/admin') {
      return pathname === href;
    }
    if (pathname === href) return true;
    if (!pathname.startsWith(`${href}/`)) return false;

    const allHrefs = resolvedSections.flatMap((s) =>
      s.items.map((i) => i.href)
    );
    const hasMoreSpecific = allHrefs.some(
      (other) =>
        other !== href &&
        other.startsWith(`${href}/`) &&
        (pathname === other || pathname.startsWith(`${other}/`))
    );
    return !hasMoreSpecific;
  }

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 228,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={3} c="vbnbGreen.6" fw={700} style={{ letterSpacing: '-0.03em' }}>
              VBNB
            </Title>
            <Text size="sm" c="dimmed">
              {title}
            </Text>
          </Group>
          <Group gap="md">
            <LanguageSwitcher compact />
            {headerExtra}
            {accountHref ? (
              <UnstyledButton component={Link} href={accountHref}>
                <Text size="sm" c="dimmed">
                  Tài khoản
                </Text>
              </UnstyledButton>
            ) : (
              <span />
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm" style={{ display: 'flex', flexDirection: 'column' }}>
        <Stack gap="xs" style={{ flex: 1, minHeight: 0 }} justify="space-between">
          <Stack gap="xs">
            {resolvedSections.map((section, idx) => (
              <Stack key={idx} gap={4}>
                {section.label ? (
                  <>
                    {idx > 0 ? (
                      <Divider my={4} color={colors.border} />
                    ) : null}
                    <Text
                      size="xs"
                      c="dimmed"
                      px="sm"
                      pt={idx > 0 ? 4 : 0}
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
